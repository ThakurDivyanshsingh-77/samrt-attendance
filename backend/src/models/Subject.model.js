
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true
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
  credits: {
    type: Number,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
subjectSchema.index({ year: 1, semester: 1 });
subjectSchema.index({ code: 1 });

// ✅ FIX: Check if model exists before creating
module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);