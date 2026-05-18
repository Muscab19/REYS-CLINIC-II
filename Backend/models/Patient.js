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

// Generate unique patient ID before saving (sequential: PAT-000001, PAT-000002, etc.)
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    try {
      const Patient = mongoose.model('Patient');
      
      // Find the last patient to get the highest sequential number
      const lastPatient = await Patient.findOne({ 
        patientId: { $regex: /^PAT-\d{6}$/ } 
      }).sort({ patientId: -1 }).limit(1);
      
      let nextNumber = 1;
      
      if (lastPatient && lastPatient.patientId) {
        // Extract the number from PAT-XXXXXX format
        const match = lastPatient.patientId.match(/PAT-(\d+)/);
        if (match && match[1]) {
          const lastNumber = parseInt(match[1], 10);
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
      }
      
      // Format with 6 digits padding (000001, 000002, 000003, etc.)
      this.patientId = `PAT-${nextNumber.toString().padStart(6, '0')}`;
      
      // Double-check uniqueness in case of race condition
      let existing = await Patient.findOne({ patientId: this.patientId });
      while (existing) {
        nextNumber++;
        this.patientId = `PAT-${nextNumber.toString().padStart(6, '0')}`;
        existing = await Patient.findOne({ patientId: this.patientId });
      }
      
      console.log(`Generated patient ID: ${this.patientId} (sequential number: ${nextNumber})`);
    } catch (error) {
      console.error('Error generating sequential patient ID:', error);
      // Fallback to timestamp-based ID if sequential fails
      const timestamp = Date.now().toString().slice(-6);
      this.patientId = `PAT-${timestamp}`;
      
      // Ensure uniqueness for fallback
      const Patient = mongoose.model('Patient');
      let existing = await Patient.findOne({ patientId: this.patientId });
      if (existing) {
        this.patientId = `PAT-${timestamp}-${Math.floor(Math.random() * 1000)}`;
      }
    }
  }
  next();
});

// Virtual for full patient info
patientSchema.virtual('fullName').get(function() {
  return `${this.childName} (ID: ${this.patientId})`;
});

// Ensure virtuals are included in JSON output
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

// Indexes
patientSchema.index({ patientId: 1 });
patientSchema.index({ childName: 'text', parentName: 'text', parentPhone: 'text' });
patientSchema.index({ referredTo: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ registeredBy: 1 });
patientSchema.index({ assignedLabTechId: 1 });
patientSchema.index({ assignedDoctorId: 1 });
patientSchema.index({ isInpatient: 1 });
patientSchema.index({ paymentStatus: 1 });
patientSchema.index({ paymentDate: 1 });
patientSchema.index({ registrationDate: 1 });

module.exports = mongoose.model('Patient', patientSchema);