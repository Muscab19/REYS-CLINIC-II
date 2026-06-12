const express = require('express');
const router = express.Router();
const LabRequest = require('../models/LabRequest');
const Patient = require('../models/Patient');
const LabTest = require('../models/LabTest');
const LabTestCategory = require('../models/LabTestCategory');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/lab-requests
// @desc    Get all lab requests (with filters)
// @access  Private
router.get('/', protect, authorize('doctor', 'lab-tech', 'reception', 'superadmin'), async (req, res) => {
  try {
    let query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    
    // Filter by patient
    if (req.query.patientId) {
      query.patientId = req.query.patientId;
    }
    
    // Filter by payment status
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }
    
    // For doctors: only show their own requests
    if (req.user.role === 'doctor') {
      query.requestedById = req.user.id;
    }
    
    // For lab tech: show all pending and in-progress
    if (req.user.role === 'lab-tech') {
      query.status = { $in: ['pending', 'in-progress'] };
    }
    
    // For reception: show all
    if (req.user.role === 'reception') {
      // Show all requests
    }
    
    const labRequests = await LabRequest.find(query)
      .populate('patientId', 'childName childAge parentName parentPhone patientId')
      .populate('requestedById', 'name email')
      .populate('performedById', 'name email')
      .sort({ priority: -1, requestDate: -1 });
    
    res.json({
      success: true,
      count: labRequests.length,
      data: labRequests
    });
  } catch (error) {
    console.error('Error fetching lab requests:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching lab requests',
      error: error.message
    });
  }
});

// @route   GET /api/lab-requests/:id
// @desc    Get single lab request by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const labRequest = await LabRequest.findById(req.params.id)
      .populate('patientId', 'childName childAge parentName parentPhone patientId')
      .populate('requestedById', 'name email')
      .populate('performedById', 'name email');
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    // Check authorization
    if (req.user.role === 'doctor' && labRequest.requestedById.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to view this request'
      });
    }
    
    res.json({
      success: true,
      data: labRequest
    });
  } catch (error) {
    console.error('Error fetching lab request:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching lab request',
      error: error.message
    });
  }
});

// @route   POST /api/lab-requests
// @desc    Create a new lab request
// @access  Private (Doctor, Reception, Lab Tech, Superadmin)
router.post('/', protect, authorize('doctor', 'lab-tech', 'reception', 'superadmin'), async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientAge,
      parentName,
      parentPhone,
      testName,
      testCategory,
      parameters,
      normalRanges,
      clinicalInfo,
      notes,
      priority,
      requestedBy,
      requestedById,
      requestSource,
      paymentStatus,
      testPrice,
      consultationId
    } = req.body;

    console.log('Creating lab request:', { testName, patientName, requestedBy, requestSource });

    // Validate required fields
    if (!patientId || !patientName || !testName) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide patientId, patientName, and testName'
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        msg: 'Patient not found'
      });
    }

    // Get test price from LabTest if not provided
    let finalTestPrice = testPrice || 0;
    let testCategoryId = null;
    let testCategoryName = '';
    
    if (testCategory) {
      // Check if testCategory is an ObjectId or a string
      if (testCategory.match(/^[0-9a-fA-F]{24}$/)) {
        testCategoryId = testCategory;
        const category = await LabTestCategory.findById(testCategory);
        if (category) {
          testCategoryName = category.name;
        }
      } else {
        testCategoryName = testCategory;
        // Try to find category by name
        const category = await LabTestCategory.findOne({ name: { $regex: new RegExp(`^${testCategory}$`, 'i') } });
        if (category) {
          testCategoryId = category._id;
        }
      }
    }
    
    // Try to get test details from LabTest collection
    const testDetails = await LabTest.findOne({ 
      name: { $regex: new RegExp(`^${testName}$`, 'i') } 
    });
    
    if (testDetails && finalTestPrice === 0) {
      finalTestPrice = testDetails.price || 0;
    }
    
    if (testDetails && !testCategoryId && testDetails.category) {
      testCategoryId = testDetails.category;
      const category = await LabTestCategory.findById(testDetails.category);
      if (category) {
        testCategoryName = category.name;
      }
    }

    // Create lab request
    const labRequest = new LabRequest({
      patientId,
      patientName: patientName || patient.childName,
      patientAge: patientAge || patient.childAge,
      parentName: parentName || patient.parentName,
      parentPhone: parentPhone || patient.parentPhone,
      testName,
      testCategory: testCategoryId,
      testCategoryName: testCategoryName,
      parameters: parameters || (testDetails?.parameters?.map(p => p.name) || [testName]),
      normalRanges: normalRanges || {},
      clinicalInfo: clinicalInfo || '',
      notes: notes || '',
      priority: priority || 'normal',
      requestedBy: requestedBy || req.user.name,
      requestedById: requestedById || req.user.id,
      requestSource: requestSource || 'reception',
      status: 'pending',
      paymentStatus: paymentStatus || 'pending',
      testPrice: finalTestPrice,
      consultationId: consultationId || '',
      requestDate: new Date()
    });
    
    await labRequest.save();
    
    console.log(`Lab request created: ${labRequest.requestId} for ${testName}`);
    
    res.status(201).json({
      success: true,
      msg: 'Lab request created successfully',
      data: labRequest
    });
  } catch (error) {
    console.error('Error creating lab request:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while creating lab request',
      error: error.message
    });
  }
});

// @route   PUT /api/lab-requests/:id/status
// @desc    Update lab request status
// @access  Private (Lab Tech or Doctor)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['pending', 'in-progress', 'completed', 'cancelled', 'awaiting-payment'].includes(status)) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide a valid status'
      });
    }
    
    const labRequest = await LabRequest.findById(req.params.id);
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    // Check authorization
    if (req.user.role === 'doctor' && labRequest.requestedById.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to update this request'
      });
    }
    
    labRequest.status = status;
    
    if (status === 'completed') {
      labRequest.completedAt = new Date();
    }
    
    await labRequest.save();
    
    res.json({
      success: true,
      msg: `Lab request status updated to ${status}`,
      data: labRequest
    });
  } catch (error) {
    console.error('Error updating lab request status:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while updating lab request status',
      error: error.message
    });
  }
});

// @route   PUT /api/lab-requests/:id/results
// @desc    Submit test results
// @access  Private (Lab Tech only)
router.put('/:id/results', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const { results, additionalComments, performedBy, completedAt } = req.body;
    
    if (!results) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide test results'
      });
    }
    
    const labRequest = await LabRequest.findById(req.params.id);
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    // Store results
    labRequest.results = results;
    labRequest.additionalComments = additionalComments || '';
    labRequest.performedBy = performedBy || req.user.name;
    labRequest.performedById = req.user.id;
    labRequest.status = 'completed';
    labRequest.completedAt = completedAt || new Date();
    
    await labRequest.save();
    
    res.json({
      success: true,
      msg: 'Test results submitted successfully',
      data: labRequest
    });
  } catch (error) {
    console.error('Error submitting test results:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while submitting test results',
      error: error.message
    });
  }
});

// @route   PUT /api/lab-requests/:id/payment
// @desc    Update payment status for lab request
// @access  Private (Reception, Admin)
router.put('/:id/payment', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const { paymentStatus, paidAmount, paymentMethod, paymentDate } = req.body;
    
    const labRequest = await LabRequest.findById(req.params.id);
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    labRequest.paymentStatus = paymentStatus || 'paid';
    labRequest.paidAmount = paidAmount || labRequest.testPrice;
    labRequest.paymentMethod = paymentMethod || 'cash';
    labRequest.paymentDate = paymentDate || new Date();
    
    await labRequest.save();
    
    res.json({
      success: true,
      msg: 'Payment status updated successfully',
      data: labRequest
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while updating payment',
      error: error.message
    });
  }
});

// @route   DELETE /api/lab-requests/:id
// @desc    Delete a lab request (admin only)
// @access  Private (Superadmin only)
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const labRequest = await LabRequest.findById(req.params.id);
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    await labRequest.deleteOne();
    
    res.json({
      success: true,
      msg: 'Lab request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab request:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while deleting lab request',
      error: error.message
    });
  }
});

// @route   GET /api/lab-requests/stats/summary
// @desc    Get lab requests statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    let query = {};
    
    // Filter by user role
    if (req.user.role === 'doctor') {
      query.requestedById = req.user.id;
    }
    
    const total = await LabRequest.countDocuments(query);
    const pending = await LabRequest.countDocuments({ ...query, status: 'pending' });
    const inProgress = await LabRequest.countDocuments({ ...query, status: 'in-progress' });
    const completed = await LabRequest.countDocuments({ ...query, status: 'completed' });
    const cancelled = await LabRequest.countDocuments({ ...query, status: 'cancelled' });
    const urgent = await LabRequest.countDocuments({ ...query, priority: 'urgent', status: { $ne: 'completed' } });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        cancelled,
        urgent
      }
    });
  } catch (error) {
    console.error('Error fetching lab stats:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching statistics',
      error: error.message
    });
  }
});

// @route   GET /api/lab-requests/:id/with-test-details
// @desc    Get lab request with full test details
// @access  Private (Lab Tech)
router.get('/:id/with-test-details', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const labRequest = await LabRequest.findById(req.params.id)
      .populate('patientId', 'childName childAge parentName parentPhone patientId')
      .populate('requestedById', 'name email');
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    // Fetch the test definition from LabTest collection
    const testDefinition = await LabTest.findOne({ 
      name: { $regex: new RegExp(`^${labRequest.testName}$`, 'i') }
    }).populate('category', 'name color');
    
    const responseData = {
      ...labRequest.toObject(),
      testDefinition: testDefinition || null
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching lab request with test details:', error);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching lab request details',
      error: error.message
    });
  }
});

module.exports = router;
