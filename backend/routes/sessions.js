// ── sessions.js ──────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createSession, getSessions, getSessionById,
  updateSession, deleteSession,
  bookSession, cancelBooking,
  enrollStudent, removeStudent,
  getAvailableSessions, getMyBookedSessions,
  monthlyReport,
} = require('../controllers/sessionController');

router.get('/report/monthly',   protect, adminOnly, monthlyReport);
router.get('/available',        protect, getAvailableSessions);
router.get('/my-bookings',      protect, getMyBookedSessions);

router.route('/')
  .get(protect, getSessions)
  .post(protect, adminOnly, createSession);

router.route('/:id')
  .get(protect, getSessionById)
  .put(protect, adminOnly, updateSession)
  .delete(protect, adminOnly, deleteSession);

// Student self-booking
router.post('/:id/book',                protect, bookSession);
router.delete('/:id/book',              protect, cancelBooking);

// Admin enroll/remove
router.post('/:id/enroll',              protect, adminOnly, enrollStudent);
router.delete('/:id/enroll/:studentId', protect, adminOnly, removeStudent);

module.exports = router;
