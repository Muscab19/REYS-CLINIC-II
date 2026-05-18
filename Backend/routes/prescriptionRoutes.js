const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { Inventory, InventoryTransaction } = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/prescriptions
// @desc    Create a new prescription (from doctor consultation)
// @access  Private (doctor)
router.post('/', protect, authorize('doctor'), async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientAge,
      parentName,
      parentPhone,
      doctor,
      medications,
      urgency,
      notes,
      consultationId
    } = req.body;

    console.log('Creating prescription for patient:', patientName);
    console.log('Medications:', medications);

    if (!patientId || !patientName || !medications || medications.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Patient information and at least one medication are required' 
      });
    }

    const prescription = new Prescription({
      patientId,
      patientName,
      patientAge,
      parentName,
      parentPhone,
      doctor,
      doctorId: req.user.id,
      medications: medications.map(med => ({
        name: med.name,
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        duration: med.duration || '',
        route: med.route || '',
        instructions: med.instructions || '',
        quantity: med.quantity || 1,
        unit: med.unit || 'tablet'
      })),
      urgency: urgency || 'normal',
      notes: notes || '',
      consultationId: consultationId ? String(consultationId) : '',
      status: 'pending'
    });

    await prescription.save();
    console.log('Prescription created:', prescription.prescriptionId);

    res.status(201).json({
      success: true,
      msg: 'Prescription created successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   PUT /api/prescriptions/:id/dispense
// @desc    Mark prescription as dispensed and decrease inventory
// @access  Private (pharmacy)
router.put('/:id/dispense', protect, authorize('pharmacy'), async (req, res) => {
  try {
    const { dispensedBy } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, msg: 'Prescription not found' });
    }

    if (prescription.status === 'dispensed') {
      return res.status(400).json({ success: false, msg: 'Prescription already dispensed' });
    }

    const stockUpdates = [];
    const errors = [];

    // Process each medication and update inventory
    for (const med of prescription.medications) {
      // Find the inventory item by name
      const inventoryItem = await Inventory.findOne({ 
        name: { $regex: new RegExp(`^${med.name}$`, 'i') }
      });

      if (!inventoryItem) {
        errors.push(`Medication "${med.name}" not found in inventory`);
        continue;
      }

      const quantityToDeduct = med.quantity || 1;

      if (inventoryItem.currentStock < quantityToDeduct) {
        errors.push(`Insufficient stock for "${med.name}". Available: ${inventoryItem.currentStock} ${inventoryItem.unit}(s), Required: ${quantityToDeduct}`);
        continue;
      }

      // Calculate new stock
      const previousStock = inventoryItem.currentStock;
      const newStock = previousStock - quantityToDeduct;

      // Update inventory stock
      inventoryItem.currentStock = newStock;
      await inventoryItem.save();

      // Create transaction record
      const transaction = new InventoryTransaction({
        medicationId: inventoryItem._id,
        medicationName: inventoryItem.name,
        type: 'out',
        quantity: quantityToDeduct,
        previousStock: previousStock,
        newStock: newStock,
        reason: 'prescription',
        reference: prescription.prescriptionId,
        performedBy: req.user.id,
        performedByName: req.user.name,
        notes: `Dispensed for patient: ${prescription.patientName}`
      });
      await transaction.save();

      stockUpdates.push({
        name: inventoryItem.name,
        previousStock,
        newStock,
        quantity: quantityToDeduct
      });

      // Check low stock alert
      if (inventoryItem.isLowStock()) {
        console.log(`LOW STOCK ALERT: ${inventoryItem.name} is at ${inventoryItem.currentStock} ${inventoryItem.unit}(s)`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Stock errors occurred',
        errors: errors,
        stockUpdates: stockUpdates
      });
    }

    // Update prescription status
    prescription.status = 'dispensed';
    prescription.dispensedAt = new Date();
    prescription.dispensedBy = dispensedBy || req.user.name;

    await prescription.save();

    res.json({
      success: true,
      msg: `Prescription dispensed successfully. Stock updated for ${stockUpdates.length} item(s).`,
      data: {
        prescription,
        stockUpdates
      }
    });
  } catch (error) {
    console.error('Dispense prescription error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   PUT /api/prescriptions/:id/partial-dispense
// @desc    Partially dispense prescription
// @access  Private (pharmacy)
router.put('/:id/partial-dispense', protect, authorize('pharmacy'), async (req, res) => {
  try {
    const { dispensedBy, dispensedItems } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, msg: 'Prescription not found' });
    }

    if (prescription.status === 'dispensed') {
      return res.status(400).json({ success: false, msg: 'Prescription already fully dispensed' });
    }

    const stockUpdates = [];
    const errors = [];

    for (const item of dispensedItems) {
      const med = prescription.medications.find(m => m.name === item.name);
      if (!med) {
        errors.push(`Medication "${item.name}" not found in prescription`);
        continue;
      }

      const inventoryItem = await Inventory.findOne({ 
        name: { $regex: new RegExp(`^${med.name}$`, 'i') }
      });

      if (!inventoryItem) {
        errors.push(`Medication "${med.name}" not found in inventory`);
        continue;
      }

      const quantityToDeduct = item.dispensedQuantity;

      if (inventoryItem.currentStock < quantityToDeduct) {
        errors.push(`Insufficient stock for "${med.name}". Available: ${inventoryItem.currentStock}`);
        continue;
      }

      const previousStock = inventoryItem.currentStock;
      const newStock = previousStock - quantityToDeduct;

      inventoryItem.currentStock = newStock;
      await inventoryItem.save();

      const transaction = new InventoryTransaction({
        medicationId: inventoryItem._id,
        medicationName: inventoryItem.name,
        type: 'out',
        quantity: quantityToDeduct,
        previousStock: previousStock,
        newStock: newStock,
        reason: 'prescription',
        reference: prescription.prescriptionId,
        performedBy: req.user.id,
        performedByName: req.user.name,
        notes: `Partially dispensed for patient: ${prescription.patientName}`
      });
      await transaction.save();

      stockUpdates.push({
        name: inventoryItem.name,
        previousStock,
        newStock,
        quantity: quantityToDeduct
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, msg: 'Stock errors occurred', errors });
    }

    prescription.status = 'partial';
    prescription.dispensedAt = new Date();
    prescription.dispensedBy = dispensedBy || req.user.name;
    await prescription.save();

    res.json({
      success: true,
      msg: 'Partial dispense completed successfully',
      data: { prescription, stockUpdates }
    });
  } catch (error) {
    console.error('Partial dispense error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/prescriptions/inventory/stock-alerts
// @desc    Get low stock alerts
// @access  Private (pharmacy, superadmin)
router.get('/inventory/stock-alerts', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$minStock'] }
    }).sort({ currentStock: 1 });

    const outOfStockItems = await Inventory.find({ currentStock: 0 });

    res.json({
      success: true,
      data: {
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        totalLowStock: lowStockItems.length,
        totalOutOfStock: outOfStockItems.length
      }
    });
  } catch (error) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/prescriptions/inventory/transactions
// @desc    Get inventory transaction history
// @access  Private (pharmacy, superadmin)
router.get('/inventory/transactions', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { limit = 100, medicationId } = req.query;
    let query = {};
    
    if (medicationId) {
      query.medicationId = medicationId;
    }

    const transactions = await InventoryTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('performedBy', 'name');

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/prescriptions/inventory/restock
// @desc    Restock inventory
// @access  Private (pharmacy, superadmin)
router.post('/inventory/restock', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { medicationId, quantity, notes } = req.body;

    const inventoryItem = await Inventory.findById(medicationId);
    if (!inventoryItem) {
      return res.status(404).json({ success: false, msg: 'Medication not found' });
    }

    const previousStock = inventoryItem.currentStock;
    const newStock = previousStock + quantity;

    inventoryItem.currentStock = newStock;
    await inventoryItem.save();

    const transaction = new InventoryTransaction({
      medicationId: inventoryItem._id,
      medicationName: inventoryItem.name,
      type: 'in',
      quantity: quantity,
      previousStock: previousStock,
      newStock: newStock,
      reason: 'restock',
      performedBy: req.user.id,
      performedByName: req.user.name,
      notes: notes || 'Restocked inventory'
    });
    await transaction.save();

    res.json({
      success: true,
      msg: `Restocked ${quantity} ${inventoryItem.unit}(s) of ${inventoryItem.name}`,
      data: {
        inventory: inventoryItem,
        transaction
      }
    });
  } catch (error) {
    console.error('Restock error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/prescriptions
// @desc    Get all prescriptions
// @access  Private (pharmacy, doctor, superadmin)
router.get('/', protect, authorize('pharmacy', 'doctor', 'superadmin'), async (req, res) => {
  try {
    const { status, patientId } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (patientId) {
      query.patientId = patientId;
    }

    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 })
      .populate('patientId', 'childName parentName parentPhone')
      .populate('doctorId', 'name');

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/prescriptions/:id
// @desc    Get single prescription
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'childName parentName parentPhone')
      .populate('doctorId', 'name');

    if (!prescription) {
      return res.status(404).json({ success: false, msg: 'Prescription not found' });
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/prescriptions/:id/cancel
// @desc    Cancel prescription (restore stock if partially dispensed)
// @access  Private (pharmacy, doctor)
router.put('/:id/cancel', protect, authorize('pharmacy', 'doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, msg: 'Prescription not found' });
    }

    // If prescription was partially or fully dispensed, we need to restore stock?
    // This is a business decision - usually cancelled prescriptions don't restore stock
    // if already dispensed. For pending ones, no stock was taken.

    prescription.status = 'cancelled';
    await prescription.save();

    res.json({
      success: true,
      msg: 'Prescription cancelled successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Cancel prescription error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get prescriptions by patient
// @access  Private
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/prescriptions/:id/payment
// @desc    Record payment for prescription
// @access  Private (pharmacy)
router.put('/:id/payment', protect, authorize('pharmacy'), async (req, res) => {
  try {
    const { paidAmount, paymentStatus, paymentMethod, paymentNote, paymentDate } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, msg: 'Prescription not found' });
    }

    const totalAmount = prescription.medications.reduce((sum, med) => sum + (med.price || 0), 0);
    const paymentRecord = {
      amount: paidAmount - (prescription.paidAmount || 0),
      method: paymentMethod,
      date: new Date(paymentDate || Date.now()),
      receivedBy: req.user.name,
      note: paymentNote || ''
    };

    prescription.paidAmount = paidAmount;
    prescription.paymentStatus = paymentStatus;
    prescription.paymentHistory = [...(prescription.paymentHistory || []), paymentRecord];
    
    // Also store payment method on prescription
    prescription.paymentMethod = paymentMethod;

    await prescription.save();

    res.json({
      success: true,
      msg: 'Payment recorded successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;

// router.put('/:id/payment', protect, authorize('pharmacy'), async (req, res) => {