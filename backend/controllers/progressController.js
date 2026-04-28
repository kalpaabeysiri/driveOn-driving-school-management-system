const Progress = require('../models/Progress');

// @desc  Submit quiz result
// @route POST /api/progress
const submitProgress = async (req, res) => {
  try {
    const { quiz, score, totalQuestions, correctAnswers, passed, timeTaken, answers } = req.body;

    if (!quiz || score === undefined || !totalQuestions) {
      return res.status(400).json({ message: 'Quiz, score, and totalQuestions are required' });
    }

    const progress = await Progress.create({
      student: req.user.id,
      quiz, score, totalQuestions, correctAnswers, passed, timeTaken, answers,
    });

    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get my progress records
// @route GET /api/progress
const getProgress = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { student: req.user.id };
    const progress = await Progress.find(filter)
      .populate('student', 'name email')
      .populate('quiz', 'title category')
      .sort({ completedAt: -1 });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get progress for a specific quiz
// @route GET /api/progress/quiz/:quizId
const getProgressByQuiz = async (req, res) => {
  try {
    const progress = await Progress.find({
      student: req.user.id,
      quiz: req.params.quizId,
    })
      .populate('quiz', 'title')
      .sort({ completedAt: -1 });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete progress record
// @route DELETE /api/progress/:id
const deleteProgress = async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);
    if (!progress) return res.status(404).json({ message: 'Progress record not found' });

    if (req.user.role !== 'admin' && progress.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await progress.deleteOne();
    res.json({ message: 'Progress record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitProgress, getProgress, getProgressByQuiz, deleteProgress };
