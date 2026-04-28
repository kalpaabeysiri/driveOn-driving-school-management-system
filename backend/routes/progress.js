const express = require('express');
const router = express.Router();
const {
  submitProgress, getProgress, getProgressByQuiz, deleteProgress,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getProgress)
  .post(protect, submitProgress);

router.get('/quiz/:quizId', protect, getProgressByQuiz);
router.delete('/:id', protect, deleteProgress);

module.exports = router;
