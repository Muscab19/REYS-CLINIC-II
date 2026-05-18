const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['hematology', 'biochemistry', 'microbiology', 'immunology', 'urinalysis', 'endocrinology', 'molecular', 'toxicology']
  },
  description: {
    type: String,
    default: ''
  },
  normalRange: {
    type: String,
    required: [true, 'Normal range is required']
  },
  unit: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  preparation: {
    type: String,
    default: ''
  },
  turnaroundTime: {
    type: String,
    default: '24 hours'
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

// Index for search
labTestSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('LabTest', labTestSchema); 