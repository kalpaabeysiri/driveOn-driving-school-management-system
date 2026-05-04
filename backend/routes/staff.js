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
  getStaffAttendance,
  markStaffAttendance,
  getStaffPerformance
} = require('../controllers/staffController');

// Public routes
router.post('/login', staffLogin);

// Protected routes
router.route('/')
  .get(protect, getAllStaff)
  .post(protect, adminOnly, upload.single('image'), createStaff);

// Static named routes MUST come before /:id to avoid being matched as a dynamic param
router.get('/attendance', protect, adminOnly, getStaffAttendance);
router.post('/attendance', protect, adminOnly, markStaffAttendance);
router.get('/performance', protect, adminOnly, getStaffPerformance);

router.route('/:id')
  .get(protect, getStaffById)
  .put(protect, adminOnly, upload.single('image'), updateStaff)
  .delete(protect, adminOnly, deleteStaff);

module.exports = router;
