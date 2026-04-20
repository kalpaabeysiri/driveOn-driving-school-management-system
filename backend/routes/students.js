// ── students.js ──────────────────────────────────────────────────────────────
const express       = require('express');
const router        = express.Router();
const upload        = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const {
  createStudent, getAllStudents, getStudentById, updateStudent,
  deleteStudent, updateStudentStatus, toggleReminders,
  bookSession, monthlyReport, studentLogin,
} = require('../controllers/studentController');

router.post('/login',                 studentLogin);
router.get('/report/monthly',         protect, adminOnly, monthlyReport);
router.route('/')
  .get(protect, adminOnly, getAllStudents)
  .post(protect, adminOnly, upload.single('profileImage'), createStudent);
router.route('/:id')
  .get(protect, getStudentById)
  .put(protect, adminOnly, upload.single('profileImage'), updateStudent)
  .delete(protect, adminOnly, deleteStudent);
router.patch('/:id/status',    protect, adminOnly, updateStudentStatus);
router.patch('/:id/reminders', protect, toggleReminders);
router.post('/:id/book-session', protect, bookSession);

module.exports = router;
