const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    required: function() {
      return !['Present', 'Absent', 'On Leave'].includes(this.status);
    }
  },
  checkOut: {
    type: Date
  },
  workHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'],
    required: true,
    default: 'Present'
  },
  leaveType: {
    type: String,
    enum: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Special'],
    required: function() {
      return this.status === 'On Leave';
    }
  },
  remarks: {
    type: String,
    trim: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  performanceMetrics: {
    tasksCompleted: {
      type: Number,
      default: 0
    },
    efficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    customerRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  }
}, {
  timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' }
});

// Indexes for efficient queries
staffAttendanceSchema.index({ staff: 1, date: -1 });
staffAttendanceSchema.index({ date: 1, status: 1 });
staffAttendanceSchema.index({ department: 1, date: 1 });
staffAttendanceSchema.index({ status: 1, date: 1 });

// Compound index to prevent duplicate attendance per staff per day
staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate work hours
staffAttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut - this.checkIn;
    this.workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    // Calculate overtime (after 8 hours)
    if (this.workHours > 8) {
      this.overtimeHours = Math.round((this.workHours - 8) * 100) / 100;
    }
  }
  next();
});

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
