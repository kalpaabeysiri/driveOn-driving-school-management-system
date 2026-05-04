const mongoose = require('mongoose');

const studentLessonProgressSchema = new mongoose.Schema({
  completionStatus: {
    type: String,
    enum: ['NotStarted', 'InProgress', 'Completed'],
    default: 'NotStarted',
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastAccessedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },

  // Reference attributes
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  lesson:  { type: mongoose.Schema.Types.ObjectId, ref: 'LearningLesson', required: true },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

studentLessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });
studentLessonProgressSchema.index({ lesson: 1 });

module.exports = mongoose.model('StudentLessonProgress', studentLessonProgressSchema);
