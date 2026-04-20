const mongoose = require('mongoose');

const learningLessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  contentType: {
    type: String,
    enum: ['Text', 'Video', 'Mixed'],
    default: 'Mixed',
  },
  estimatedDuration: {
    type: Number, // minutes
    default: 0,
    min: 0,
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['Published', 'Draft', 'Archived'],
    default: 'Draft',
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
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningTopic',
  },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

learningLessonSchema.index({ topic: 1, displayOrder: 1 });
learningLessonSchema.index({ displayOrder: 1 }); // Index for lessons without topics

module.exports = mongoose.model('LearningLesson', learningLessonSchema);
