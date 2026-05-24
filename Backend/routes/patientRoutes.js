const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const PatientRegistration = require('../models/PatientRegistration');
const Appointment = require('../models/Appointment');
const LabRequest = require('../models/LabRequest');
const LabTest = require('../models/LabTest');
const { protect, authorize } = require('../middleware/auth');

// Generate ticket ID
const generateTicketId = () => {
  const date = new Date();
  const year = date.getFullYear(); 
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REYS-${year}${month}${day}-${random}`;
};

// @route   POST /api/patients/register
// @desc    Register a new patient and send to department
// @access  Private (reception, superadmin)
router.post('/register', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const {
      childName,
      childAge,
      childGender,
      childDob,
      parentName,
      parentPhone,
      parentEmail,
      parentAddress,
      visitReason,
      symptoms,
      previousVisits,
      referredTo,
      assignedDoctor,
      assignedLabTech,
      selectedLabTests,
      labTestNotes,
      urgency,
      notes,
      // NEW PAYMENT FIELDS
      paymentStatus,
      paidAmount,
      paymentMethod,
      paymentDate,
      isFollowUp,
      previousConsultationId,
      followUpReason,
      ticketFee
    } = req.body;

    console.log('Received registration request:', req.body);

    // Validate required fields based on department
    if (!childName || !childAge || !parentName || !parentPhone || !referredTo) {
      return res.status(400).json({
        success: false,
        msg: 'Please fill in all required fields: child name, age, parent name, phone, and department'
      });
    }

    // For doctor referral, visit reason is required
    if (referredTo === 'doctor' && !visitReason) {
      return res.status(400).json({
        success: false,
        msg: 'Reason for visit is required for doctor consultation'
      });
    }

    // For lab referral, lab tests are required
    if (referredTo === 'lab-tech' && (!selectedLabTests || selectedLabTests.length === 0)) {
      return res.status(400).json({
        success: false,
        msg: 'Please select at least one lab test'
      });
    }

    // Generate unique ticket ID for appointment
    let ticketId = generateTicketId();
    let existingAppointment = await Appointment.findOne({ ticketId });
    while (existingAppointment) {
      ticketId = generateTicketId();
      existingAppointment = await Appointment.findOne({ ticketId });
    }

    // Create notes based on department
    let appointmentNotes = '';
    if (referredTo === 'doctor') {
      appointmentNotes = `Referred to: Doctor\nSymptoms: ${symptoms || 'N/A'}\nUrgency: ${urgency || 'normal'}\nAdditional Notes: ${notes || 'N/A'}`;
    } else {
      appointmentNotes = `Referred to: Lab Tech\nLab Tests: ${selectedLabTests?.join(', ') || 'N/A'}\nLab Notes: ${labTestNotes || 'N/A'}\nUrgency: ${urgency || 'normal'}\nAdditional Notes: ${notes || 'N/A'}`;
    }

    // Create an appointment for the patient
    const appointmentData = {
      childName,
      childAge: parseInt(childAge),
      parentName,
      parentPhone,
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: 'As soon as possible',
      reason: referredTo === 'doctor' ? (visitReason || 'General consultation') : `Lab Tests: ${selectedLabTests?.length || 0} test(s)`,
      previousVisits: previousVisits || 'no',
      notes: appointmentNotes,
      bookedBy: req.user.id,
      status: 'pending',
      ticketId: ticketId,
      // Add consultation fee for appointment
      consultationFee: referredTo === 'doctor' ? (ticketFee || 25) : 0,
      paymentStatus: paymentStatus || 'pending',
      paidAmount: paidAmount || 0,
      paymentMethod: paymentMethod || null,
      paymentDate: paymentDate ? new Date(paymentDate) : (paidAmount > 0 ? new Date() : null)
    };

    const appointment = await Appointment.create(appointmentData);
    console.log('Appointment created:', appointment._id);

    // Create patient record WITH PAYMENT FIELDS
    const patientData = {
      childName,
      childAge: parseInt(childAge),
      childGender: childGender || '',
      childDob: childDob ? new Date(childDob) : null,
      parentName,
      parentPhone,
      parentEmail: parentEmail || '',
      parentAddress: parentAddress || '',
      visitReason: visitReason || '',
      symptoms: symptoms || '',
      previousVisits: previousVisits || 'no',
      referredTo,
      assignedDoctor: assignedDoctor || '',
      assignedLabTech: assignedLabTech || '',
      selectedLabTests: selectedLabTests || [],
      labTestNotes: labTestNotes || '',
      urgency: urgency || 'normal',
      notes: notes || '',
      registeredBy: req.user.id,
      registeredByName: req.user.name,
      appointmentId: appointment._id,
      ticketId: ticketId,
      status: 'pending',
      // PAYMENT FIELDS
      paymentStatus: paymentStatus || 'pending',
      paidAmount: paidAmount || 0,
      paymentMethod: paymentMethod || null,
      paymentDate: paymentDate ? new Date(paymentDate) : (paidAmount > 0 ? new Date() : null),
      isFollowUp: isFollowUp || false,
      previousConsultationId: previousConsultationId || '',
      followUpReason: followUpReason || '',
      ticketFee: ticketFee || 0
    };

    const patient = await Patient.create(patientData);
    console.log('Patient created:', patient._id, 'Patient ID:', patient.patientId);

    // CREATE LAB REQUESTS IF PATIENT IS REFERRED TO LAB-TECH
    if (referredTo === 'lab-tech' && selectedLabTests && selectedLabTests.length > 0) {
      console.log('Creating lab requests for patient:', patient._id);
      
      // Get lab test details for each selected test
      const labTestsDetails = await LabTest.find({ _id: { $in: selectedLabTests } });
      
      // Create a separate lab request for each test
      for (const testId of selectedLabTests) {
        const testDetails = labTestsDetails.find(t => t._id.toString() === testId);
        
        if (testDetails) {
          const labRequestData = {
            patientId: patient._id,
            patientName: childName,
            patientAge: parseInt(childAge),
            parentName: parentName,
            parentPhone: parentPhone,
            testName: testDetails.name,
            testCategory: testDetails.category,
            parameters: testDetails.parameters || [testDetails.name],
            normalRanges: testDetails.normalRanges || { [testDetails.name]: testDetails.normalRange },
            requestedBy: `Reception: ${req.user.name}`,
            requestedById: req.user.id,
            clinicalInfo: labTestNotes || '',
            notes: notes || '',
            priority: urgency === 'urgent' ? 'urgent' : 'normal',
            status: 'pending',
            requestDate: new Date(),
            // Add payment info to lab request if paid
            paymentStatus: paymentStatus === 'paid' ? 'paid' : 'pending',
            paidAmount: paidAmount || 0,
            paymentMethod: paymentMethod || null,
            paymentDate: paymentDate ? new Date(paymentDate) : (paidAmount > 0 ? new Date() : null)
          };
          
          const labRequest = new LabRequest(labRequestData);
          await labRequest.save();
          console.log(`Lab request created for ${testDetails.name}:`, labRequest.requestId);
        } else {
          // Fallback if test details not found
          const labRequestData = {
            patientId: patient._id,
            patientName: childName,
            patientAge: parseInt(childAge),
            parentName: parentName,
            parentPhone: parentPhone,
            testName: testId,
            testCategory: 'other',
            parameters: ['Result'],
            normalRanges: {},
            requestedBy: `Reception: ${req.user.name}`,
            requestedById: req.user.id,
            clinicalInfo: labTestNotes || '',
            notes: notes || '',
            priority: urgency === 'urgent' ? 'urgent' : 'normal',
            status: 'pending',
            requestDate: new Date(),
            paymentStatus: paymentStatus === 'paid' ? 'paid' : 'pending',
            paidAmount: paidAmount || 0,
            paymentMethod: paymentMethod || null,
            paymentDate: paymentDate ? new Date(paymentDate) : (paidAmount > 0 ? new Date() : null)
          };
          
          const labRequest = new LabRequest(labRequestData);
          await labRequest.save();
          console.log(`Lab request created for test ID: ${testId}`);
        }
      }
      
      console.log(`Created ${selectedLabTests.length} lab requests for patient ${patient._id}`);
    }

    // Create registration record if model exists
    if (PatientRegistration) {
      try {
        await PatientRegistration.create({
          patientId: patient._id,
          childName,
          parentName,
          referredTo,
          urgency: urgency || 'normal',
          registeredBy: req.user.id,
          registeredByName: req.user.name,
          status: 'pending',
          paymentStatus: paymentStatus || 'pending',
          paidAmount: paidAmount || 0
        });
      } catch (regError) {
        console.log('Registration record error (non-critical):', regError.message);
      }
    }

    // Get lab test names for response
    let labTestNames = [];
    if (selectedLabTests && selectedLabTests.length > 0) {
      const labTestsDetails = await LabTest.find({ _id: { $in: selectedLabTests } });
      labTestNames = labTestsDetails.map(t => t.name);
    }

    res.status(201).json({
      success: true,
      msg: 'Patient registered successfully',
      data: {
        patient: {
          _id: patient._id,
          patientId: patient.patientId,
          childName: patient.childName,
          childAge: patient.childAge,
          parentName: patient.parentName,
          parentPhone: patient.parentPhone,
          visitReason: patient.visitReason,
          referredTo: patient.referredTo,
          urgency: patient.urgency,
          ticketId: patient.ticketId,
          paymentStatus: patient.paymentStatus,
          paidAmount: patient.paidAmount,
          paymentMethod: patient.paymentMethod
        },
        appointment: {
          _id: appointment._id,
          ticketId: appointment.ticketId,
          status: appointment.status,
          paymentStatus: appointment.paymentStatus,
          paidAmount: appointment.paidAmount
        },
        registration: {
          ticketId: patient.ticketId,
          childName: patient.childName,
          childAge: patient.childAge,
          parentName: patient.parentName,
          parentPhone: patient.parentPhone,
          visitReason: patient.visitReason,
          referredTo: patient.referredTo,
          assignedDoctor: patient.assignedDoctor,
          assignedLabTech: patient.assignedLabTech,
          selectedLabTests: labTestNames,
          urgency: patient.urgency,
          registeredBy: req.user.name,
          registeredAt: patient.registrationDate,
          paymentStatus: patient.paymentStatus,
          paidAmount: patient.paidAmount
        }
      }
    });

  } catch (error) {
    console.error('Patient registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        msg: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      msg: 'Server error during patient registration: ' + error.message
    });
  }
});

// @route   POST /api/patients/register-direct
// @desc    Register a new patient directly (NO appointment created)
// @access  Private (reception, superadmin)
router.post('/register-direct', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const {
      childName,
      childAge,
      childGender,
      childDob,
      parentName,
      parentPhone,
      parentEmail,
      parentAddress,
      visitReason,
      symptoms,
      previousVisits,
      referredTo,
      assignedDoctor,
      assignedLabTech,
      selectedLabTests,
      labTestNotes,
      urgency,
      notes,
      paymentStatus,
      paidAmount,
      paymentMethod,
      paymentDate,
      isFollowUp,
      previousConsultationId,
      followUpReason,
      status,
      ticketFee
    } = req.body;

    console.log('Received direct registration request:', req.body);

    // Validate required fields
    if (!childName || !childAge || !parentName || !parentPhone || !referredTo) {
      return res.status(400).json({
        success: false,
        msg: 'Please fill in all required fields: child name, age, parent name, phone, and department'
      });
    }

    // For doctor referral, visit reason is required
    if (referredTo === 'doctor' && !visitReason) {
      return res.status(400).json({
        success: false,
        msg: 'Reason for visit is required for doctor consultation'
      });
    }

    // For lab referral, lab tests are required
    if (referredTo === 'lab-tech' && (!selectedLabTests || selectedLabTests.length === 0)) {
      return res.status(400).json({
        success: false,
        msg: 'Please select at least one lab test'
      });
    }

    // Generate unique ticket ID (without creating appointment)
    let ticketId = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let existingPatient = await Patient.findOne({ ticketId });
    while (existingPatient) {
      ticketId = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      existingPatient = await Patient.findOne({ ticketId });
    }

    // Create patient record (NO APPOINTMENT)
    const patientData = {
      childName,
      childAge: parseInt(childAge),
      childGender: childGender || '',
      childDob: childDob ? new Date(childDob) : null,
      parentName,
      parentPhone,
      parentEmail: parentEmail || '',
      parentAddress: parentAddress || '',
      visitReason: visitReason || '',
      symptoms: symptoms || '',
      previousVisits: previousVisits || 'no',
      referredTo,
      assignedDoctor: assignedDoctor || '',
      assignedLabTech: assignedLabTech || '',
      selectedLabTests: selectedLabTests || [],
      labTestNotes: labTestNotes || '',
      urgency: urgency || 'normal',
      notes: notes || '',
      registeredBy: req.user.id,
      registeredByName: req.user.name,
      ticketId: ticketId,
      status: status || 'pending',
      paymentStatus: paymentStatus || 'pending',
      paidAmount: paidAmount || 0,
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      isFollowUp: isFollowUp || false,
      previousConsultationId: previousConsultationId || '',
      followUpReason: followUpReason || '',
      ticketFee: ticketFee || 0
    };

    const patient = await Patient.create(patientData);
    console.log('Patient created directly:', patient._id, 'Patient ID:', patient.patientId);

    // CREATE LAB REQUESTS IF PATIENT IS REFERRED TO LAB-TECH
    if (referredTo === 'lab-tech' && selectedLabTests && selectedLabTests.length > 0) {
      console.log('Creating lab requests for patient:', patient._id);
      
      const labTestsDetails = await LabTest.find({ _id: { $in: selectedLabTests } });
      
      for (const testId of selectedLabTests) {
        const testDetails = labTestsDetails.find(t => t._id.toString() === testId);
        
        if (testDetails) {
          const labRequestData = {
            patientId: patient._id,
            patientName: childName,
            patientAge: parseInt(childAge),
            parentName: parentName,
            parentPhone: parentPhone,
            testName: testDetails.name,
            testCategory: testDetails.category,
            parameters: testDetails.parameters || [testDetails.name],
            normalRanges: testDetails.normalRanges || { [testDetails.name]: testDetails.normalRange },
            requestedBy: `Reception: ${req.user.name}`,
            requestedById: req.user.id,
            clinicalInfo: labTestNotes || '',
            notes: notes || '',
            priority: urgency === 'urgent' ? 'urgent' : 'normal',
            status: 'pending',
            requestDate: new Date()
          };
          
          const labRequest = new LabRequest(labRequestData);
          await labRequest.save();
          console.log(`Lab request created for ${testDetails.name}:`, labRequest.requestId);
        }
      }
    }

    // Get lab test names for response
    let labTestNames = [];
    if (selectedLabTests && selectedLabTests.length > 0) {
      const labTestsDetails = await LabTest.find({ _id: { $in: selectedLabTests } });
      labTestNames = labTestsDetails.map(t => t.name);
    }

    res.status(201).json({
      success: true,
      msg: 'Patient registered successfully',
      data: {
        patient: {
          _id: patient._id,
          patientId: patient.patientId,
          ticketId: patient.ticketId,
          childName: patient.childName,
          childAge: patient.childAge,
          childGender: patient.childGender,
          parentName: patient.parentName,
          parentPhone: patient.parentPhone,
          parentEmail: patient.parentEmail,
          parentAddress: patient.parentAddress,
          visitReason: patient.visitReason,
          symptoms: patient.symptoms,
          previousVisits: patient.previousVisits,
          referredTo: patient.referredTo,
          assignedDoctor: patient.assignedDoctor,
          assignedLabTech: patient.assignedLabTech,
          selectedLabTests: labTestNames,
          labTestNotes: patient.labTestNotes,
          urgency: patient.urgency,
          notes: patient.notes,
          paymentStatus: patient.paymentStatus,
          paidAmount: patient.paidAmount,
          paymentMethod: patient.paymentMethod,
          paymentDate: patient.paymentDate,
          isFollowUp: patient.isFollowUp,
          previousConsultationId: patient.previousConsultationId,
          followUpReason: patient.followUpReason,
          status: patient.status,
          ticketFee: patient.ticketFee,
          registeredBy: req.user.name,
          registrationDate: patient.registrationDate
        }
      }
    });

  } catch (error) {
    console.error('Direct patient registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        msg: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      msg: 'Server error during patient registration: ' + error.message
    });
  }
});

// @route   GET /api/patients
// @desc    Get all patients (with optional inpatient filter)
// @access  Private (superadmin, reception, doctor)
router.get('/', protect, authorize('superadmin', 'reception', 'doctor'), async (req, res) => {
  try {
    const { search, referredTo, status, startDate, endDate, isInpatient } = req.query;
    let query = {};

    // Handle inpatient filter
    if (isInpatient !== undefined) {
      query.isInpatient = isInpatient === 'true';
    }

    if (search) {
      query.$or = [
        { childName: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }
      ];
    }

    if (referredTo && referredTo !== 'all') {
      query.referredTo = referredTo;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.registrationDate = {};
      if (startDate) query.registrationDate.$gte = new Date(startDate);
      if (endDate) query.registrationDate.$lte = new Date(endDate);
    }

    const patients = await Patient.find(query)
      .sort({ registrationDate: -1 })
      .populate('registeredBy', 'name username')
      .populate('appointmentId', 'ticketId status preferredDate preferredTime');

    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get single patient by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('registeredBy', 'name username')
      .populate('appointmentId', 'ticketId status preferredDate preferredTime')
      .populate('selectedLabTests', 'name price normalRange');

    if (!patient) {
      return res.status(404).json({ success: false, msg: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/patients/ticket/:ticketId
// @desc    Get patient by ticket ID
// @access  Private
router.get('/ticket/:ticketId', protect, async (req, res) => {
  try {
    const patient = await Patient.findOne({ ticketId: req.params.ticketId })
      .populate('registeredBy', 'name username')
      .populate('appointmentId', 'ticketId status')
      .populate('selectedLabTests', 'name price normalRange');

    if (!patient) {
      return res.status(404).json({ success: false, msg: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    console.error('Get patient by ticket error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/patients/:id/status
// @desc    Update patient status
// @access  Private
router.put('/:id/status', protect, authorize('superadmin', 'reception', 'doctor'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in-progress', 'waiting-tests', 'completed', 'cancelled', 'pending-payment'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        msg: `Invalid status. Allowed statuses: ${validStatuses.join(', ')}` 
      });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, msg: 'Patient not found' });
    }

    // Also update the associated appointment status
    if (patient.appointmentId) {
      await Appointment.findByIdAndUpdate(patient.appointmentId, { status });
    }

    res.json({
      success: true,
      msg: `Patient status updated to ${status}`,
      data: patient
    });
  } catch (error) {
    console.error('Update patient status error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/patients/stats/overview
// @desc    Get patient statistics
// @access  Private (superadmin, reception)
router.get('/stats/overview', protect, authorize('superadmin', 'reception'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, todayRegistrations, pending] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ registrationDate: { $gte: today, $lt: tomorrow } }),
      Patient.countDocuments({ status: 'pending' })
    ]);

    const byDepartment = await Patient.aggregate([
      { $group: { _id: '$referredTo', count: { $sum: 1 } } }
    ]);

    const doctorCount = byDepartment.find(d => d._id === 'doctor')?.count || 0;
    const labTechCount = byDepartment.find(d => d._id === 'lab-tech')?.count || 0;

    res.json({
      success: true,
      data: {
        total,
        today: todayRegistrations,
        pending,
        doctor: doctorCount,
        labTech: labTechCount
      }
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/patients/:id/inpatient
// @desc    Mark patient as inpatient
// @access  Private (doctor)
router.put('/:id/inpatient', protect, authorize('doctor'), async (req, res) => {
  try {
    const { isInpatient } = req.body;
    
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isInpatient: isInpatient === true || isInpatient === undefined ? true : isInpatient },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ success: false, msg: 'Patient not found' });
    }

    res.json({
      success: true,
      msg: 'Patient marked as inpatient',
      data: patient
    });
  } catch (error) {
    console.error('Mark inpatient error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/patients/inpatient/list
// @desc    Get all inpatient patients
// @access  Private (doctor, superadmin)
router.get('/inpatient/list', protect, authorize('doctor', 'superadmin'), async (req, res) => {
  try {
    const patients = await Patient.find({ isInpatient: true })
      .sort({ registrationDate: -1 });
    
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Get inpatient list error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/patients/:id/pay-consultation
// @desc    Mark consultation fee as paid
// @access  Private (reception, superadmin)
router.put('/:id/pay-consultation', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const { paymentMethod, paymentAmount } = req.body;
    
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, msg: 'Patient not found' });
    }
    
    if (patient.referredTo !== 'doctor') {
      return res.status(400).json({ success: false, msg: 'This patient is not referred to doctor' });
    }
    
    if (patient.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, msg: 'Already paid' });
    }
    
    const amountToPay = paymentAmount || patient.ticketFee;
    
    patient.paymentStatus = 'paid';
    patient.paidAmount = amountToPay;
    patient.paymentMethod = paymentMethod || 'cash';
    patient.paymentDate = new Date();
    
    await patient.save();
    
    // Also update associated appointment if exists
    if (patient.appointmentId) {
      await Appointment.findByIdAndUpdate(patient.appointmentId, {
        paymentStatus: 'paid',
        paidAmount: amountToPay,
        paymentMethod: paymentMethod || 'cash',
        paymentDate: new Date()
      });
    }
    
    res.json({
      success: true,
      msg: `Consultation fee of $${amountToPay} collected successfully`,
      data: patient
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Permanently delete a patient and all associated records
// @access  Private (superadmin, reception, doctor)
router.delete('/:id', protect, authorize('superadmin', 'reception', 'doctor'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ success: false, msg: 'Patient not found' });
    }
    
    // Delete associated appointment if exists
    if (patient.appointmentId) {
      await Appointment.findByIdAndDelete(patient.appointmentId);
    }
    
    // Delete associated lab requests
    await LabRequest.deleteMany({ patientId: patient._id });
    
    // Delete the patient
    await patient.deleteOne();
    
    res.json({
      success: true,
      msg: 'Patient and all associated records deleted successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

module.exports = router;  

// GET /api/patients