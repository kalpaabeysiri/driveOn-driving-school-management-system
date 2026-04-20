const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  selectedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  marksAwarded: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { _id: true });

const learningQuizAttemptSchema = new mongoose.Schema({
  attemptNumber: { type: Number, required: true, min: 1 },
  scoreObtained: { type: Number, default: 0, min: 0 },
  totalScore:    { type: Number, default: 0, min: 0 },
  percentage:    { type: Number, default: 0, min: 0, max: 100 },
  startedAt:     { type: Date, default: Date.now },
  submittedAt:   { type: Date },
  status:        { type: String, enum: ['Passed', 'Failed', 'Pending'], default: 'Pending' },

  // Reference attributes
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  quiz:    { type: mongoose.Schema.Types.ObjectId, ref: 'LearningQuiz', required: true },
  answers: { type: [studentAnswerSchema], default: [] },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

learningQuizAttemptSchema.index({ student: 1, quiz: 1, attemptNumber: 1 }, { unique: true });
learningQuizAttemptSchema.index({ quiz: 1, createdDate: -1 });

module.exports = mongoose.model('LearningQuizAttempt', learningQuizAttemptSchema);
