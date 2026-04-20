const express = require('express');
const router = express.Router();
const {
  createQuiz, getQuizzes, getQuizById, updateQuiz, deleteQuiz,
} = require('../controllers/quizController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/')
  .get(protect, getQuizzes)
  .post(protect, adminOnly, createQuiz);

router.route('/:id')
  .get(protect, getQuizById)
  .put(protect, adminOnly, updateQuiz)
  .delete(protect, adminOnly, deleteQuiz);

module.exports = router;
