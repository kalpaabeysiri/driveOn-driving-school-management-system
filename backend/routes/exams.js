const express = require('express');
const router = express.Router();
const {
  getTheoryExams,
  getTheoryExamById,
  createTheoryExam,
  updateTheoryExam,
  deleteTheoryExam,
  getUpcomingTheoryExams,
  getAssignableStudents,
  assignStudentToTheoryExam,
  unassignStudentFromTheoryExam
} = require('../controllers/theoryExamController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes (all authenticated users)
router.get('/', protect, getTheoryExams);
router.get('/upcoming', protect, getUpcomingTheoryExams);
router.get('/:id', protect, getTheoryExamById);

// Admin only routes - Full CRUD operations
router.post('/', protect, adminOnly, createTheoryExam);
router.put('/:id', protect, adminOnly, updateTheoryExam);
router.delete('/:id', protect, adminOnly, deleteTheoryExam);
router.get('/:id/assignable-students', protect, adminOnly, getAssignableStudents);
router.post('/:id/assign-student', protect, adminOnly, assignStudentToTheoryExam);
router.post('/:id/unassign-student', protect, adminOnly, unassignStudentFromTheoryExam);

module.exports = router;
