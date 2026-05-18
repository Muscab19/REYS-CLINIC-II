const express = require('express');
const router = express.Router();
const LabPayment = require('../models/LabPayment');
const Patient = require('../models/Patient');
const LabRequest = require('../models/LabRequest');
const LabTest = require('../models/LabTest');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/lab-payments
// @desc    Get all pending lab payments
// @access  Private (reception, superadmin)
router.get('/', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const { status, patientId } = req.query;
    let query = { status: 'pending_payment' };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    const labPayments = await LabPayment.find(query)
      .sort({ createdAt: -1 })
      .populate('patientId', 'childName childAge parentName parentPhone patientId');
    
    res.json({
      success: true,
      count: labPayments.length,
      data: labPayments
    });
  } catch (error) {
    console.error('Get lab payments error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/lab-payments/:id
// @desc    Get single lab payment
// @access  Private
router.get('/:id', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const labPayment = await LabPayment.findById(req.params.id)
      .populate('patientId', 'childName childAge parentName parentPhone patientId');
    
    if (!labPayment) {
      return res.status(404).json({ success: false, msg: 'Lab payment record not found' });
    }
    
    res.json({ success: true, data: labPayment });
  } catch (error) {
    console.error('Get lab payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/lab-payments
// @desc    Create a new lab payment record (from doctor consultation)
// @access  Private (doctor)
router.post('/', protect, authorize('doctor'), async (req, res) => {
  try {
    const {
      patientId,
      consultationId,
      childName,
      childAge,
      parentName,
      parentPhone,
      patientIdNumber,
      ticketId,
      labTests,
      totalAmount
    } = req.body;
    
    if (!patientId || !consultationId || !labTests || labTests.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Patient ID, consultation ID, and lab tests are required' 
      });
    }
    
    // Check if payment record already exists for this consultation
    const existingPayment = await LabPayment.findOne({ consultationId });
    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Payment record already exists for this consultation' 
      });
    }
    
    const labPayment = new LabPayment({
      patientId,
      consultationId,
      childName,
      childAge,
      parentName,
      parentPhone,
      patientIdNumber,
      ticketId,
      labTests: labTests.map(test => ({
        ...test,
        paid: false,
        requestedAt: new Date()
      })),
      totalAmount,
      paymentStatus: 'pending',
      status: 'pending_payment'
    });
    
    await labPayment.save();
    
    res.status(201).json({
      success: true,
      msg: 'Lab payment record created',
      data: labPayment
    });
  } catch (error) {
    console.error('Create lab payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   PUT /api/lab-payments/:id/pay
// @desc    Process payment for lab tests
// @access  Private (reception)
router.put('/:id/pay', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const {
      paymentMethod,
      mobileNumber,
      bankLast4,
      paidAmount,
      paymentReference
    } = req.body;
    
    const labPayment = await LabPayment.findById(req.params.id);
    if (!labPayment) {
      return res.status(404).json({ success: false, msg: 'Lab payment record not found' });
    }
    
    if (labPayment.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, msg: 'Payment already processed' });
    }
    
    // Update payment record
    labPayment.paymentStatus = 'paid';
    labPayment.status = 'paid';
    labPayment.paidAmount = paidAmount || labPayment.totalAmount;
    labPayment.paymentMethod = paymentMethod;
    if (mobileNumber) labPayment.mobileNumber = mobileNumber;
    if (bankLast4) labPayment.bankLast4 = bankLast4;
    labPayment.paymentDate = new Date();
    labPayment.paymentReference = paymentReference || '';
    labPayment.processedBy = req.user.id;
    labPayment.processedByName = req.user.name;
    labPayment.processedAt = new Date();
    
    // Mark all lab tests as paid
    labPayment.labTests = labPayment.labTests.map(test => ({
      ...test,
      paid: true,
      paidAt: new Date()
    }));
    
    await labPayment.save();
    
    // CREATE LAB REQUESTS AFTER PAYMENT
    const labRequestsCreated = [];
    const labErrors = [];
    
    for (const labTest of labPayment.labTests) {
      try {
        // Get lab test details from database
        let testDetails = await LabTest.findOne({ name: labTest.name });
        
        const labRequestData = {
          patientId: labPayment.patientId,
          patientName: labPayment.childName,
          patientAge: labPayment.childAge,
          parentName: labPayment.parentName,
          parentPhone: labPayment.parentPhone,
          testName: labTest.name,
          testCategory: labTest.category || 'biochemistry',
          parameters: testDetails?.parameters || ['Result'],
          normalRanges: testDetails?.normalRanges || {},
          clinicalInfo: labTest.notes || '',
          notes: `Lab test requested by ${labTest.requestedBy || 'Doctor'} during consultation. Payment of $${labTest.price} collected by ${req.user.name} on ${new Date().toLocaleString()}. Payment method: ${paymentMethod === 'mobile' ? 'Mobile Money' : (paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash')}`,
          priority: 'normal',
          requestedBy: labTest.requestedBy || 'Doctor',
          requestedById: labPayment.processedBy
        };
        
        const LabRequestModel = require('../models/LabRequest');
        const labRequest = new LabRequestModel(labRequestData);
        await labRequest.save();
        
        labRequestsCreated.push({
          name: labTest.name,
          requestId: labRequest.requestId
        });
      } catch (error) {
        labErrors.push({ name: labTest.name, error: error.message });
        console.error(`Error creating lab request for ${labTest.name}:`, error);
      }
    }
    
    res.json({
      success: true,
      msg: `Payment processed. ${labRequestsCreated.length} lab requests sent to laboratory.`,
      data: labPayment,
      labRequestsCreated,
      labErrors
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   GET /api/lab-payments/patient/:patientId
// @desc    Get lab payments by patient
// @access  Private
router.get('/patient/:patientId', protect, authorize('reception', 'superadmin', 'doctor'), async (req, res) => {
  try {
    const labPayments = await LabPayment.find({ patientId: req.params.patientId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: labPayments.length,
      data: labPayments
    });
  } catch (error) {
    console.error('Get patient lab payments error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/lab-payments/stats/summary
// @desc    Get lab payment statistics
// @access  Private (reception, superadmin)
router.get('/stats/summary', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const pending = await LabPayment.countDocuments({ status: 'pending_payment' });
    const paid = await LabPayment.countDocuments({ status: 'paid' });
    const totalAmount = await LabPayment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    
    const recentPayments = await LabPayment.find({ status: 'paid' })
      .sort({ processedAt: -1 })
      .limit(10)
      .populate('patientId', 'childName');
    
    res.json({
      success: true,
      data: {
        pending,
        paid,
        totalCollected: totalAmount[0]?.total || 0,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Get lab payment stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;