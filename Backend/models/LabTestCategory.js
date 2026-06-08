const mongoose = require('mongoose');

const labTestCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  color: {
    type: String,
    default: '#6366f1'
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
labTestCategorySchema.index({ name: 1 });
labTestCategorySchema.index({ isActive: 1 });

module.exports = mongoose.model('LabTestCategory', labTestCategorySchema);
