// ── attendance.js ─────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  markAttendance, getSessionAttendance, getStudentAttendance,
  updateAttendance, getAnalytics, getStudentProgress,
} = require('../controllers/attendanceController');

router.get('/analytics',              protect, adminOnly, getAnalytics);
router.get('/session/:sessionId',     protect, adminOnly, getSessionAttendance);
router.get('/student/:studentId',     protect, getStudentAttendance);
router.get('/progress/:studentId',    protect, adminOnly, getStudentProgress);
router.post('/',                      protect, adminOnly, markAttendance);
router.put('/:id',                    protect, adminOnly, updateAttendance);

module.exports = router;
