const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session is required'],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required'],
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Absent',
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  markedByRole: {
    type: String,
    enum: ['admin', 'student', 'instructor'],
    default: 'admin',
  },
  selfMarked: {
    type: Boolean,
    default: false,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
  },
  confirmedAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// One attendance record per student per session
attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
