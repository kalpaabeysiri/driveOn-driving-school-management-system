const express = require('express');
const router = express.Router();
const {
  getAllStudentProgress,
  getStudentProgress,
  updateStudentProgress,
  recalculateAllProgress,
  getProgressStats
} = require('../controllers/examProgressController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin and Instructor routes
router.get('/students', protect, adminOnly, getAllStudentProgress);
router.get('/stats', protect, adminOnly, getProgressStats);

// Student progress (students can view their own)
router.get('/students/:studentId', protect, getStudentProgress);

// Progress update (system/admin only)
router.post('/students/:studentId/update', protect, adminOnly, updateStudentProgress);

// Bulk recalculate all progress records (fixes stale data)
router.post('/recalculate-all', protect, adminOnly, recalculateAllProgress);

module.exports = router;
