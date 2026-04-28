const mongoose = require('mongoose');

const learningTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Topic title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
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
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

learningTopicSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('LearningTopic', learningTopicSchema);
