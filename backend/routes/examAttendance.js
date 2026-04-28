const express = require('express');
const router = express.Router();
const {
  getAttendanceRecords,
  createAttendanceRecord,
  getAttendanceAnalytics,
  getAttendanceReports
} = require('../controllers/examAttendanceController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin and Instructor routes
router.get('/', protect, getAttendanceRecords);
router.post('/', protect, createAttendanceRecord);
router.get('/analytics', protect, getAttendanceAnalytics);
router.get('/reports', protect, adminOnly, getAttendanceReports);

module.exports = router;
