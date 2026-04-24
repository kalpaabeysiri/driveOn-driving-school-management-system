const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      unique: true,
    },

    staffAttendance: [
      {
        staff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Staff',
          required: true,
        },
        attended: {
          type: Boolean,
          default: false,
        },
      },
    ],

    instructorAttendance: [
      {
        instructor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Instructor',
          required: true,
        },
        attended: {
          type: Boolean,
          default: false,
        },
      },
    ],

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: 'createdDate',
      updatedAt: 'modifiedDate',
    },
  }
);

// Prevent duplicate attendance for same date
staffAttendanceSchema.index({ date: 1 }, { unique: true });

// Useful for filtering/searching attendance records
staffAttendanceSchema.index({ 'staffAttendance.staff': 1 });
staffAttendanceSchema.index({ 'instructorAttendance.instructor': 1 });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);