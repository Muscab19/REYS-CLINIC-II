const express = require('express');
const router = express.Router();
const LabTest = require('../models/LabTest');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/lab-tests
// @desc    Get all lab tests
// @access  Private (lab-tech, doctor, superadmin, reception)
router.get('/', protect, authorize('lab-tech', 'doctor', 'superadmin', 'reception'), async (req, res) => {
  try {
    const { search, category, isActive } = req.query;
    let query = {};
    
    // For reception, only show active tests
    if (req.user.role === 'reception') {
      query.isActive = true;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (isActive === 'true') {
      query.isActive = true;
    } else if (isActive === 'false' && req.user.role !== 'reception') {
      // Only non-reception can see inactive tests
      query.isActive = false;
    }
    
    const tests = await LabTest.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      count: tests.length,
      data: tests
    });
  } catch (error) {
    console.error('Get lab tests error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/lab-tests/bulk
// @desc    Create multiple lab tests at once
// @access  Private (lab-tech)
router.post('/bulk', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const { tests } = req.body;
    
    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide an array of tests'
      });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const test of tests) {
      if (!test.name || !test.category || !test.normalRange || !test.price) {
        results.failed.push({ 
          name: test.name || 'Unknown', 
          reason: 'Missing required fields (name, category, normalRange, price)' 
        });
        continue;
      }
      
      try {
        // Check if test already exists
        const existing = await LabTest.findOne({ 
          name: { $regex: new RegExp(`^${test.name.trim()}$`, 'i') } 
        });
        
        if (existing) {
          results.failed.push({ name: test.name, reason: 'Test already exists' });
          continue;
        }
        
        // Generate a unique code if not provided
        let uniqueCode = test.code;
        if (!uniqueCode) {
          const prefix = test.category.substring(0, 3).toUpperCase();
          const count = await LabTest.countDocuments({ category: test.category });
          uniqueCode = `${prefix}${String(count + 1).padStart(3, '0')}`;
        }
        
        const newTest = new LabTest({
          name: test.name.trim(),
          code: uniqueCode,
          category: test.category,
          normalRange: test.normalRange,
          price: parseFloat(test.price),
          unit: test.unit || '',
          description: test.description || '',
          preparation: test.preparation || '',
          turnaroundTime: test.turnaroundTime || '24 hours',
          createdBy: req.user.id,
          createdByName: req.user.name
        });
        
        await newTest.save();
        results.successful.push(newTest);
      } catch (error) {
        results.failed.push({ name: test.name, reason: error.message });
      }
    }
    
    res.status(201).json({
      success: true,
      msg: `${results.successful.length} created, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/lab-tests
// @desc    Create a single lab test
// @access  Private (lab-tech)
router.post('/', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const { name, category, normalRange, price, code, description, unit, preparation, turnaroundTime } = req.body;
    
    // Validate required fields
    if (!name || !category || !normalRange || !price) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Missing required fields: name, category, normalRange, price' 
      });
    }
    
    // Check if test with same name exists
    const existing = await LabTest.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        msg: `Test "${name}" already exists. Please use a different name.` 
      });
    }
    
    // Check if code exists (if provided)
    if (code) {
      const existingCode = await LabTest.findOne({ code: code.toUpperCase() });
      if (existingCode) {
        return res.status(400).json({ 
          success: false, 
          msg: `Code "${code}" already exists. Please use a different code.` 
        });
      }
    }
    
    // Generate a unique code if not provided
    let uniqueCode = code;
    if (!uniqueCode) {
      const prefix = category.substring(0, 3).toUpperCase();
      const count = await LabTest.countDocuments({ category });
      uniqueCode = `${prefix}${String(count + 1).padStart(3, '0')}`;
    }
    
    const test = new LabTest({
      name: name.trim(),
      code: uniqueCode.toUpperCase(),
      category,
      normalRange,
      price: parseFloat(price),
      description: description || '',
      unit: unit || '',
      preparation: preparation || '',
      turnaroundTime: turnaroundTime || '24 hours',
      createdBy: req.user.id,
      createdByName: req.user.name
    });
    
    await test.save();
    
    res.status(201).json({
      success: true,
      msg: 'Lab test added successfully',
      data: test
    });
  } catch (error) {
    console.error('Create lab test error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false, 
        msg: `${field} already exists. Please use a different value.` 
      });
    }
    
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   PUT /api/lab-tests/:id
// @desc    Update a lab test
// @access  Private (lab-tech)
router.put('/:id', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const { name, category, normalRange, price, code, description, unit, preparation, turnaroundTime, isActive } = req.body;
    const testId = req.params.id;
    
    const test = await LabTest.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, msg: 'Test not found' });
    }
    
    // Check for duplicate name (excluding current)
    if (name && name !== test.name) {
      const existing = await LabTest.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: testId }
      });
      if (existing) {
        return res.status(400).json({ success: false, msg: 'Test name already exists' });
      }
      test.name = name.trim();
    }
    
    // Check for duplicate code (excluding current)
    if (code && code !== test.code) {
      const existing = await LabTest.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: testId }
      });
      if (existing) {
        return res.status(400).json({ success: false, msg: 'Code already exists' });
      }
      test.code = code.toUpperCase();
    }
    
    if (category) test.category = category;
    if (normalRange) test.normalRange = normalRange;
    if (price) test.price = parseFloat(price);
    if (description !== undefined) test.description = description;
    if (unit !== undefined) test.unit = unit;
    if (preparation !== undefined) test.preparation = preparation;
    if (turnaroundTime !== undefined) test.turnaroundTime = turnaroundTime;
    if (isActive !== undefined) test.isActive = isActive;
    
    await test.save();
    
    res.json({
      success: true,
      msg: 'Lab test updated successfully',
      data: test
    });
  } catch (error) {
    console.error('Update lab test error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/lab-tests/:id
// @desc    Delete a lab test
// @access  Private (lab-tech)
router.delete('/:id', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const test = await LabTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, msg: 'Test not found' });
    }
    
    await test.deleteOne();
    
    res.json({
      success: true,
      msg: 'Lab test deleted successfully'
    });
  } catch (error) {
    console.error('Delete lab test error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/lab-tests/:id
// @desc    Get single lab test
// @access  Private
router.get('/:id', protect, authorize('lab-tech', 'doctor', 'superadmin', 'reception'), async (req, res) => {
  try {
    const test = await LabTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, msg: 'Test not found' });
    }
    
    // Reception can only see active tests
    if (req.user.role === 'reception' && !test.isActive) {
      return res.status(403).json({ success: false, msg: 'Not authorized to view this test' });
    }
    
    res.json({ success: true, data: test });
  } catch (error) {
    console.error('Get lab test error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// Add this new endpoint to routes/labTests.js - Exact match by name
// @route   GET /api/lab-tests/by-name/:name
// @desc    Get lab test by exact name
// @access  Private
router.get('/by-name/:name', protect, authorize('lab-tech', 'doctor', 'superadmin', 'reception'), async (req, res) => {
  try {
    const testName = decodeURIComponent(req.params.name);
    
    // Exact match search - case insensitive but exact string
    const test = await LabTest.findOne({ 
      name: { $regex: new RegExp(`^${testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
     
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        msg: `Lab test "${testName}" not found` 
      });
    }
    
    // Reception can only see active tests
    if (req.user.role === 'reception' && !test.isActive) {
      return res.status(403).json({ success: false, msg: 'Not authorized to view this test' });
    }
    
    res.json({ success: true, data: test });
  } catch (error) {
    console.error('Get lab test by name error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;