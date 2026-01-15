const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
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
      minlength: 4,
      maxlength: 4
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
  },
  { timestamps: true }
);

/**
 * ✅ ONLY ONE ACTIVE + NON-EXPIRED SESSION PER SUBJECT
 */
attendanceSessionSchema.index(
  { subject: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      isExpired: false
    }
  }
);

/**
 * 🔑 Fast lookup by session code (students)
 */
attendanceSessionSchema.index(
  { sessionCode: 1, isActive: 1 }
);

/**
 * ⏱️ Expiry cron / job support
 */
attendanceSessionSchema.index(
  { expiryTime: 1, isExpired: 1 }
);

module.exports = mongoose.model(
  'AttendanceSession',
  attendanceSessionSchema
);
