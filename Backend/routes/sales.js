const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/sales
// @desc    Get all sales
// @access  Private (pharmacy, superadmin)
router.get('/', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, saleType } = req.query;
    let query = {};
    
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    if (saleType && saleType !== 'all') {
      query.saleType = saleType;
    }
    
    const sales = await Sale.find(query)
      .sort({ saleDate: -1 })
      .populate('items.productId', 'name category unit');
    
    res.json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/sales
// @desc    Create a new sale
// @access  Private (pharmacy)
router.post('/', protect, authorize('pharmacy'), async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount,
      tax,
      total,
      paidAmount,
      change,
      paymentMethod,
      paymentDetails,
      paymentNote
    } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, msg: 'No items in sale' });
    }
    
    // Calculate total if not provided
    let calculatedTotal = subtotal;
    if (discount) calculatedTotal -= discount;
    if (tax) calculatedTotal += tax;
    
    const sale = new Sale({
      saleType: 'walkin',
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      subtotal,
      discount: discount || 0,
      tax: tax || 0,
      total: total || calculatedTotal,
      paidAmount,
      change: change || 0,
      paymentMethod,
      paymentDetails,
      paymentNote,
      soldBy: req.user.name,
      soldById: req.user.id,
      paymentStatus: 'completed'
    });
    
    await sale.save();
    
    res.status(201).json({
      success: true,
      msg: 'Sale recorded successfully',
      data: sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/sales/stats/daily
// @desc    Get daily sales statistics
// @access  Private (pharmacy, superadmin)
router.get('/stats/daily', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sales = await Sale.find({
      saleDate: { $gte: today, $lt: tomorrow },
      paymentStatus: 'completed'
    });
    
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const count = sales.length;
    
    res.json({
      success: true,
      data: {
        total,
        count,
        average: count > 0 ? total / count : 0
      }
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;