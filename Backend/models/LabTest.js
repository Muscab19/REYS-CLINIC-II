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
  // Main result type (can be 'multi' for composite tests)
  resultType: {
    type: String,
    enum: ['quantitative', 'qualitative', 'semi-quantitative', 'categorical', 'text', 'multi'],
    default: 'quantitative'
  },
  // For quantitative tests (numeric with range)
  normalRangeMin: {
    type: Number,
    default: null
  },
  normalRangeMax: {
    type: Number,
    default: null
  },
  // For qualitative tests
  qualitativeOptions: [{
    type: String,
    enum: ['Positive', 'Negative', 'Reactive', 'Non-reactive', 'Detected', 'Not Detected', 'Normal', 'Abnormal', 'High', 'Low', 'Critical']
  }],
  // For semi-quantitative tests
  semiQuantitativeOptions: [{
    type: String,
    enum: ['Negative', 'Trace', '1+', '2+', '3+', '4+', 'Small', 'Moderate', 'Large']
  }],
  // For categorical results
  categoricalOptions: [{
    type: String
  }],
  // MULTI-TEST PARAMETERS - For composite tests like Stool Examination
  parameters: [{
    name: {
      type: String,
      required: true
    },
    resultType: {
      type: String,
      enum: ['quantitative', 'qualitative', 'semi-quantitative', 'categorical', 'text'],
      required: true
    },
    normalRangeMin: Number,
    normalRangeMax: Number,
    qualitativeOptions: [String],
    semiQuantitativeOptions: [String],
    categoricalOptions: [String],
    unit: String
  }],
  // Legacy support
  normalRange: {
    type: String,
    default: ''
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

labTestSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('LabTest', labTestSchema);