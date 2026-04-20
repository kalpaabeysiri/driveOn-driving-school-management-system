// ── instructorExams.js ──────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInstructorUpcomingExams,
  getInstructorUpcomingExamCounts
} = require('../controllers/instructorExamController');

// @desc    Get upcoming exams for instructor
// @route   GET /api/instructor/exams/upcoming
// @access Private (Instructor only)
router.get('/exams/upcoming', protect, getInstructorUpcomingExams);

// @desc    Get upcoming exam counts for instructor
// @route   GET /api/instructor/exams/upcoming/counts
// @access Private (Instructor only)
router.get('/exams/upcoming/counts', protect, getInstructorUpcomingExamCounts);

module.exports = router;
