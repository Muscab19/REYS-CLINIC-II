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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTestCategory',
    required: [true, 'Category is required']
  },
  categoryName: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  resultType: {
    type: String,
    enum: ['quantitative', 'qualitative', 'semi-quantitative', 'categorical', 'text', 'multi'],
    default: 'quantitative'
  },
  showReferenceOnPrint: {
    type: Boolean,
    default: true
  },
  normalRangeMin: {
    type: Number,
    default: null
  },
  normalRangeMax: {
    type: Number,
    default: null
  },
  qualitativeOptions: [{
    type: String,
    enum: ['Positive', 'Negative', 'Reactive', 'Non-reactive', 'Detected', 'Not Detected', 'Normal', 'Abnormal', 'High', 'Low', 'Critical']
  }],
  semiQuantitativeOptions: [{
    type: String,
    enum: ['Negative', 'Trace', '1+', '2+', '3+', '4+', 'Small', 'Moderate', 'Large']
  }],
  categoricalOptions: [{
    type: String
  }],
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
    showReferenceOnPrint: {
      type: Boolean,
      default: true
    },
    normalRangeMin: Number,
    normalRangeMax: Number,
    qualitativeOptions: [String],
    semiQuantitativeOptions: [String],
    categoricalOptions: [String],
    unit: String
  }],
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

labTestSchema.pre('save', async function(next) {
  if (this.category && (this.isNew || this.isModified('category'))) {
    const LabTestCategory = mongoose.model('LabTestCategory');
    const category = await LabTestCategory.findById(this.category);
    if (category) {
      this.categoryName = category.name;
    }
  }
  next();
});

labTestSchema.index({ name: 'text', description: 'text' });
labTestSchema.index({ category: 1 });
labTestSchema.index({ isActive: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);