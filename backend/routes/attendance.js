// ── attendance.js ─────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  markAttendance, getSessionAttendance, getStudentAttendance,
  updateAttendance, getAnalytics, getStudentProgress,
  selfMarkAttendance, confirmAttendance, deleteAttendance,
} = require('../controllers/attendanceController');

router.post('/self-mark',            protect, selfMarkAttendance);
router.post('/confirm',               protect, confirmAttendance);
router.get('/analytics',              protect, adminOnly, getAnalytics);
router.get('/session/:sessionId',     protect, getSessionAttendance);
router.get('/student/:studentId',     protect, getStudentAttendance);
router.get('/progress/:studentId',    protect, adminOnly, getStudentProgress);
router.post('/',                      protect, adminOnly, markAttendance);
router.put('/:id',                    protect, adminOnly, updateAttendance);
router.delete('/:id',                 protect, adminOnly, deleteAttendance);

module.exports = router;
