const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options:  [{ type: String, required: true }],
  correct:  { type: Number, required: true },
});

const quizSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  titleSi:     { type: String },
  category:    { type: String, required: true },
  questions:   [questionSchema],
  duration:    { type: Number, default: 15 }, // minutes
  passMark:    { type: Number, default: 60 },
  active:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
