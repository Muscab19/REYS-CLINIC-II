const express = require('express');
const router = express.Router();
const { Diagnosis, Service } = require('../models/DoctorMasterData');
const { protect, authorize } = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// ==================== DIAGNOSIS ROUTES ====================

// @route   GET /api/doctor-master/diagnoses
// @desc    Get all diagnoses
// @access  Private (doctor, superadmin)
router.get('/diagnoses', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { search, category, isActive } = req.query;
    let query = {};

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
    } else if (isActive === 'false') {
      query.isActive = false;
    }

    const diagnoses = await Diagnosis.find(query)
      .sort({ name: 1 })
      .populate('createdBy', 'name username');

    res.json({
      success: true,
      count: diagnoses.length,
      data: diagnoses
    });
  } catch (error) {
    console.error('Get diagnoses error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/doctor-master/diagnoses/bulk
// @desc    Create multiple diagnoses at once
// @access  Private (doctor, superadmin)
router.post('/diagnoses/bulk', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { diagnoses } = req.body;

    if (!diagnoses || !Array.isArray(diagnoses) || diagnoses.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide an array of diagnoses'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const diag of diagnoses) {
      if (!diag.name || diag.name.trim() === '') {
        results.failed.push({ name: diag.name, reason: 'Name is required' });
        continue;
      }

      try {
        // Check if diagnosis already exists
        const existing = await Diagnosis.findOne({ 
          name: { $regex: new RegExp(`^${diag.name.trim()}$`, 'i') }
        });

        if (existing) {
          results.failed.push({ name: diag.name, reason: 'Diagnosis already exists' });
          continue;
        }

        const newDiagnosis = new Diagnosis({
          name: diag.name.trim().toUpperCase(),
          code: diag.code || '',
          description: diag.description || '',
          category: diag.category || 'general',
          createdBy: req.user.id,
          createdByName: req.user.name
        });

        await newDiagnosis.save();
        results.successful.push(newDiagnosis);
      } catch (error) {
        results.failed.push({ name: diag.name, reason: error.message });
      }
    }

    res.status(201).json({
      success: true,
      msg: `${results.successful.length} diagnosis(es) created, ${results.failed.length} failed`,
      data: {
        successful: results.successful,
        failed: results.failed
      }
    });
  } catch (error) {
    console.error('Bulk create diagnoses error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/doctor-master/diagnoses
// @desc    Create a single diagnosis
// @access  Private (doctor, superadmin)
router.post('/diagnoses', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { name, code, description, category } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, msg: 'Diagnosis name is required' });
    }

    // Check for existing
    const existing = await Diagnosis.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ success: false, msg: 'Diagnosis already exists' });
    }

    const diagnosis = new Diagnosis({
      name: name.trim().toUpperCase(),
      code: code || '',
      description: description || '',
      category: category || 'general',
      createdBy: req.user.id,
      createdByName: req.user.name
    });

    await diagnosis.save();

    res.status(201).json({
      success: true,
      msg: 'Diagnosis created successfully',
      data: diagnosis
    });
  } catch (error) {
    console.error('Create diagnosis error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/doctor-master/diagnoses/:id
// @desc    Update a diagnosis
// @access  Private (doctor, superadmin)
router.put('/diagnoses/:id', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { name, code, description, category, isActive } = req.body;
    const diagnosisId = req.params.id;

    const diagnosis = await Diagnosis.findById(diagnosisId);
    if (!diagnosis) {
      return res.status(404).json({ success: false, msg: 'Diagnosis not found' });
    }

    // Check for duplicate name (excluding current)
    if (name && name !== diagnosis.name) {
      const existing = await Diagnosis.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: diagnosisId }
      });
      if (existing) {
        return res.status(400).json({ success: false, msg: 'Diagnosis name already exists' });
      }
      diagnosis.name = name.trim().toUpperCase();
    }

    if (code !== undefined) diagnosis.code = code;
    if (description !== undefined) diagnosis.description = description;
    if (category !== undefined) diagnosis.category = category;
    if (isActive !== undefined) diagnosis.isActive = isActive;

    await diagnosis.save();

    res.json({
      success: true,
      msg: 'Diagnosis updated successfully',
      data: diagnosis
    });
  } catch (error) {
    console.error('Update diagnosis error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/doctor-master/diagnoses/:id
// @desc    Delete a diagnosis
// @access  Private (doctor, superadmin)
router.delete('/diagnoses/:id', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) {
      return res.status(404).json({ success: false, msg: 'Diagnosis not found' });
    }

    await diagnosis.deleteOne();

    res.json({
      success: true,
      msg: 'Diagnosis deleted successfully'
    });
  } catch (error) {
    console.error('Delete diagnosis error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/doctor-master/diagnoses/bulk
// @desc    Delete multiple diagnoses
// @access  Private (doctor, superadmin)
router.delete('/diagnoses/bulk', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, msg: 'Please provide an array of diagnosis IDs' });
    }

    const result = await Diagnosis.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      msg: `${result.deletedCount} diagnosis(es) deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete diagnoses error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// ==================== SERVICE ROUTES ====================

// @route   GET /api/doctor-master/services
// @desc    Get all services
// @access  Private (doctor, superadmin)
router.get('/services', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, isActive } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category;
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

    const services = await Service.find(query)
      .sort({ name: 1 })
      .populate('createdBy', 'name username');

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/doctor-master/services/bulk
// @desc    Create multiple services at once
// @access  Private (doctor, superadmin)
router.post('/services/bulk', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { services } = req.body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide an array of services'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const svc of services) {
      if (!svc.name || svc.name.trim() === '') {
        results.failed.push({ name: svc.name, reason: 'Name is required' });
        continue;
      }

      if (!svc.price || isNaN(svc.price) || svc.price < 0) {
        results.failed.push({ name: svc.name, reason: 'Valid price is required' });
        continue;
      }

      try {
        // Check if service already exists
        const existing = await Service.findOne({ 
          name: { $regex: new RegExp(`^${svc.name.trim()}$`, 'i') }
        });

        if (existing) {
          results.failed.push({ name: svc.name, reason: 'Service already exists' });
          continue;
        }

        const newService = new Service({
          name: svc.name.trim(),
          price: parseFloat(svc.price),
          description: svc.description || '',
          category: svc.category || 'consultation',
          duration: svc.duration || 30,
          createdBy: req.user.id,
          createdByName: req.user.name
        });

        await newService.save();
        results.successful.push(newService);
      } catch (error) {
        results.failed.push({ name: svc.name, reason: error.message });
      }
    }

    res.status(201).json({
      success: true,
      msg: `${results.successful.length} service(s) created, ${results.failed.length} failed`,
      data: {
        successful: results.successful,
        failed: results.failed
      }
    });
  } catch (error) {
    console.error('Bulk create services error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/doctor-master/services
// @desc    Create a single service
// @access  Private (doctor, superadmin)
router.post('/services', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { name, price, description, category, duration } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, msg: 'Service name is required' });
    }

    if (!price || isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, msg: 'Valid price is required' });
    }

    // Check for existing
    const existing = await Service.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({ success: false, msg: 'Service already exists' });
    }

    const service = new Service({
      name: name.trim(),
      price: parseFloat(price),
      description: description || '',
      category: category || 'consultation',
      duration: duration || 30,
      createdBy: req.user.id,
      createdByName: req.user.name
    });

    await service.save();

    res.status(201).json({
      success: true,
      msg: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/doctor-master/services/:id
// @desc    Update a service
// @access  Private (doctor, superadmin)
router.put('/services/:id', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { name, price, description, category, duration, isActive } = req.body;
    const serviceId = req.params.id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, msg: 'Service not found' });
    }

    // Check for duplicate name (excluding current)
    if (name && name !== service.name) {
      const existing = await Service.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: serviceId }
      });
      if (existing) {
        return res.status(400).json({ success: false, msg: 'Service name already exists' });
      }
      service.name = name.trim();
    }

    if (price !== undefined) {
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ success: false, msg: 'Valid price is required' });
      }
      service.price = parseFloat(price);
    }

    if (description !== undefined) service.description = description;
    if (category !== undefined) service.category = category;
    if (duration !== undefined) service.duration = duration;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({
      success: true,
      msg: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/doctor-master/services/:id
// @desc    Delete a service
// @access  Private (doctor, superadmin)
router.delete('/services/:id', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, msg: 'Service not found' });
    }

    await service.deleteOne();

    res.json({
      success: true,
      msg: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/doctor-master/services/bulk
// @desc    Delete multiple services
// @access  Private (doctor, superadmin)
router.delete('/services/bulk', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, msg: 'Please provide an array of service IDs' });
    }

    const result = await Service.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      msg: `${result.deletedCount} service(s) deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete services error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/doctor-master/stats
// @desc    Get statistics for master data
// @access  Private (doctor, superadmin)
router.get('/stats', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const [totalDiagnoses, activeDiagnoses, totalServices, activeServices, totalRevenue] = await Promise.all([
      Diagnosis.countDocuments(),
      Diagnosis.countDocuments({ isActive: true }),
      Service.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Service.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalDiagnoses,
        activeDiagnoses,
        totalServices,
        activeServices,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/doctor-master/medications
// @desc    Get all medications from inventory for prescriptions
// @access  Private (doctor)
router.get('/medications', protect, authorize('doctor'), async (req, res) => {
  try {
    console.log('Fetching medications for doctor:', req.user.name);
    
    // Get medications from inventory
    const medications = await Inventory.find({ 
      isActive: true,
      currentStock: { $gt: 0 } // Only show items in stock
    }).select('name category unit currentStock price');
    
    console.log(`Found ${medications.length} medications in inventory`);
    
    // Format for prescription use
    const formattedMeds = medications.map(med => ({
      id: med._id,
      name: med.name,
      category: med.category,
      unit: med.unit,
      currentStock: med.currentStock,
      price: med.price,
      inStock: med.currentStock > 0
    }));
    
    res.json({ success: true, data: formattedMeds });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ success: false, msg: 'Server error: ' + error.message });
  }
});

module.exports = router;

// router.get('/medications', protect, authorize('doctor'), async (req, res) => {