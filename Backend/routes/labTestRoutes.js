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
    
    if (req.user.role === 'reception') {
      query.isActive = true;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (isActive === 'true') {
      query.isActive = true;
    } else if (isActive === 'false' && req.user.role !== 'reception') {
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

// @route   POST /api/lab-tests
// @desc    Create a single lab test (supports single and multi-parameter tests)
// @access  Private (lab-tech)
router.post('/', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const { 
      name, 
      category, 
      resultType,
      normalRangeMin,
      normalRangeMax,
      normalRange,
      unit, 
      price, 
      turnaroundTime,
      qualitativeOptions,
      semiQuantitativeOptions,
      categoricalOptions,
      parameters  // NEW: for multi-parameter tests
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !price) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Missing required fields: name, category, price' 
      });
    }
    
    // For multi-parameter tests, validate parameters
    if (resultType === 'multi') {
      if (!parameters || parameters.length === 0) {
        return res.status(400).json({ 
          success: false, 
          msg: 'Multi-parameter tests require at least one parameter' 
        });
      }
      
      // Validate each parameter
      for (const param of parameters) {
        if (!param.name) {
          return res.status(400).json({ 
            success: false, 
            msg: 'All parameters must have a name' 
          });
        }
        
        if (param.resultType === 'quantitative') {
          if (!param.normalRangeMin || !param.normalRangeMax) {
            return res.status(400).json({ 
              success: false, 
              msg: `Parameter "${param.name}" requires min and max range values` 
            });
          }
        }
        
        if (param.resultType === 'qualitative') {
          if (!param.qualitativeOptions || param.qualitativeOptions.length === 0) {
            return res.status(400).json({ 
              success: false, 
              msg: `Parameter "${param.name}" requires at least one qualitative option` 
            });
          }
        }
        
        if (param.resultType === 'semi-quantitative') {
          if (!param.semiQuantitativeOptions || param.semiQuantitativeOptions.length === 0) {
            return res.status(400).json({ 
              success: false, 
              msg: `Parameter "${param.name}" requires at least one semi-quantitative option` 
            });
          }
        }
      }
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
    
    // Generate a unique code
    const prefix = category.substring(0, 3).toUpperCase();
    const count = await LabTest.countDocuments({ category });
    const uniqueCode = `${prefix}${String(count + 1).padStart(3, '0')}`;
    
    // Build the test data based on result type
    const testData = {
      name: name.trim(),
      code: uniqueCode.toUpperCase(),
      category,
      resultType: resultType || 'quantitative',
      price: parseFloat(price),
      unit: unit || '',
      turnaroundTime: turnaroundTime || '24 hours',
      createdBy: req.user.id,
      createdByName: req.user.name,
      isActive: true
    };
    
    // Add type-specific fields and generate normalRange display string
    if (resultType === 'quantitative') {
      testData.normalRangeMin = normalRangeMin ? parseFloat(normalRangeMin) : null;
      testData.normalRangeMax = normalRangeMax ? parseFloat(normalRangeMax) : null;
      testData.normalRange = `${normalRangeMin || ''} - ${normalRangeMax || ''} ${unit || ''}`.trim();
    } 
    else if (resultType === 'qualitative') {
      testData.qualitativeOptions = qualitativeOptions || [];
      testData.normalRange = (qualitativeOptions || []).join(', ');
    } 
    else if (resultType === 'semi-quantitative') {
      testData.semiQuantitativeOptions = semiQuantitativeOptions || [];
      testData.normalRange = (semiQuantitativeOptions || []).join(', ');
    } 
    else if (resultType === 'categorical') {
      testData.categoricalOptions = categoricalOptions || [];
      testData.normalRange = (categoricalOptions || []).join(', ');
    }
    else if (resultType === 'multi') {
      // Process and format parameters
      testData.parameters = parameters.map(param => ({
        name: param.name,
        resultType: param.resultType,
        normalRangeMin: param.normalRangeMin ? parseFloat(param.normalRangeMin) : null,
        normalRangeMax: param.normalRangeMax ? parseFloat(param.normalRangeMax) : null,
        unit: param.unit || '',
        qualitativeOptions: param.qualitativeOptions || [],
        semiQuantitativeOptions: param.semiQuantitativeOptions || [],
        categoricalOptions: param.categoricalOptions || []
      }));
      testData.normalRange = `${parameters.length} parameter(s)`;
    }
    else {
      testData.normalRange = normalRange || '';
    }
    
    const test = new LabTest(testData);
    await test.save();
    
    res.status(201).json({
      success: true,
      msg: 'Lab test added successfully',
      data: test
    });
  } catch (error) {
    console.error('Create lab test error:', error);
    
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
    const { 
      name, 
      category, 
      resultType,
      normalRangeMin,
      normalRangeMax,
      unit, 
      price, 
      turnaroundTime,
      qualitativeOptions,
      semiQuantitativeOptions,
      categoricalOptions,
      parameters,  // NEW: for multi-parameter tests
      isActive 
    } = req.body;
    
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
    
    if (category) test.category = category;
    if (resultType) test.resultType = resultType;
    if (price) test.price = parseFloat(price);
    if (unit !== undefined) test.unit = unit;
    if (turnaroundTime !== undefined) test.turnaroundTime = turnaroundTime;
    if (isActive !== undefined) test.isActive = isActive;
    
    // Update type-specific fields and normalRange
    if (resultType === 'quantitative') {
      test.normalRangeMin = normalRangeMin ? parseFloat(normalRangeMin) : null;
      test.normalRangeMax = normalRangeMax ? parseFloat(normalRangeMax) : null;
      test.normalRange = `${normalRangeMin || ''} - ${normalRangeMax || ''} ${unit || ''}`.trim();
    } 
    else if (resultType === 'qualitative') {
      test.qualitativeOptions = qualitativeOptions || [];
      test.normalRange = (qualitativeOptions || []).join(', ');
    } 
    else if (resultType === 'semi-quantitative') {
      test.semiQuantitativeOptions = semiQuantitativeOptions || [];
      test.normalRange = (semiQuantitativeOptions || []).join(', ');
    } 
    else if (resultType === 'categorical') {
      test.categoricalOptions = categoricalOptions || [];
      test.normalRange = (categoricalOptions || []).join(', ');
    }
    else if (resultType === 'multi') {
      test.parameters = parameters.map(param => ({
        name: param.name,
        resultType: param.resultType,
        normalRangeMin: param.normalRangeMin ? parseFloat(param.normalRangeMin) : null,
        normalRangeMax: param.normalRangeMax ? parseFloat(param.normalRangeMax) : null,
        unit: param.unit || '',
        qualitativeOptions: param.qualitativeOptions || [],
        semiQuantitativeOptions: param.semiQuantitativeOptions || [],
        categoricalOptions: param.categoricalOptions || []
      }));
      test.normalRange = `${parameters.length} parameter(s)`;
    }
    
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
    
    if (req.user.role === 'reception' && !test.isActive) {
      return res.status(403).json({ success: false, msg: 'Not authorized to view this test' });
    }
    
    res.json({ success: true, data: test });
  } catch (error) {
    console.error('Get lab test error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/lab-tests/by-name/:name
// @desc    Get lab test by exact name
// @access  Private
router.get('/by-name/:name', protect, authorize('lab-tech', 'doctor', 'superadmin', 'reception'), async (req, res) => {
  try {
    const testName = decodeURIComponent(req.params.name);
    
    const test = await LabTest.findOne({ 
      name: { $regex: new RegExp(`^${testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
     
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        msg: `Lab test "${testName}" not found` 
      });
    }
    
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

// if (!name || !category || !price) {