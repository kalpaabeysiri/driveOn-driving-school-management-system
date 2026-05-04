// ── studentExams.js ──────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
  getStudentExams,
  getStudentExamById,
  getStudentExamStatus
} = require('../controllers/studentExamController');


router.get('/me/exams', protect, getStudentExams);

router.get('/me/exams/:id', protect, getStudentExamById);


router.get('/me/exam-status', protect, getStudentExamStatus);

module.exports = router;
