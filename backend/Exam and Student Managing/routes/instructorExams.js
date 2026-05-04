// ── instructorExams.js ──────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
  getInstructorUpcomingExams,
  getInstructorUpcomingExamCounts
} = require('../controllers/instructorExamController');


router.get('/exams/upcoming', protect, getInstructorUpcomingExams);


router.get('/exams/upcoming/counts', protect, getInstructorUpcomingExamCounts);

module.exports = router;
