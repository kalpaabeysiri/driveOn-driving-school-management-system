const express = require('express');
const router = express.Router();
const {
  getPracticalExams,
  getPracticalExamById,
  createPracticalExam,
  updatePracticalExam,
  deletePracticalExam,
  getUpcomingPracticalExams,
  getAssignableStudents,
  assignStudentToPracticalExam,
  unassignStudentFromPracticalExam
} = require('../controllers/practicalExamController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes (all authenticated users)
router.get('/', protect, getPracticalExams);
router.get('/upcoming', protect, getUpcomingPracticalExams);
router.get('/:id', protect, getPracticalExamById);

// Admin only routes - Full CRUD operations
router.post('/', protect, adminOnly, createPracticalExam);
router.put('/:id', protect, adminOnly, updatePracticalExam);
router.delete('/:id', protect, adminOnly, deletePracticalExam);
router.get('/:id/assignable-students', protect, adminOnly, getAssignableStudents);
router.post('/:id/assign-student', protect, adminOnly, assignStudentToPracticalExam);
router.post('/:id/unassign-student', protect, adminOnly, unassignStudentFromPracticalExam);

module.exports = router;
