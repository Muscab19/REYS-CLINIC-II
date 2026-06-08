const mongoose = require('mongoose');

const LabRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true
  },
  
  // Patient Information
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
  
  // Test Information
  testName: {
    type: String,
    required: true
  },
  testCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTestCategory',
    required: false
  },
  testCategoryName: {
    type: String,
    default: ''
  },
  parameters: [{
    type: String
  }],
  normalRanges: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Request Information
  requestedBy: {
    type: String,
    required: true
  },
  requestedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  requestSource: {
    type: String,
    enum: ['reception', 'doctor', 'walkin', 'consultation'],
    default: 'reception'
  },
  
  // Clinical Information
  clinicalInfo: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal'
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled', 'awaiting-payment'],
    default: 'pending'
  },
  
  // Results
  results: {
    type: Map,
    of: String,
    default: {}
  },
  additionalComments: {
    type: String,
    default: ''
  },
  performedBy: {
    type: String,
    default: ''
  },
  performedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
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
  testPrice: {
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
  
  // Reference to consultation (if from doctor)
  consultationId: {
    type: String,
    default: ''
  },
  
  // Timestamps
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

// Indexes for better query performance
LabRequestSchema.index({ requestId: 1 });
LabRequestSchema.index({ patientId: 1 });
LabRequestSchema.index({ status: 1 });
LabRequestSchema.index({ requestSource: 1 });
LabRequestSchema.index({ paymentStatus: 1 });
LabRequestSchema.index({ requestDate: 1 });

// Pre-save middleware to generate unique requestId
LabRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    try {
      // Get the last request to determine the next ID
      const lastRequest = await mongoose.model('LabRequest').findOne().sort({ createdAt: -1 });
      
      let nextNumber = 1;
      if (lastRequest && lastRequest.requestId) {
        const match = lastRequest.requestId.match(/LAB-(\d+)/);
        if (match && match[1]) {
          const lastNumber = parseInt(match[1]);
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
      }
      
      // Add prefix based on request source
      const prefix = this.requestSource === 'reception' ? 'RXC' : 
                     this.requestSource === 'doctor' ? 'DOC' : 
                     this.requestSource === 'walkin' ? 'WLK' : 'LAB';
      
      this.requestId = `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating requestId:', error);
      // Fallback to timestamp-based ID
      const prefix = this.requestSource === 'reception' ? 'RXC' : 'LAB';
      this.requestId = `${prefix}-${Date.now()}`;
    }
  }
  next();
});

// Pre-save middleware to update timestamps
LabRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for total amount after discount
LabRequestSchema.virtual('totalAfterDiscount').get(function() {
  return this.testPrice - (this.discountAmount || 0);
});

// Virtual for remaining amount
LabRequestSchema.virtual('remainingAmount').get(function() {
  return this.testPrice - (this.paidAmount || 0);
});

// Ensure virtuals are included in JSON output
LabRequestSchema.set('toJSON', { virtuals: true });
LabRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LabRequest', LabRequestSchema);
