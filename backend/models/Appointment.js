const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduled_for: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'DECLINED'],
    default: 'PENDING'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevent double-booking: only one appointment per doctor per time slot
appointmentSchema.index({ doctor_id: 1, scheduled_for: 1 }, { unique: true });

// Update the updated_at field before saving
appointmentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
