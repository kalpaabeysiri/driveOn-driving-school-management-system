// ── studentExams.js ──────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStudentExams,
  getStudentExamById,
  getStudentExamStatus
} = require('../controllers/studentExamController');

// @desc    Get all exams for current student
// @route   GET /api/student/me/exams
// @access Private (Student only)
router.get('/me/exams', protect, getStudentExams);

// @desc    Get specific exam details for student
// @route   GET /api/student/me/exams/:id
// @access Private (Student only)
router.get('/me/exams/:id', protect, getStudentExamById);

// @desc    Get exam status for student
// @route   GET /api/student/me/exam-status
// @access Private (Student only)
router.get('/me/exam-status', protect, getStudentExamStatus);

module.exports = router;
