const mongoose = require('mongoose');

const videoTutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
  },
  videoUrl: {
    type: String, // external URL
    trim: true,
  },
  filePath: {
    type: String, // uploaded file path (served via /uploads)
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    default: '',
  },
  duration: {
    type: Number, // seconds
    default: 0,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },

  // Reference attributes
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningLesson',
    required: true,
  },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

videoTutorialSchema.index({ lesson: 1, createdDate: -1 });

videoTutorialSchema.pre('validate', function (next) {
  if (!this.videoUrl && !this.filePath) {
    return next(new Error('Either videoUrl or filePath is required'));
  }
  next();
});

module.exports = mongoose.model('VideoTutorial', videoTutorialSchema);
