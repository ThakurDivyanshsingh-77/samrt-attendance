
const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  markedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present'],
    default: 'present'
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate attendance
attendanceRecordSchema.index({ student: 1, session: 1 }, { unique: true });

// Indexes for reporting queries
attendanceRecordSchema.index({ student: 1, subject: 1 });
attendanceRecordSchema.index({ subject: 1, markedAt: 1 });
attendanceRecordSchema.index({ session: 1 });

// ✅ FIX: Check if model exists before creating
module.exports = mongoose.models.AttendanceRecord || mongoose.model('AttendanceRecord', attendanceRecordSchema);
