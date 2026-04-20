const LearningQuiz = require('../models/LearningQuiz');

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return 'At least one question is required';
  for (const q of questions) {
    if (!q.questionText) return 'Each question must have questionText';
    if (!Array.isArray(q.options) || q.options.length < 2) return 'Each question must have at least 2 options';
    const correctCount = q.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) return 'Each question must have exactly one correct option';
  }
  return null;
}

// @desc   Create quiz (Admin)
// @route  POST /api/learning/quizzes
const createQuiz = async (req, res) => {
  try {
    const {
      title, description, passMark, timeLimit, attemptLimit, status, lesson, questions,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const validationError = validateQuestions(questions);
    if (validationError) return res.status(400).json({ message: validationError });

    const quizData = {
      title,
      description,
      passMark: passMark ?? 0,
      timeLimit: timeLimit ?? 0,
      attemptLimit: attemptLimit ?? 1,
      status: status ?? 'Draft',
      questions,
      createdBy: req.user.id,
    };

    // Only add lesson if it exists
    if (lesson) {
      quizData.lesson = lesson;
    }

    const quiz = await LearningQuiz.create(quizData);

    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get quizzes
// @route  GET /api/learning/quizzes
const getQuizzes = async (req, res) => {
  try {
    const { lesson, status } = req.query;
    const filter = {};
    if (lesson) filter.lesson = lesson;
    if (status) filter.status = status;

    const quizzes = await LearningQuiz.find(filter)
      .populate('lesson', 'title status')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort({ createdDate: -1 });

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get quiz by id
// @route  GET /api/learning/quizzes/:id
const getQuizById = async (req, res) => {
  try {
    const quiz = await LearningQuiz.findById(req.params.id)
      .populate('lesson', 'title status')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name');

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Students should not receive correct answers
    if (req.user?.role === 'student') {
      const safe = quiz.toObject();
      safe.questions = (safe.questions || []).map((q) => ({
        ...q,
        options: (q.options || []).map((o) => ({ _id: o._id, optionText: o.optionText })),
      }));
      return res.json(safe);
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update quiz (Admin)
// @route  PUT /api/learning/quizzes/:id
const updateQuiz = async (req, res) => {
  try {
    const quiz = await LearningQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const allowedFields = [
      'title', 'description', 'passMark', 'timeLimit', 'attemptLimit', 'status', 'lesson',
    ];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) quiz[f] = req.body[f];
    });

    if (req.body.questions !== undefined) {
      const validationError = validateQuestions(req.body.questions);
      if (validationError) return res.status(400).json({ message: validationError });
      quiz.questions = req.body.questions;
    }

    quiz.modifiedBy = req.user.id;
    const updated = await quiz.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete quiz (Admin)
// @route  DELETE /api/learning/quizzes/:id
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await LearningQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createQuiz, getQuizzes, getQuizById, updateQuiz, deleteQuiz };
