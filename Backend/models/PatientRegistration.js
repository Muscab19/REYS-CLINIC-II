const mongoose = require('mongoose');

const patientRegistrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  childName: String, 
  parentName: String,
  referredTo: String,
  urgency: String,
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registeredByName: String,
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

patientRegistrationSchema.pre('save', async function(next) {
  if (!this.registrationId) {
    const date = new Date();
    const regNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.registrationId = `REG-${date.getFullYear()}${date.getMonth()+1}${date.getDate()}-${regNumber}`;
  }
  next();
});

module.exports = mongoose.model('PatientRegistration', patientRegistrationSchema);