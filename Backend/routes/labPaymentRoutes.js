const express = require('express');
const router = express.Router();
const LabPayment = require('../models/LabPayment');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/lab-payments
// @desc    Save lab payment to database
// @access  Private (reception)
router.post('/', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const {
      consultationId,
      patientId,
      patientName,
      patientAge,
      parentName,
      parentPhone,
      doctorName,
      labTests,
      totalAmount,
      paidAmount,
      paymentMethod,
      mobileNumber,
      bankLast4,
      paymentDate
    } = req.body;

    const labPayment = new LabPayment({
      consultationId,
      patientId,
      patientName,
      patientAge,
      parentName,
      parentPhone,
      doctorName,
      labTests: labTests.map(test => ({
        name: test.name,
        price: test.price,
        category: test.category,
        paid: true,
        paidAt: new Date()
      })),
      totalAmount,
      paidAmount: paidAmount || totalAmount,
      paymentMethod,
      mobileNumber,
      bankLast4,
      paymentDate: paymentDate || new Date(),
      paymentStatus: 'paid',
      status: 'paid',
      processedBy: req.user.id,
      processedByName: req.user.name,
      processedAt: new Date()
    });

    await labPayment.save();

    res.status(201).json({
      success: true,
      msg: 'Lab payment saved to database',
      data: labPayment
    });
  } catch (error) {
    console.error('Save lab payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;