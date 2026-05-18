const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  ticketId: {
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
  preferredDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  preferredTime: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason for visit is required'],
    trim: true
  },
  previousVisits: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelledReason: {
    type: String,
    default: ''
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partial'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  consultationFee: {
    type: Number,
    default: 25
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'bank'],
    default: 'cash'
  },
  paymentDetails: {
    mobileNumber: {
      type: String,
      default: ''
    },
    bankLast4: {
      type: String,
      default: ''
    },
    transactionId: {
      type: String,
      default: ''
    }
  },
  paymentDate: {
    type: Date
  },
  receivedBy: {
    type: String,
    default: ''
  },
  receivedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Payment History for partial payments
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'mobile', 'bank'],
      required: true
    },
    paymentDetails: {
      mobileNumber: String,
      bankLast4: String,
      transactionId: String
    },
    date: {
      type: Date,
      default: Date.now
    },
    receivedBy: String
  }]
}, {
  timestamps: true
});

// Generate unique ticket ID before saving
appointmentSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.ticketId = `REYS-${year}${month}${day}-${random}`;
    
    // Ensure uniqueness
    const Appointment = mongoose.model('Appointment');
    let existing = await Appointment.findOne({ ticketId: this.ticketId });
    while (existing) {
      const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.ticketId = `REYS-${year}${month}${day}-${newRandom}`;
      existing = await Appointment.findOne({ ticketId: this.ticketId });
    }
  }
  next();
});

// Calculate remaining amount
appointmentSchema.virtual('remainingAmount').get(function() {
  return this.consultationFee - this.paidAmount;
});

// Check if fully paid
appointmentSchema.virtual('isFullyPaid').get(function() {
  return this.paidAmount >= this.consultationFee;
});

// Ensure virtuals are included in JSON output
appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

// Indexes
appointmentSchema.index({ ticketId: 1 });
appointmentSchema.index({ childName: 'text', parentName: 'text', parentPhone: 'text' });
appointmentSchema.index({ preferredDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ bookedBy: 1 });
appointmentSchema.index({ paymentStatus: 1 });
appointmentSchema.index({ paymentDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);