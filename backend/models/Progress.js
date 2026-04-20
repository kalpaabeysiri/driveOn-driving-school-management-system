const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz:             { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  score:            { type: Number, required: true },
  totalQuestions:   { type: Number, required: true },
  correctAnswers:   { type: Number, required: true },
  passed:           { type: Boolean, required: true },
  timeTaken:        { type: Number }, // seconds
  answers:          [{ type: Number }],
  completedAt:      { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Progress', progressSchema);
