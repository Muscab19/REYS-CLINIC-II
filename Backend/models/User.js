const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['superadmin', 'doctor', 'reception', 'pharmacy', 'lab-tech', 'user'],
    default: 'user'
  },
  staffId: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate staff ID for staff users
userSchema.pre('save', async function(next) {
  if (!this.staffId && this.role !== 'user') {
    const prefix = {
      superadmin: 'SA',
      doctor: 'DR',
      reception: 'RC',
      pharmacy: 'PH',
      'lab-tech': 'LB'
    }[this.role] || 'ST';
    
    const count = await mongoose.model('User').countDocuments({ role: this.role });
    this.staffId = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);