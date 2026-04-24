const express = require('express');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  staffLogin,
  getAttendanceMembers,
  getStaffAttendance,
  markStaffAttendance,
  getStaffPerformance,
} = require('../controllers/staffController');

// Public routes
router.post('/login', staffLogin);

// Protected staff CRUD routes
router
  .route('/')
  .get(protect, getAllStaff)
  .post(protect, adminOnly, upload.single('image'), createStaff);

// Static named routes MUST come before /:id

// Attendance routes
router.get('/attendance/members', protect, adminOnly, getAttendanceMembers);
router.get('/attendance', protect, adminOnly, getStaffAttendance);
router.post('/attendance', protect, adminOnly, markStaffAttendance);

// Performance route
router.get('/performance', protect, adminOnly, getStaffPerformance);

// Dynamic ID routes MUST stay last
router
  .route('/:id')
  .get(protect, getStaffById)
  .put(protect, adminOnly, upload.single('image'), updateStaff)
  .delete(protect, adminOnly, deleteStaff);

module.exports = router;