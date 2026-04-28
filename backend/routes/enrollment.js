// ── enrollmentCourses.js ─────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse,
  createPayment, getAllPayments, getPaymentById, deletePayment,
} = require('../controllers/enrollmentController');

// Courses
router.route('/courses')
  .get(protect, getAllCourses)
  .post(protect, adminOnly, createCourse);
router.route('/courses/:id')
  .get(protect, getCourseById)
  .put(protect, adminOnly, updateCourse)
  .delete(protect, adminOnly, deleteCourse);

// Payments
router.route('/payments')
  .get(protect, getAllPayments)
  .post(protect, adminOnly, createPayment);
router.route('/payments/:id')
  .get(protect, getPaymentById)
  .delete(protect, adminOnly, deletePayment);

module.exports = router;
