const mongoose = require('mongoose');

const revenueTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  transactionType: {
    type: String,
    enum: [
      'doctor_consultation_fee',
      'lab_test_registration',
      'lab_test_doctor',
      'inpatient_stay',
      'pharmacy_prescription',
      'walkin_sale',
      'lab_test_direct'
    ],
    required: true
  },
  source: {
    type: String,
    enum: [
      'Doctor Consultation Fee',
      'Lab Tests (Walk-in)',
      'Lab Tests (Doctor Request)',
      'Inpatient Stay',
      'Pharmacy Prescription',
      'Walk-in Sale',
      'Lab Test (Direct)'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile', 'bank', 'card'],
    default: 'cash'
  },
  paymentDetails: {
    mobileNumber: { type: String, default: '' },
    bankName: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    cardLast4: { type: String, default: '' }
  },
  
  // Related references
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    default: ''
  },
  patientPhone: {
    type: String,
    default: ''
  },
  doctorName: {
    type: String,
    default: ''
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Reference IDs from source systems
  referenceId: {
    type: String,
    default: ''
  },
  referenceType: {
    type: String,
    enum: [
      'patient_registration',
      'consultation',
      'lab_request',
      'inpatient',
      'prescription',
      'walkin_sale'
    ],
    default: ''
  },
  
  // Item details (for prescriptions and walk-in sales)
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    subtotal: Number,
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    }
  }],
  
  // Additional info
  description: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'cancelled'],
    default: 'completed'
  },
  
  // Who processed the transaction
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedByName: {
    type: String,
    default: ''
  },
  
  // Dates
  transactionDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
revenueTransactionSchema.index({ transactionType: 1 });
revenueTransactionSchema.index({ transactionDate: -1 });
revenueTransactionSchema.index({ source: 1 });
revenueTransactionSchema.index({ paymentMethod: 1 });
revenueTransactionSchema.index({ patientId: 1 });
revenueTransactionSchema.index({ referenceId: 1 });
revenueTransactionSchema.index({ transactionDate: 1, transactionType: 1 });

// Generate transaction ID before saving
revenueTransactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.transactionId = `REV-${year}${month}${day}-${random}`;
    
    const RevenueTransaction = mongoose.model('RevenueTransaction');
    let existing = await RevenueTransaction.findOne({ transactionId: this.transactionId });
    while (existing) {
      const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.transactionId = `REV-${year}${month}${day}-${newRandom}`;
      existing = await RevenueTransaction.findOne({ transactionId: this.transactionId });
    }
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RevenueTransaction', revenueTransactionSchema);

//