const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  saleId: {
    type: String,
    unique: true
  },
  saleType: {
    type: String,
    enum: ['walkin', 'prescription'],
    default: 'walkin'
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    name: String,
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    required: true
  },
  change: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile', 'bank'],
    required: true
  },
  paymentDetails: {
    mobileNumber: String,
    bankName: String,
    transactionId: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  paymentNote: String,
  soldBy: {
    type: String,
    required: true
  },
  soldById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  saleDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique sale ID
saleSchema.pre('save', async function(next) {
  if (!this.saleId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = await mongoose.model('Sale').countDocuments();
    this.saleId = `SALE-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);