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
    type: String,
    enum: ['hematology', 'biochemistry', 'microbiology', 'pathology', 'urinalysis', 'other'],
    default: 'other'
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
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
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

// Pre-save middleware to generate unique requestId
LabRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    try {
      // Get the last request to determine the next ID
      const lastRequest = await mongoose.model('LabRequest').findOne().sort({ createdAt: -1 });
      
      let nextNumber = 1;
      if (lastRequest && lastRequest.requestId) {
        const lastNumber = parseInt(lastRequest.requestId.split('-')[1]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Add timestamp milliseconds to ensure uniqueness for parallel requests
      const timestamp = Date.now().toString().slice(-4);
      this.requestId = `LAB-${nextNumber.toString().padStart(6, '0')}-${timestamp}`;
    } catch (error) {
      console.error('Error generating requestId:', error);
      // Fallback to timestamp-based ID
      this.requestId = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
  }
  next();
});

module.exports = mongoose.model('LabRequest', LabRequestSchema); 