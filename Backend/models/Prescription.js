const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientAge: {
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
  doctor: {
    type: String,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    route: String,
    instructions: String,
    quantity: {  // NEW FIELD: Number of units to dispense
      type: Number,
      default: 1,
      min: 1
    },
    unit: {  // NEW FIELD: Unit type (tablet, ml, bottle, etc.)
      type: String,
      enum: ['tablet', 'capsule', 'ml', 'mg', 'bottle', 'vial', 'inhaler', 'tube', 'box'],
      default: 'tablet'
    },
    inventoryId: {  // NEW FIELD: Reference to inventory item
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    }
  }],
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'unpaid'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    amount: Number,
    method: String,
    date: Date,
    receivedBy: String,
    note: String
  }],
  status: {
    type: String,
    enum: ['pending', 'dispensed', 'cancelled', 'partial'],
    default: 'pending'
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
  dispensedAt: {
    type: Date
  },
  dispensedBy: {
    type: String
  },
  consultationId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Generate prescription ID before saving
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.prescriptionId = `RX-${year}${month}-${random}`;
    
    const Prescription = mongoose.model('Prescription');
    let existing = await Prescription.findOne({ prescriptionId: this.prescriptionId });
    while (existing) {
      const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.prescriptionId = `RX-${year}${month}-${newRandom}`;
      existing = await Prescription.findOne({ prescriptionId: this.prescriptionId });
    }
  }
  next();
});

// Indexes
prescriptionSchema.index({ prescriptionId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);