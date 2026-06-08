const express = require('express');
const router = express.Router();
const { Inventory } = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Private (pharmacy, superadmin, doctor)
router.get('/', protect, authorize('pharmacy', 'superadmin', 'doctor'), async (req, res) => {
  try {
    const { search, category, stockStatus, minPrice, maxPrice, isActive } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
 
    if (category && category !== 'all') {
      query.category = category;
    }

    if (stockStatus === 'low') {
      query.currentStock = { $gt: 0, $lt: 10 };
    } else if (stockStatus === 'out') {
      query.currentStock = 0;
    } else if (stockStatus === 'good') {
      query.currentStock = { $gte: 10 };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (isActive === 'true') {
      query.isActive = true;
    } else if (isActive === 'false') {
      query.isActive = false;
    }

    const inventory = await Inventory.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name username');

    res.json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/inventory/doctor-medications
// @desc    Get medications for doctors (without prices)
// @access  Private (doctor)
router.get('/doctor-medications', protect, authorize('doctor'), async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = { isActive: true, currentStock: { $gt: 0 } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const medications = await Inventory.find(query)
      .select('name category unit description currentStock minStock')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: medications.length,
      data: medications
    });
  } catch (error) {
    console.error('Get doctor medications error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/inventory/bulk
// @desc    Create multiple inventory items at once
// @access  Private (pharmacy, superadmin)
router.post('/bulk', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide an array of inventory items'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const item of items) {
      if (!item.name || item.name.trim() === '') {
        results.failed.push({ name: item.name, reason: 'Name is required' });
        continue;
      }

      if (item.currentStock === undefined || isNaN(item.currentStock) || item.currentStock < 0) {
        results.failed.push({ name: item.name, reason: 'Valid current stock is required' });
        continue;
      }

      if (item.minStock === undefined || isNaN(item.minStock) || item.minStock < 0) {
        results.failed.push({ name: item.name, reason: 'Valid minimum stock is required' });
        continue;
      }

      if (item.cost === undefined || isNaN(item.cost) || item.cost < 0) {
        results.failed.push({ name: item.name, reason: 'Valid cost is required' });
        continue;
      }

      if (item.price === undefined || isNaN(item.price) || item.price < 0) {
        results.failed.push({ name: item.name, reason: 'Valid price is required' });
        continue;
      }

      if (parseFloat(item.cost) > parseFloat(item.price)) {
        results.failed.push({ name: item.name, reason: 'Cost cannot be greater than price' });
        continue;
      }

      try {
        const existing = await Inventory.findOne({ 
          name: { $regex: new RegExp(`^${item.name.trim()}$`, 'i') }
        });

        if (existing) {
          results.failed.push({ name: item.name, reason: 'Item already exists' });
          continue;
        }

        const newItem = new Inventory({
          name: item.name.trim(),
          category: item.category || 'other',
          currentStock: parseInt(item.currentStock),
          minStock: parseInt(item.minStock),
          unit: item.unit || 'tablet',
          cost: parseFloat(item.cost),
          price: parseFloat(item.price),
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          manufacturer: item.manufacturer || '',
          description: item.description || '',
          location: item.location || '',
          createdBy: req.user.id,
          createdByName: req.user.name
        });

        await newItem.save();
        results.successful.push(newItem);
      } catch (error) {
        results.failed.push({ name: item.name, reason: error.message });
      }
    }

    res.status(201).json({
      success: true,
      msg: `${results.successful.length} item(s) created, ${results.failed.length} failed`,
      data: {
        successful: results.successful,
        failed: results.failed
      }
    });
  } catch (error) {
    console.error('Bulk create inventory error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Create a single inventory item
// @access  Private (pharmacy, superadmin)
router.post('/', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { name, category, currentStock, minStock, unit, cost, price, expiryDate, manufacturer, description, location } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, msg: 'Medication name is required' });
    }

    if (currentStock === undefined || isNaN(currentStock) || currentStock < 0) {
      return res.status(400).json({ success: false, msg: 'Valid current stock is required' });
    }

    if (cost === undefined || isNaN(cost) || cost < 0) {
      return res.status(400).json({ success: false, msg: 'Valid cost is required' });
    }

    if (price === undefined || isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, msg: 'Valid price is required' });
    }

    if (parseFloat(cost) > parseFloat(price)) {
      return res.status(400).json({ success: false, msg: 'Cost cannot be greater than price' });
    }

    const existing = await Inventory.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ success: false, msg: 'Item already exists' });
    }

    const inventory = new Inventory({
      name: name.trim(),
      category: category || 'other',
      currentStock: parseInt(currentStock),
      minStock: parseInt(minStock) || 10,
      unit: unit || 'tablet',
      cost: parseFloat(cost),
      price: parseFloat(price),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      manufacturer: manufacturer || '',
      description: description || '',
      location: location || '',
      createdBy: req.user.id,
      createdByName: req.user.name
    });

    await inventory.save();

    res.status(201).json({
      success: true,
      msg: 'Inventory item created successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private (pharmacy, superadmin)
router.get('/:id', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).populate('createdBy', 'name username');

    if (!item) {
      return res.status(404).json({ success: false, msg: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (pharmacy, superadmin)
router.put('/:id', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { name, category, currentStock, minStock, unit, cost, price, expiryDate, manufacturer, description, location, isActive } = req.body;
    const itemId = req.params.id;

    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, msg: 'Item not found' });
    }

    if (name && name !== item.name) {
      const existing = await Inventory.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: itemId }
      });
      if (existing) {
        return res.status(400).json({ success: false, msg: 'Item name already exists' });
      }
      item.name = name.trim();
    }

    if (category !== undefined) item.category = category;
    if (currentStock !== undefined) item.currentStock = parseInt(currentStock);
    if (minStock !== undefined) item.minStock = parseInt(minStock);
    if (unit !== undefined) item.unit = unit;
    if (cost !== undefined) {
      if (parseFloat(cost) > item.price) {
        return res.status(400).json({ success: false, msg: 'Cost cannot be greater than price' });
      }
      item.cost = parseFloat(cost);
    }
    if (price !== undefined) {
      if (item.cost > parseFloat(price)) {
        return res.status(400).json({ success: false, msg: 'Cost cannot be greater than price' });
      }
      item.price = parseFloat(price);
    }
    if (expiryDate !== undefined) item.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (manufacturer !== undefined) item.manufacturer = manufacturer;
    if (description !== undefined) item.description = description;
    if (location !== undefined) item.location = location;
    if (isActive !== undefined) item.isActive = isActive;

    await item.save();

    res.json({
      success: true,
      msg: 'Inventory item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id/stock
// @desc    Update stock quantity
// @access  Private (pharmacy, superadmin)
router.put('/:id/stock', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const itemId = req.params.id;

    if (quantity === undefined || isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, msg: 'Valid quantity is required' });
    }

    const item = await Inventory.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, msg: 'Item not found' });
    }

    if (operation === 'add') {
      item.currentStock += parseInt(quantity);
    } else if (operation === 'subtract') {
      if (item.currentStock < quantity) {
        return res.status(400).json({ success: false, msg: 'Insufficient stock' });
      }
      item.currentStock -= parseInt(quantity);
    } else {
      item.currentStock = parseInt(quantity);
    }

    await item.save();

    res.json({
      success: true,
      msg: 'Stock updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (pharmacy, superadmin)
router.delete('/:id', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, msg: 'Item not found' });
    }

    await item.deleteOne();

    res.json({
      success: true,
      msg: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/inventory/bulk
// @desc    Delete multiple inventory items
// @access  Private (pharmacy, superadmin)
router.delete('/bulk', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, msg: 'Please provide an array of item IDs' });
    }

    const result = await Inventory.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      msg: `${result.deletedCount} item(s) deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete inventory error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/inventory/stats/overview
// @desc    Get inventory statistics
// @access  Private (pharmacy, superadmin)
router.get('/stats/overview', protect, authorize('pharmacy', 'superadmin'), async (req, res) => {
  try {
    const [totalItems, lowStock, outOfStock, totalValue, totalCost, expiringSoon] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ currentStock: { $gt: 0, $lt: 10 } }),
      Inventory.countDocuments({ currentStock: 0 }),
      Inventory.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$price'] } } } }
      ]),
      Inventory.aggregate([
        { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$cost'] } } } }
      ]),
      Inventory.countDocuments({ 
        expiryDate: { 
          $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          $gte: new Date()
        } 
      })
    ]);

    const totalProfit = (totalValue[0]?.total || 0) - (totalCost[0]?.total || 0);

    res.json({
      success: true,
      data: {
        totalItems,
        lowStock,
        outOfStock,
        totalValue: totalValue[0]?.total || 0,
        totalCost: totalCost[0]?.total || 0,
        totalProfit,
        expiringSoon
      }
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;
