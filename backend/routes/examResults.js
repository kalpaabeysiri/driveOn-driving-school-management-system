const express = require('express');
const router = express.Router();
const {
  createExamResult,
  getStudentResults,
  getExamResults,
  getResultStats
} = require('../controllers/examResultController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only routes
router.post('/', protect, adminOnly, createExamResult);
router.get('/exam/:examType/:examId', protect, getExamResults);
router.get('/stats', protect, adminOnly, getResultStats);

// Student results (students can view their own)
router.get('/student/:studentId', protect, getStudentResults);

module.exports = router;
