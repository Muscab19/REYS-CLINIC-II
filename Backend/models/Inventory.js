const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  medicationName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: ['prescription', 'restock', 'adjustment', 'damage', 'expiry'],
    required: true
  },
  reference: {
    type: String,
    default: ''
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByName: {
    type: String
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['antibiotics', 'painkillers', 'vaccines', 'vitamins', 'syrups', 'inhalers', 'injections', 'topical', 'other'],
    default: 'other'
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: 0,
    default: 0
  },
  minStock: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: 0,
    default: 10
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['tablet', 'capsule', 'ml', 'mg', 'bottle', 'vial', 'inhaler', 'tube', 'box'],
    default: 'tablet'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  expiryDate: {
    type: Date
  },
  manufacturer: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
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

// Virtual for transactions
inventorySchema.virtual('transactions', {
  ref: 'InventoryTransaction',
  localField: '_id',
  foreignField: 'medicationId'
});

// Method to check if stock is low
inventorySchema.methods.isLowStock = function() {
  return this.currentStock <= this.minStock;
};

// Method to get stock status
inventorySchema.methods.getStockStatus = function() {
  if (this.currentStock <= 0) return 'out_of_stock';
  if (this.currentStock <= this.minStock) return 'low_stock';
  return 'in_stock';
};

// Indexes - Remove duplicate index definitions
inventorySchema.index({ name: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ expiryDate: 1 });

// Create models
const Inventory = mongoose.model('Inventory', inventorySchema);
const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

// Export both models
module.exports = { Inventory, InventoryTransaction };