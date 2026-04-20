const Quiz = require('../models/Quiz');

// @desc  Create quiz (Admin)
// @route POST /api/quizzes
const createQuiz = async (req, res) => {
  try {
    const { title, titleSi, category, questions, duration, passMark } = req.body;

    if (!title || !category || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Title, category, and questions are required' });
    }

    const quiz = await Quiz.create({ title, titleSi, category, questions, duration, passMark });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all quizzes
// @route GET /api/quizzes
const getQuizzes = async (req, res) => {
  try {
    // Don't return correct answers to students
    const quizzes = await Quiz.find({ active: true })
      .select('-questions.correct')
      .sort({ title: 1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single quiz with answers (for taking quiz)
// @route GET /api/quizzes/:id
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update quiz (Admin)
// @route PUT /api/quizzes/:id
const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete quiz (Admin)
// @route DELETE /api/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createQuiz, getQuizzes, getQuizById, updateQuiz, deleteQuiz };
