const mongoose = require('mongoose');

// Diagnosis Schema
const diagnosisSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Diagnosis name is required'],
    trim: true,
    unique: true,
    uppercase: true
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['general', 'pediatric', 'emergency', 'chronic', 'infectious'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: {
    type: String
  }
}, {
  timestamps: true
});

// Service Schema
const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    unique: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['consultation', 'procedure', 'vaccination', 'laboratory', 'radiology', 'therapy', 'other'],
    default: 'consultation'
  },
  duration: {
    type: Number,
    default: 30,
    comment: 'Duration in minutes'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
diagnosisSchema.index({ name: 1 });
diagnosisSchema.index({ category: 1 });
diagnosisSchema.index({ isActive: 1 });

serviceSchema.index({ name: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ isActive: 1 });

const Diagnosis = mongoose.model('Diagnosis', diagnosisSchema);
const Service = mongoose.model('Service', serviceSchema);

module.exports = { Diagnosis, Service };