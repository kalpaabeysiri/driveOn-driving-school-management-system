const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'pdf', 'document'],
    required: [true, 'File type is required'],
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
  },
  originalName: {
    type: String,
    default: '',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningTopic',
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningLesson',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

studyMaterialSchema.index({ topic: 1, lesson: 1, status: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
