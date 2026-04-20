const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionType: {
    type: String,
    enum: ['Theory', 'Practical'],
    required: [true, 'Session type is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
  },
  maxStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Must allow at least 1 student'],
    default: 10,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Scheduled',
  },
  notes: {
    type: String,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },

  // Reference attributes
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor',
    required: [true, 'Instructor is required'],
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    // Only required for practical sessions — validated in controller
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  feedbacks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
  }],

  // Legacy field for backward compatibility
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
  },

}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

// Keep legacy fields in sync
sessionSchema.pre('save', function (next) {
  this.type = this.sessionType;
  next();
});

// Virtual: spots remaining
sessionSchema.virtual('spotsRemaining').get(function () {
  return this.maxStudents - (this.enrolledStudents?.length || 0);
});

// Virtual: is full
sessionSchema.virtual('isFull').get(function () {
  return (this.enrolledStudents?.length || 0) >= this.maxStudents;
});

sessionSchema.set('toJSON',   { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Session', sessionSchema);
