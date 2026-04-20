const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  overallStatus: {
    type: String,
    enum: [
      'Not Started',
      'In Progress',
      'Assigned for Theory Exam',
      'Theory Passed',
      'Assigned for Practical Exam',
      'Practical Passed',
      'Completed'
    ],
    default: 'Not Started'
  },
  // Theory exam progress
  theoryExamAttempts: {
    type: Number,
    default: 0
  },
  lastTheoryExamDate: {
    type: Date
  },
  theoryExamStatus: {
    type: String,
    enum: ['Not Attempted', 'Failed', 'Passed'],
    default: 'Not Attempted'
  },
  // Practical exam progress
  practicalExamAttempts: {
    type: Number,
    default: 0
  },
  lastPracticalExamDate: {
    type: Date
  },
  practicalExamStatus: {
    type: String,
    enum: ['Not Attempted', 'Failed', 'Passed'],
    default: 'Not Attempted'
  },
  // Attendance tracking
  totalTheoryHours: {
    type: Number,
    default: 0
  },
  totalPracticalHours: {
    type: Number,
    default: 0
  },
  theoryAttendanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  practicalAttendanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Session completion
  totalSessionsAttended: {
    type: Number,
    default: 0
  },
  totalSessionsBooked: {
    type: Number,
    default: 0
  },
  // Course progress
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  completedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Payment status
  hasOutstandingBalance: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' }
});

// Index for efficient queries
studentProgressSchema.index({ student: 1 });
studentProgressSchema.index({ overallStatus: 1 });
studentProgressSchema.index({ theoryExamStatus: 1 });
studentProgressSchema.index({ practicalExamStatus: 1 });

// Pre-save middleware to update lastUpdated
studentProgressSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
