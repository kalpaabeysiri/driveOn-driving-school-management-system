const mongoose = require('mongoose');

const theoryExamSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  locationOrHall: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    enum: ['English', 'Sinhala', 'Tamil'],
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  maxSeats: {
    type: Number,
    default: 10,
    min: 1,
    max: 10
  },
  // External source tracking
  sourceType: {
    type: String,
    enum: ['manual', 'external', 'imported', 'seeded'],
    default: 'manual'
  },
  sourceNote: {
    type: String,
    trim: true
  },
  externalReferenceId: {
    type: String,
    trim: true
  },
  importedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Changed from 'Admin' to 'User'
    required: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  results: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamResult'
  }]
}, {
  timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' }
});

// Index for efficient queries
theoryExamSchema.index({ date: 1, status: 1 });
theoryExamSchema.index({ status: 1 });
theoryExamSchema.index({ createdBy: 1 });

module.exports = mongoose.model('TheoryExam', theoryExamSchema);
