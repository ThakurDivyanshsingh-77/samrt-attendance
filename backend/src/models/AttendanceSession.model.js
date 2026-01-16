 
const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  sessionCode: {
    type: String,
    required: true,
    length: 4,
    uppercase: true
  },
  year: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
  },
  semester: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5, 6]
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryTime: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  totalPresent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure only one active session per subject
attendanceSessionSchema.index({ subject: 1, isActive: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Index for session code lookup
attendanceSessionSchema.index({ sessionCode: 1, isActive: 1 });

// Index for expiry checking
attendanceSessionSchema.index({ expiryTime: 1, isExpired: 1 });

// ✅ FIX: Check if model exists before creating
module.exports = mongoose.models.AttendanceSession || mongoose.model('AttendanceSession', attendanceSessionSchema);
