const express = require('express');
const router = express.Router();
const Inpatient = require('../models/Inpatient');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');
const { recordInpatientPayment } = require('../utils/revenueHelper');

// @route   GET /api/inpatients
// @desc    Get all inpatients
// @access  Private (reception, superadmin, doctor)
router.get('/', protect, authorize('reception', 'superadmin', 'doctor'), async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const inpatients = await Inpatient.find(query)
      .sort({ admissionDate: -1 })
      .populate('patientId', 'childName childAge parentName parentPhone patientId');
    
    let filteredInpatients = inpatients;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInpatients = inpatients.filter(ip => 
        ip.childName?.toLowerCase().includes(searchLower) ||
        ip.patientIdNumber?.toLowerCase().includes(searchLower) ||
        ip.roomNumber?.toLowerCase().includes(searchLower) ||
        ip.parentName?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      count: filteredInpatients.length,
      data: filteredInpatients
    });
  } catch (error) {
    console.error('Get inpatients error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/inpatients/:id
// @desc    Get single inpatient by ID
// @access  Private
router.get('/:id', protect, authorize('reception', 'superadmin', 'doctor'), async (req, res) => {
  try {
    const inpatient = await Inpatient.findById(req.params.id)
      .populate('patientId', 'childName childAge parentName parentPhone patientId');
    
    if (!inpatient) {
      return res.status(404).json({ success: false, msg: 'Inpatient record not found' });
    }
    
    res.json({ success: true, data: inpatient });
  } catch (error) {
    console.error('Get inpatient error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/inpatients
// @desc    Create new inpatient record (when doctor marks patient as inpatient)
// @access  Private (doctor)
router.post('/', protect, authorize('doctor'), async (req, res) => {
  try {
    const { patientId, admissionNotes } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ success: false, msg: 'Patient ID is required' });
    }
    
    const existingInpatient = await Inpatient.findOne({ patientId, status: 'admitted' });
    if (existingInpatient) {
      return res.status(400).json({ success: false, msg: 'Patient is already admitted as inpatient' });
    }
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, msg: 'Patient not found' });
    }
    
    const inpatient = new Inpatient({
      patientId,
      childName: patient.childName,
      childAge: patient.childAge,
      parentName: patient.parentName,
      parentPhone: patient.parentPhone,
      patientIdNumber: patient.patientId,
      admissionNotes: admissionNotes || '',
      admittedBy: req.user.id,
      admittedByName: req.user.name,
      status: 'admitted'
    });
    
    await inpatient.save();
    await Patient.findByIdAndUpdate(patientId, { status: 'in-progress', isInpatient: true });
    
    res.status(201).json({
      success: true,
      msg: 'Patient marked as inpatient successfully',
      data: inpatient
    });
  } catch (error) {
    console.error('Create inpatient error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   PUT /api/inpatients/:id/assign
// @desc    Assign room and bed to inpatient
// @access  Private (reception)
router.put('/:id/assign', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const { roomNumber, bedNumber, nightlyRate, admissionNotes } = req.body;
    
    if (!roomNumber || !bedNumber) {
      return res.status(400).json({ success: false, msg: 'Room number and bed number are required' });
    }
    
    const inpatient = await Inpatient.findById(req.params.id);
    if (!inpatient) {
      return res.status(404).json({ success: false, msg: 'Inpatient record not found' });
    }
    
    inpatient.roomNumber = roomNumber;
    inpatient.bedNumber = bedNumber;
    if (nightlyRate) inpatient.nightlyRate = nightlyRate;
    if (admissionNotes) inpatient.admissionNotes = admissionNotes;
    
    await inpatient.save();
    
    res.json({
      success: true,
      msg: 'Room assigned successfully',
      data: inpatient
    });
  } catch (error) {
    console.error('Assign room error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/inpatients/:id/discharge
// @desc    Discharge inpatient and calculate charges
// @access  Private (reception)
router.put('/:id/discharge', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const { dischargeDate, nightsCount, totalAmount, discount, dischargeNotes } = req.body;
    
    const inpatient = await Inpatient.findById(req.params.id);
    if (!inpatient) {
      return res.status(404).json({ success: false, msg: 'Inpatient record not found' });
    }
    
    if (inpatient.status === 'discharged') {
      return res.status(400).json({ success: false, msg: 'Patient is already discharged' });
    }
    
    inpatient.dischargeDate = dischargeDate ? new Date(dischargeDate) : new Date();
    inpatient.nightsCount = nightsCount || 0;
    inpatient.totalAmount = totalAmount || 0;
    inpatient.discount = discount || 0;
    inpatient.dischargeNotes = dischargeNotes || '';
    inpatient.status = 'discharged';
    inpatient.dischargedBy = req.user.id;
    inpatient.dischargedByName = req.user.name;
    
    await inpatient.save();
    await Patient.findByIdAndUpdate(inpatient.patientId, { status: 'completed' });
    
    res.json({
      success: true,
      msg: 'Patient discharged successfully',
      data: inpatient
    });
  } catch (error) {
    console.error('Discharge patient error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/inpatients/:id/payment
// @desc    Process payment for inpatient
// @access  Private (reception)
router.post('/:id/payment', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const { paymentMethod, mobileNumber, bankLast4, paidAmount, paymentDate, paymentReference } = req.body;
    
    const inpatient = await Inpatient.findById(req.params.id);
    if (!inpatient) {
      return res.status(404).json({ success: false, msg: 'Inpatient record not found' });
    }
    
    if (inpatient.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, msg: 'Payment already completed' });
    }
    
    inpatient.paidAmount = paidAmount;
    inpatient.paymentStatus = 'paid';
    inpatient.paymentMethod = paymentMethod;
    if (mobileNumber) inpatient.mobileNumber = mobileNumber;
    if (bankLast4) inpatient.bankLast4 = bankLast4;
    inpatient.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    inpatient.paymentReference = paymentReference || '';
    inpatient.paymentProcessedBy = req.user.id;
    inpatient.paymentProcessedByName = req.user.name;
    
    await inpatient.save();
    
    // Record revenue
    await recordInpatientPayment(inpatient, {
      paidAmount,
      paymentMethod,
      mobileNumber,
      bankLast4,
      paymentDate: inpatient.paymentDate
    }, req.user.id, req.user.name);
    
    res.json({
      success: true,
      msg: 'Payment processed successfully',
      data: inpatient
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/inpatients/stats/summary
// @desc    Get inpatient statistics
// @access  Private (reception, superadmin)
router.get('/stats/summary', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const admitted = await Inpatient.countDocuments({ status: 'admitted' });
    const discharged = await Inpatient.countDocuments({ status: 'discharged' });
    const pendingPayment = await Inpatient.countDocuments({ status: 'discharged', paymentStatus: 'pending_payment' });
    const paid = await Inpatient.countDocuments({ paymentStatus: 'paid' });
    
    const rooms = await Inpatient.aggregate([
      { $match: { status: 'admitted', roomNumber: { $ne: null, $ne: '' } } },
      { $group: { _id: '$roomNumber', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      data: {
        admitted,
        discharged,
        pendingPayment,
        paid,
        total: admitted + discharged,
        occupancy: rooms
      }
    });
  } catch (error) {
    console.error('Get inpatient stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;