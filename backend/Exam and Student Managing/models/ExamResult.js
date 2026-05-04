const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail'],
    required: true
  },
  examinerRemarks: {
    type: String,
    trim: true
  },
  recordedDate: {
    type: Date,
    default: Date.now
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  theoryExam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TheoryExam'
  },
  practicalExam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PracticalExam'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' }
});

// Ensure either theoryExam or practicalExam is set
examResultSchema.pre('validate', function(next) {
  if (!this.theoryExam && !this.practicalExam) {
    next(new Error('Either theoryExam or practicalExam must be specified'));
  } else if (this.theoryExam && this.practicalExam) {
    next(new Error('Cannot have both theoryExam and practicalExam for the same result'));
  } else {
    next();
  }
});

// Index for efficient queries
examResultSchema.index({ student: 1, recordedDate: -1 });
examResultSchema.index({ theoryExam: 1 });
examResultSchema.index({ practicalExam: 1 });
examResultSchema.index({ status: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
