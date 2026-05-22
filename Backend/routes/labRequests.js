const express = require('express');
const router = express.Router();
const LabRequest = require('../models/LabRequest');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/lab-requests
// @desc    Get all lab requests (with filters)
// @access  Private (Doctor, Lab Tech, Admin)
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
    
    // Filter by doctor (requested by)
    if (req.query.requestedById) {
      query.requestedById = req.query.requestedById;
    }
    
    // For doctors: only show their own requests
    if (req.user.role === 'doctor') {
      query.requestedById = req.user.id;
    }
    
    // For lab tech: show all except cancelled
    if (req.user.role === 'lab-tech') {
      query.status = { $ne: 'cancelled' };
    }
    
    // For receptionist: show only active requests
    if (req.user.role === 'receptionist') {
      query.status = { $in: ['pending', 'in-progress'] };
    }
    
    const labRequests = await LabRequest.find(query)
      .populate('patientId', 'childName childAge parentName parentPhone')
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
      .populate('patientId', 'childName childAge parentName parentPhone')
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
      requestedById
    } = req.body;

    console.log('Creating lab request:', { testName, patientName, requestedBy });

    // Validate required fields
    if (!patientId || !patientName || !testName || !requestedBy) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide patientId, patientName, testName, and requestedBy'
      });
    }

    // Check if patient exists
    const Patient = require('../models/Patient');
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        msg: 'Patient not found'
      });
    }

    // Generate unique request ID
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const requestId = `LAB-${timestamp}-${random}`;
    
    // Create lab request
    const labRequest = new LabRequest({
      requestId,
      patientId,
      patientName: patientName || patient.childName,
      patientAge: patientAge || patient.childAge,
      parentName: parentName || patient.parentName,
      parentPhone: parentPhone || patient.parentPhone,
      testName,
      testCategory: testCategory || 'other',
      parameters: parameters || [],
      normalRanges: normalRanges || new Map(),
      clinicalInfo: clinicalInfo || '',
      notes: notes || '',
      priority: priority || 'normal',
      requestedBy: requestedBy,
      requestedById: requestedById || req.user.id,
      status: 'pending',
      requestDate: new Date()
    });
    
    await labRequest.save();
    
    console.log(`Lab request created: ${requestId} for ${testName}`);
    
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
    
    if (!status || !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
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
      labRequest.completedAt = Date.now();
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
    
    // Fetch test definition to get parameter names
    const LabTest = require('../models/LabTest');
    const testDefinition = await LabTest.findOne({ 
      name: { $regex: new RegExp(`^${labRequest.testName}$`, 'i') }
    });
    
    // Build expected parameter names based on test type
    let expectedParams = [];
    
    if (testDefinition && testDefinition.resultType === 'multi' && testDefinition.parameters) {
      // For multi-parameter tests, use parameter names from definition
      expectedParams = testDefinition.parameters.map(p => p.name);
    } else if (labRequest.parameters && labRequest.parameters.length > 0) {
      // Fallback to stored parameters
      expectedParams = labRequest.parameters;
    }
    
    // Validate all expected parameters have results
    if (expectedParams.length > 0) {
      const missingParams = expectedParams.filter(param => {
        // Check if result exists for this parameter
        return !results[param] && results[param] !== 0 && results[param] !== false;
      });
      
      if (missingParams.length > 0) {
        return res.status(400).json({
          success: false,
          msg: `Missing results for parameters: ${missingParams.join(', ')}`
        });
      }
    }
    
    // Store results as-is (they already use proper parameter names)
    labRequest.results = results;
    labRequest.additionalComments = additionalComments || '';
    labRequest.performedBy = performedBy || req.user.name;
    labRequest.performedById = req.user.id;
    labRequest.status = 'completed';
    labRequest.completedAt = completedAt || Date.now();
    
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

// @route   DELETE /api/lab-requests/:id
// @desc    Delete a lab request (admin only)
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const labRequest = await LabRequest.findById(req.params.id);
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    await labRequest.remove();
    
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
    
    // Get recent requests
    const recentRequests = await LabRequest.find(query)
      .sort({ requestDate: -1 })
      .limit(10)
      .populate('patientId', 'childName')
      .populate('requestedById', 'name');
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        cancelled,
        urgent,
        recentRequests
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
// @desc    Get lab request with full test details including parameters and result types
// @access  Private (Lab Tech)
router.get('/:id/with-test-details', protect, authorize('lab-tech'), async (req, res) => {
  try {
    const labRequest = await LabRequest.findById(req.params.id)
      .populate('patientId', 'childName childAge parentName parentPhone')
      .populate('requestedById', 'name email');
    
    if (!labRequest) {
      return res.status(404).json({
        success: false,
        msg: 'Lab request not found'
      });
    }
    
    // Fetch the test definition from LabTest collection
    const LabTest = require('../models/LabTest');
    const testDefinition = await LabTest.findOne({ 
      name: { $regex: new RegExp(`^${labRequest.testName}$`, 'i') }
    });
    
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

// router.put('/:id/results', protect, authorize('lab-tech'), async (req, res) => {