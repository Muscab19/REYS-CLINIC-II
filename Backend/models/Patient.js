const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    sparse: true
  },
  childName: {
    type: String,
    required: [true, 'Child name is required'],
    trim: true
  },
  childAge: {
    type: Number,
    required: [true, 'Child age is required'],
    min: 0,
    max: 18
  },
  childGender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  childDob: {
    type: Date
  },
  
  // Parent/Guardian Information
  parentName: {
    type: String,
    required: [true, 'Parent name is required'],
    trim: true
  },
  parentPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  parentAddress: {
    type: String,
    default: ''
  },

  // Doctor Assignment
  assignedDoctor: {
    type: String,
    default: ''
  },
  assignedDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Lab Technician Assignment
  assignedLabTech: {
    type: String,
    default: ''
  },
  assignedLabTechId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Lab Tests
  selectedLabTests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest'
  }],
  labTestNames: [{
    type: String,
    default: ''
  }],
  labTestNotes: {
    type: String,
    default: ''
  },
  
  // Visit Information (for doctor visits)
  visitReason: {
    type: String,
    trim: true,
    default: ''
  },
  symptoms: {
    type: String,
    default: ''
  },
  previousVisits: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  
  // Referral/Department
  referredTo: {
    type: String,
    enum: ['doctor', 'lab-tech'],
    required: true
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal'
  },
  notes: {
    type: String,
    default: ''
  },
  
  // Registration Details
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredByName: {
    type: String,
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'waiting-tests', 'completed', 'cancelled', 'pending-payment'],
    default: 'pending'
  },
  
  // Appointment Reference
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  ticketId: {
    type: String
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'cancelled'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'bank', ''],
    default: 'cash'
  },
  paymentDate: {
    type: Date
  },
  ticketFee: {
    type: Number,
    default: 0
  },
  
  // Discount Information
  subtotal: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', ''],
    default: ''
  },
  discountValue: {
    type: Number,
    default: 0
  },
  discountReason: {
    type: String,
    default: ''
  },
  
  // Follow-up Information
  isFollowUp: {
    type: Boolean,
    default: false
  },
  previousConsultationId: {
    type: String,
    default: ''
  },
  followUpReason: {
    type: String,
    default: ''
  },
  
  // Inpatient
  isInpatient: {
    type: Boolean,
    default: false
  },
  
  // Ward and Bed Assignment (for inpatients)
  ward: {
    type: String,
    enum: ['general', 'pediatric', 'icu', 'nicu', null],
    default: null
  },
  bedNumber: {
    type: String,
    default: null
  },
  ratePerNight: {
    type: Number,
    default: null
  },
  admissionDate: {
    type: Date,
    default: null
  },
  condition: {
    type: String,
    enum: ['stable', 'improving', 'serious', 'critical'],
    default: 'stable'
  },
  inpatientStatus: {
    type: String,
    enum: ['admitted', 'in-treatment', 'recovering', 'critical', null],
    default: null
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  dischargeSummary: {
    type: String,
    default: ''
  },
  dischargeInstructions: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    default: null
  },
  billing: {
    ratePerNight: { type: Number, default: 0 },
    nightsStayed: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    adjustments: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' }
  }
}, {
  timestamps: true
});

/**
 * Generate sequential patient ID based on department
 * Doctor patients: P-00001, P-00002, etc.
 * Lab patients: L-00001, L-00002, etc.
 */
patientSchema.methods.generateSequentialId = async function() {
  const Patient = mongoose.model('Patient');
  
  // Determine prefix based on referredTo department
  const prefix = this.referredTo === 'doctor' ? 'P' : 'L';
  
  // Find all patients with the same prefix
  const patientsWithSamePrefix = await Patient.find({ 
    patientId: { $regex: `^${prefix}-\\d+$` } 
  }).select('patientId');
  
  let maxNumber = 0;
  
  // Extract the maximum sequential number from existing IDs with same prefix
  for (const patient of patientsWithSamePrefix) {
    if (patient.patientId) {
      const match = patient.patientId.match(new RegExp(`${prefix}-(\\d+)`));
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }
  
  // Calculate next number - always start from 1 if no patients exist for this prefix
  const nextNumber = maxNumber === 0 ? 1 : maxNumber + 1;
  // Format with 5 digits padding (00001, 00002, etc.)
  const newPatientId = `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
  
  // Final safety check for uniqueness
  let existing = await Patient.findOne({ patientId: newPatientId });
  let attempts = 0;
  let finalNumber = nextNumber;
  let finalId = newPatientId;
  
  while (existing && attempts < 10) {
    finalNumber = (maxNumber === 0 ? 1 : maxNumber) + attempts + 2;
    finalId = `${prefix}-${finalNumber.toString().padStart(5, '0')}`;
    existing = await Patient.findOne({ patientId: finalId });
    attempts++;
  }
  
  this.patientId = finalId;
  console.log(`[Patient Model] Generated ${this.referredTo} patient ID: ${this.patientId} (max ${prefix} patients: ${maxNumber} → new number: ${finalNumber})`);
  return this.patientId;
};

// Pre-save middleware to handle patient ID generation
patientSchema.pre('save', async function(next) {
  try {
    // For existing documents that already have a valid patientId, skip generation
    if (!this.isNew && this.patientId && this.patientId.match(/^[PL]-\d{5,6}$/)) {
      console.log(`[Patient Model] Existing patient with ID: ${this.patientId}, skipping generation`);
      return next();
    }
    
    // For new documents or documents without a valid patientId, generate one
    if (!this.patientId || this.patientId === '' || this.patientId.startsWith('temp_') || !this.patientId.match(/^[PL]-\d{5,6}$/)) {
      console.log(`[Patient Model] Generating new patient ID for: ${this.childName} (${this.referredTo})`);
      await this.generateSequentialId();
      return next();
    }
    
    // Verify the prefix matches the referredTo department
    const expectedPrefix = this.referredTo === 'doctor' ? 'P' : 'L';
    const actualPrefix = this.patientId.charAt(0);
    
    if (actualPrefix !== expectedPrefix) {
      console.log(`[Patient Model] Prefix mismatch: ${this.patientId} has prefix ${actualPrefix} but expected ${expectedPrefix}. Generating new ID.`);
      await this.generateSequentialId();
      return next();
    }
    
    // If patientId is provided, verify it's unique
    const Patient = mongoose.model('Patient');
    const existing = await Patient.findOne({ 
      patientId: this.patientId, 
      _id: { $ne: this._id } 
    });
    
    if (existing) {
      console.log(`[Patient Model] ID conflict: ${this.patientId} already exists. Generating new ID.`);
      await this.generateSequentialId();
      return next();
    }
    
    // Validate format
    const idPattern = /^[PL]-\d{5,6}$/;
    if (!idPattern.test(this.patientId)) {
      console.log(`[Patient Model] Invalid format: ${this.patientId}. Generating new ID.`);
      await this.generateSequentialId();
      return next();
    }
    
    next();
  } catch (error) {
    console.error('[Patient Model] Error in pre-save hook:', error);
    next(error);
  }
});

// Virtual for full patient info
patientSchema.virtual('fullName').get(function() {
  return `${this.childName} (ID: ${this.patientId})`;
});

// Ensure virtuals are included in JSON output
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ referredTo: 1 });
patientSchema.index({ childName: 'text', parentName: 'text', parentPhone: 'text' });
patientSchema.index({ status: 1 });
patientSchema.index({ registeredBy: 1 });
patientSchema.index({ assignedLabTechId: 1 });
patientSchema.index({ assignedDoctorId: 1 });
patientSchema.index({ isInpatient: 1 });
patientSchema.index({ paymentStatus: 1 });
patientSchema.index({ paymentDate: 1 });
patientSchema.index({ registrationDate: 1 });

module.exports = mongoose.model('Patient', patientSchema);
