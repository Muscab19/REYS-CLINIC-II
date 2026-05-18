const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');
const { recordAppointmentPayment } = require('../utils/revenueHelper');

const generateTicketId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REYS-${year}${month}${day}-${random}`;
};

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      childName,
      childAge,
      parentName,
      parentPhone,
      preferredDate,
      preferredTime,
      reason,
      previousVisits,
      notes
    } = req.body;

    if (!childName || !childAge || !parentName || !parentPhone || !preferredDate || !preferredTime || !reason) {
      return res.status(400).json({ success: false, msg: 'All required fields must be filled' });
    }

    let ticketId = generateTicketId();
    let existingAppointment = await Appointment.findOne({ ticketId });
    while (existingAppointment) {
      ticketId = generateTicketId();
      existingAppointment = await Appointment.findOne({ ticketId });
    }

    const appointment = new Appointment({
      ticketId,
      childName,
      childAge: parseInt(childAge),
      parentName,
      parentPhone,
      preferredDate: new Date(preferredDate),
      preferredTime,
      reason,
      previousVisits: previousVisits || 'no',
      notes: notes || '',
      bookedBy: req.user.id,
      status: 'confirmed'
    });

    const savedAppointment = await appointment.save();

    res.status(201).json({
      success: true,
      msg: 'Appointment booked successfully',
      data: savedAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, msg: messages.join(', ') });
    }
    res.status(500).json({ success: false, msg: 'Server error. Please try again.' });
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments (with filters)
// @access  Private
router.get('/', protect, authorize('superadmin', 'doctor', 'reception'), async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query;
    let query = {};
    
    if (status && status !== 'all') query.status = status;
    if (startDate || endDate) {
      query.preferredDate = {};
      if (startDate) query.preferredDate.$gte = new Date(startDate);
      if (endDate) query.preferredDate.$lte = new Date(endDate);
    }
    if (req.user.role !== 'superadmin') query.bookedBy = req.user.id;
    if (search) {
      query.$or = [
        { childName: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const appointments = await Appointment.find(query)
      .sort({ preferredDate: -1 })
      .populate('bookedBy', 'name username');
    
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('bookedBy', 'name username phone');
    if (!appointment) return res.status(404).json({ success: false, msg: 'Appointment not found' });
    if (req.user.role !== 'superadmin' && appointment.bookedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, msg: 'Not authorized' });
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, cancelledReason } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, msg: 'Invalid status' });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, msg: 'Appointment not found' });
    
    if (req.user.role !== 'superadmin' && req.user.role !== 'reception' && appointment.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, msg: 'Not authorized' });
    }
    
    const updates = { status };
    if (status === 'completed') updates.completedAt = new Date();
    if (status === 'cancelled') {
      updates.cancelledAt = new Date();
      updates.cancelledReason = cancelledReason || 'Cancelled by user';
    }
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, msg: `Appointment ${status} successfully`, data: updatedAppointment });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment (admin only)
// @access  Private (superadmin only)
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, msg: 'Appointment not found' });
    await appointment.deleteOne();
    res.json({ success: true, msg: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/appointments/:id/payment
// @desc    Process payment for appointment
// @access  Private (reception, superadmin)
router.put('/:id/payment', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const { paidAmount, paymentMethod, mobileNumber, bankLast4, paymentDetails, receivedBy, paymentDate } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, msg: 'Appointment not found' });
    
    const consultationFee = appointment.consultationFee || 25;
    const newPaidAmount = (appointment.paidAmount || 0) + paidAmount;
    const isFullyPaid = newPaidAmount >= consultationFee;
    
    const paymentEntry = {
      amount: paidAmount,
      method: paymentMethod,
      paymentDetails: { mobileNumber, bankLast4, ...paymentDetails },
      date: paymentDate ? new Date(paymentDate) : new Date(),
      receivedBy: receivedBy || req.user.name
    };
    
    const updates = {
      paidAmount: newPaidAmount,
      paymentStatus: isFullyPaid ? 'paid' : 'partial',
      paymentMethod: paymentMethod,
      paymentDetails: paymentEntry.paymentDetails,
      paymentDate: paymentEntry.date,
      receivedBy: receivedBy || req.user.name,
      receivedById: req.user.id,
      $push: { paymentHistory: paymentEntry }
    };
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true });
    
    // Record revenue
    await recordAppointmentPayment(appointment, {
      paidAmount,
      paymentMethod,
      mobileNumber,
      bankLast4,
      paymentDate: paymentEntry.date
    }, req.user.id, req.user.name);
    
    res.json({
      success: true,
      msg: isFullyPaid ? 'Payment completed successfully' : 'Partial payment recorded',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/appointments/payments/today
// @desc    Get today's payment summary
// @access  Private (reception, superadmin)
router.get('/payments/today', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const payments = await Appointment.find({
      paymentDate: { $gte: today, $lt: tomorrow },
      paymentStatus: { $in: ['paid', 'partial'] }
    });
    
    const totalCollected = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const cashPayments = payments.filter(p => p.paymentMethod === 'cash');
    const cardPayments = payments.filter(p => p.paymentMethod === 'card');
    const mobilePayments = payments.filter(p => p.paymentMethod === 'mobile');
    const bankPayments = payments.filter(p => p.paymentMethod === 'bank');
    
    res.json({
      success: true,
      data: {
        totalCollected,
        totalTransactions: payments.length,
        cashTotal: cashPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
        cardTotal: cardPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
        mobileTotal: mobilePayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
        bankTotal: bankPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
        appointments: payments
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/appointments/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (superadmin, reception)
router.get('/analytics/revenue', protect, authorize('superadmin', 'reception'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { paymentStatus: 'paid' };
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    
    const appointments = await Appointment.find(query);
    const totalRevenue = appointments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
    const byMethod = {
      cash: appointments.filter(a => a.paymentMethod === 'cash').reduce((sum, a) => sum + (a.paidAmount || 0), 0),
      card: appointments.filter(a => a.paymentMethod === 'card').reduce((sum, a) => sum + (a.paidAmount || 0), 0),
      mobile: appointments.filter(a => a.paymentMethod === 'mobile').reduce((sum, a) => sum + (a.paidAmount || 0), 0),
      bank: appointments.filter(a => a.paymentMethod === 'bank').reduce((sum, a) => sum + (a.paidAmount || 0), 0)
    };
    
    const dailyBreakdown = {};
    appointments.forEach(app => {
      const dateKey = app.paymentDate.toISOString().split('T')[0];
      dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + (app.paidAmount || 0);
    });
    
    res.json({
      success: true,
      data: {
        totalRevenue,
        byPaymentMethod: byMethod,
        dailyBreakdown,
        totalAppointments: appointments.length,
        averagePerAppointment: appointments.length > 0 ? totalRevenue / appointments.length : 0
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;