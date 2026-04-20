const mongoose = require('mongoose');

const practicalExamSchema = new mongoose.Schema({
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
  trialLocation: {
    type: String,
    required: true,
    trim: true
  },
  vehicleCategory: {
    type: String,
    enum: ['Light', 'Heavy', 'Bike'],
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
  examiner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instructor'
  },
  assignedVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
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
practicalExamSchema.index({ date: 1, status: 1 });
practicalExamSchema.index({ status: 1 });
practicalExamSchema.index({ vehicleCategory: 1, status: 1 });
practicalExamSchema.index({ createdBy: 1 });

module.exports = mongoose.model('PracticalExam', practicalExamSchema);
