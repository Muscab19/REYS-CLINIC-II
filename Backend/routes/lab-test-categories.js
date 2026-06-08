const express = require('express');
const router = express.Router();
const LabTestCategory = require('../models/LabTestCategory');
const LabTest = require('../models/LabTest');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/lab-test-categories
// @desc    Get all categories
// @access  Private
router.get('/', protect, authorize('lab-tech', 'doctor', 'superadmin', 'reception'), async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};
    
    if (isActive === 'true') {
      query.isActive = true;
    }
    
    const categories = await LabTestCategory.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/lab-test-categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', protect, authorize('lab-tech', 'superadmin'), async (req, res) => {
  try {
    const category = await LabTestCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, msg: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/lab-test-categories
// @desc    Create a new category
// @access  Private (lab-tech, superadmin)
router.post('/', protect, authorize('lab-tech', 'superadmin'), async (req, res) => {
  try {
    const { name, color, isActive } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, msg: 'Category name is required' });
    }
    
    // Check if category already exists
    const existing = await LabTestCategory.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existing) {
      return res.status(400).json({ success: false, msg: 'Category already exists' });
    }
    
    const category = new LabTestCategory({
      name: name.trim(),
      color: color || '#6366f1',
      isActive: isActive !== false,
      createdBy: req.user.id,
      createdByName: req.user.name
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      msg: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

// @route   PUT /api/lab-test-categories/:id
// @desc    Update a category
// @access  Private (lab-tech, superadmin)
router.put('/:id', protect, authorize('lab-tech', 'superadmin'), async (req, res) => {
  try {
    const { name, color, isActive } = req.body;
    const categoryId = req.params.id;
    
    const category = await LabTestCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, msg: 'Category not found' });
    }
    
    if (name && name !== category.name) {
      const existing = await LabTestCategory.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: categoryId }
      });
      if (existing) {
        return res.status(400).json({ success: false, msg: 'Category name already exists' });
      }
      category.name = name.trim();
    }
    
    if (color !== undefined) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    
    // Update categoryName in all lab tests using this category
    if (name && name !== category.name) {
      await LabTest.updateMany(
        { category: categoryId },
        { categoryName: category.name }
      );
    }
    
    res.json({
      success: true,
      msg: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/lab-test-categories/:id
// @desc    Delete a category
// @access  Private (lab-tech, superadmin)
router.delete('/:id', protect, authorize('lab-tech', 'superadmin'), async (req, res) => {
  try {
    const category = await LabTestCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, msg: 'Category not found' });
    }
    
    // Check if there are tests using this category
    const testsCount = await LabTest.countDocuments({ category: req.params.id });
    if (testsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        msg: `Cannot delete category. ${testsCount} test(s) are using this category. Please reassign or delete them first.` 
      });
    }
    
    await category.deleteOne();
    
    res.json({
      success: true,
      msg: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;
