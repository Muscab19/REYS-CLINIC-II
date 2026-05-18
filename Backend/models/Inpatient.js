const mongoose = require('mongoose');

const inpatientSchema = new mongoose.Schema({
  inpatientId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Patient Reference
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  
  // Patient Information (denormalized for easier access)
  childName: {
    type: String,
    required: true
  },
  childAge: {
    type: Number,
    required: true
  },
  parentName: {
    type: String,
    required: true
  },
  parentPhone: {
    type: String,
    required: true
  },
  patientIdNumber: {
    type: String
  },
  
  // Inpatient Details - Make these NOT required (reception will assign later)
  admissionDate: {
    type: Date,
    default: Date.now
  },
  dischargeDate: {
    type: Date
  },
  roomNumber: {
    type: String,
    default: ''  // Changed from required: true
  },
  bedNumber: {
    type: String,
    default: ''  // Changed from required: true
  },
  nightlyRate: {
    type: Number,
    default: 50
  },
  nightsCount: {
    type: Number,
    default: 0
  },
  
  // Financial
  totalAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending_payment', 'paid', 'partial'],
    default: 'pending_payment'
  },
  paymentMethod: {
    type: String,
    enum: ['mobile', 'bank', 'cash', ''],
    default: ''
  },
  mobileNumber: {
    type: String,
    default: ''
  },
  bankLast4: {
    type: String,
    default: ''
  },
  paymentDate: {
    type: Date
  },
  paymentReference: {
    type: String,
    default: ''
  },
  
  // Status
  status: {
    type: String,
    enum: ['admitted', 'discharged', 'cancelled'],
    default: 'admitted'
  },
  
  // Notes
  admissionNotes: {
    type: String,
    default: ''
  },
  dischargeNotes: {
    type: String,
    default: ''
  },
  
  // Audit
  admittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  admittedByName: {
    type: String
  },
  dischargedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dischargedByName: {
    type: String
  },
  paymentProcessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentProcessedByName: {
    type: String
  }
}, {
  timestamps: true
});

// Generate inpatient ID before saving
inpatientSchema.pre('save', async function(next) {
  if (!this.inpatientId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.inpatientId = `IP-${year}${month}-${random}`;
    
    const Inpatient = mongoose.model('Inpatient');
    let existing = await Inpatient.findOne({ inpatientId: this.inpatientId });
    while (existing) {
      const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.inpatientId = `IP-${year}${month}-${newRandom}`;
      existing = await Inpatient.findOne({ inpatientId: this.inpatientId });
    }
  }
  next();
});

// Indexes
inpatientSchema.index({ inpatientId: 1 });
inpatientSchema.index({ patientId: 1 });
inpatientSchema.index({ status: 1 });
inpatientSchema.index({ roomNumber: 1 });
inpatientSchema.index({ admissionDate: -1 });

module.exports = mongoose.model('Inpatient', inpatientSchema);