const express = require('express');
const router = express.Router();
const RevenueTransaction = require('../models/RevenueTransaction');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/revenue/transaction
// @desc    Create a new revenue transaction
// @access  Private (various roles)
router.post('/transaction', protect, async (req, res) => {
  try {
    const {
      transactionType,
      source,
      amount,
      paymentMethod,
      paymentDetails,
      patientId,
      patientName,
      patientPhone,
      doctorName,
      doctorId,
      referenceId,
      referenceType,
      items,
      description,
      notes,
      transactionDate
    } = req.body;

    // Validate required fields
    if (!transactionType || !source || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        msg: 'Transaction type, source, and valid amount are required'
      });
    }

    const transaction = new RevenueTransaction({
      transactionId: `REV-${Date.now()}`,
      transactionType,
      source,
      amount,
      paymentMethod: paymentMethod || 'cash',
      paymentDetails: paymentDetails || {},
      patientId,
      patientName,
      patientPhone,
      doctorName,
      doctorId,
      referenceId,
      referenceType,
      items: items || [],
      description,
      notes,
      transactionDate: transactionDate || new Date(),
      processedBy: req.user.id,
      processedByName: req.user.name,
      status: 'completed'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      msg: 'Revenue transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Create revenue transaction error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   GET /api/revenue/transactions
// @desc    Get revenue transactions with filters
// @access  Private (superadmin)
router.get('/transactions', protect, authorize('superadmin'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      source,
      paymentMethod,
      transactionType,
      search,
      page = 1,
      limit = 100
    } = req.query;

    let query = {};

    // Date range filter
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate + 'T23:59:59');
      }
    }

    // Source filter
    if (source && source !== 'all') {
      query.source = source;
    }

    // Transaction type filter
    if (transactionType && transactionType !== 'all') {
      query.transactionType = transactionType;
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }

    // Search
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      RevenueTransaction.find(query)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('patientId', 'childName parentName patientId')
        .populate('doctorId', 'name')
        .populate('processedBy', 'name'),
      RevenueTransaction.countDocuments(query)
    ]);

    // Calculate summary
    const summary = await RevenueTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Group by source
    const bySource = await RevenueTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Group by payment method
    const byPaymentMethod = await RevenueTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily breakdown
    const dailyBreakdown = await RevenueTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalRevenue: summary[0]?.totalRevenue || 0,
          averageAmount: summary[0]?.avgAmount || 0,
          totalTransactions: summary[0]?.count || 0
        },
        bySource,
        byPaymentMethod,
        dailyBreakdown,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get revenue transactions error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/revenue/stats
// @desc    Get revenue statistics for dashboard
// @access  Private (superadmin)
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get stats for different periods
    const [todayStats, weekStats, monthStats, yearStats, allTimeStats] = await Promise.all([
      RevenueTransaction.aggregate([
        { $match: { transactionDate: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      RevenueTransaction.aggregate([
        { $match: { transactionDate: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      RevenueTransaction.aggregate([
        { $match: { transactionDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      RevenueTransaction.aggregate([
        { $match: { transactionDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      RevenueTransaction.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    // Get top revenue sources
    const topSources = await RevenueTransaction.aggregate([
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Get last 30 days revenue trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDayTrend = await RevenueTransaction.aggregate([
      { $match: { transactionDate: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        today: {
          total: todayStats[0]?.total || 0,
          count: todayStats[0]?.count || 0
        },
        thisWeek: {
          total: weekStats[0]?.total || 0,
          count: weekStats[0]?.count || 0
        },
        thisMonth: {
          total: monthStats[0]?.total || 0,
          count: monthStats[0]?.count || 0
        },
        thisYear: {
          total: yearStats[0]?.total || 0,
          count: yearStats[0]?.count || 0
        },
        allTime: {
          total: allTimeStats[0]?.total || 0,
          count: allTimeStats[0]?.count || 0
        },
        topSources,
        thirtyDayTrend
      }
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/revenue/transactions/:id
// @desc    Get single revenue transaction by ID
// @access  Private (superadmin)
router.get('/transactions/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const transaction = await RevenueTransaction.findById(req.params.id)
      .populate('patientId', 'childName parentName patientId')
      .populate('doctorId', 'name')
      .populate('processedBy', 'name');

    if (!transaction) {
      return res.status(404).json({ success: false, msg: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Get revenue transaction error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/revenue/export
// @desc    Export revenue data as CSV
// @access  Private (superadmin)
router.get('/export', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { startDate, endDate, source, paymentMethod } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate + 'T23:59:59');
    }

    if (source && source !== 'all') query.source = source;
    if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;

    const transactions = await RevenueTransaction.find(query)
      .sort({ transactionDate: -1 })
      .populate('patientId', 'childName patientId')
      .populate('doctorId', 'name')
      .populate('processedBy', 'name');

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Export revenue error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/revenue/refund/:id
// @desc    Refund a transaction (create negative transaction)
// @access  Private (superadmin)
router.post('/refund/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { reason, refundAmount } = req.body;
    const originalTransaction = await RevenueTransaction.findById(req.params.id);

    if (!originalTransaction) {
      return res.status(404).json({ success: false, msg: 'Transaction not found' });
    }

    if (originalTransaction.status === 'refunded') {
      return res.status(400).json({ success: false, msg: 'Transaction already refunded' });
    }

    const refundTransaction = new RevenueTransaction({
      transactionId: `REF-${Date.now()}`,
      transactionType: originalTransaction.transactionType,
      source: originalTransaction.source,
      amount: -(refundAmount || originalTransaction.amount),
      paymentMethod: originalTransaction.paymentMethod,
      patientId: originalTransaction.patientId,
      patientName: originalTransaction.patientName,
      patientPhone: originalTransaction.patientPhone,
      referenceId: originalTransaction.transactionId,
      referenceType: 'refund',
      description: `Refund for ${originalTransaction.transactionId}: ${reason || 'No reason provided'}`,
      notes: reason,
      processedBy: req.user.id,
      processedByName: req.user.name,
      status: 'completed'
    });

    await refundTransaction.save();

    // Mark original as refunded
    originalTransaction.status = 'refunded';
    await originalTransaction.save();

    res.json({
      success: true,
      msg: 'Refund processed successfully',
      data: {
        refund: refundTransaction,
        original: originalTransaction
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;