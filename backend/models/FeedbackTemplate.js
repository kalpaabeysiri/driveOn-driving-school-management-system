const mongoose = require('mongoose');

const feedbackTemplateSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: [true, 'Template comment is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Positive', 'Negative', 'Neutral'],
    default: 'Positive',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('FeedbackTemplate', feedbackTemplateSchema);
