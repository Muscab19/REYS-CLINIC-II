const mongoose = require('mongoose');

const labPaymentSchema = new mongoose.Schema({
  paymentId: {
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
  
  // Consultation Reference
  consultationId: {
    type: String,
    required: true
  },
  
  // Patient Information (denormalized)
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
  ticketId: {
    type: String
  },
  
  // Lab Tests to be paid
  labTests: [{
    id: String,
    name: String,
    category: String,
    price: Number,
    notes: String,
    requestedBy: String,
    requestedAt: Date,
    paid: { type: Boolean, default: false },
    paidAt: Date
  }],
  
  // Payment Information
  totalAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile', 'bank'],
    default: 'cash'
  },
  mobileNumber: {
    type: String,
    default: ''
  },
  bankLast4: {
    type: String,
    default: ''
  },
  paidAmount: {
    type: Number,
    default: 0
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
    enum: ['pending_payment', 'paid', 'completed', 'cancelled'],
    default: 'pending_payment'
  },
  
  // Audit
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedByName: {
    type: String
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate payment ID before saving
labPaymentSchema.pre('save', async function(next) {
  if (!this.paymentId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.paymentId = `LAB-PAY-${year}${month}-${random}`;
    
    const LabPayment = mongoose.model('LabPayment');
    let existing = await LabPayment.findOne({ paymentId: this.paymentId });
    while (existing) {
      const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.paymentId = `LAB-PAY-${year}${month}-${newRandom}`;
      existing = await LabPayment.findOne({ paymentId: this.paymentId });
    }
  }
  next();
});

// Indexes
labPaymentSchema.index({ paymentId: 1 });
labPaymentSchema.index({ patientId: 1 });
labPaymentSchema.index({ consultationId: 1 });
labPaymentSchema.index({ status: 1 });
labPaymentSchema.index({ paymentStatus: 1 });
labPaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LabPayment', labPaymentSchema);