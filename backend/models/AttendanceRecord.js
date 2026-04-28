const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  attendanceType: {
    type: String,
    enum: ['Theory', 'Practical'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  durationHours: {
    type: Number,
    required: true,
    min: 0.5,
    max: 8
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' }
});

// Index for efficient queries
attendanceRecordSchema.index({ student: 1, date: -1 });
attendanceRecordSchema.index({ attendanceType: 1, date: 1 });
attendanceRecordSchema.index({ verifiedBy: 1, date: -1 });
attendanceRecordSchema.index({ status: 1, date: 1 });

// Compound index for unique attendance per student per session
attendanceRecordSchema.index({ student: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
