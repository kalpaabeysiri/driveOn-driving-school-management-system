const mongoose = require('mongoose');

const quizOptionSchema = new mongoose.Schema({
  optionText: { type: String, required: true, trim: true },
  sinhalaText: { type: String, default: '', trim: true }, // Sinhala translation
  isCorrect:  { type: Boolean, default: false },
}, { _id: true });

const quizQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  sinhalaText:  { type: String, default: '', trim: true }, // Sinhala translation
  marks:        { type: Number, default: 1, min: 0 },
  options:      { type: [quizOptionSchema], default: [] },
}, { _id: true });

const learningQuizSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Quiz title is required'], trim: true },
  description: { type: String, trim: true, default: '' },
  totalMarks:  { type: Number, default: 0, min: 0 },
  passMark:    { type: Number, default: 0, min: 0 },
  timeLimit:   { type: Number, default: 0, min: 0 }, // minutes; 0 = no limit
  attemptLimit:{ type: Number, default: 1, min: 1 },
  status:      { type: String, enum: ['Published', 'Draft', 'Inactive'], default: 'Draft' },
  language:    { type: String, enum: ['en', 'si', 'both'], default: 'en' }, // Quiz language: English, Sinhala, or Both

  // Reference attributes
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  modifiedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lesson:      { type: mongoose.Schema.Types.ObjectId, ref: 'LearningLesson' },

  questions:   { type: [quizQuestionSchema], default: [] },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

learningQuizSchema.index({ lesson: 1, status: 1 });
learningQuizSchema.index({ status: 1, language: 1 }); // Index for language filtering

learningQuizSchema.pre('save', function (next) {
  const total = (this.questions || []).reduce((sum, q) => sum + (q.marks || 0), 0);
  this.totalMarks = total;
  next();
});

module.exports = mongoose.model('LearningQuiz', learningQuizSchema);
