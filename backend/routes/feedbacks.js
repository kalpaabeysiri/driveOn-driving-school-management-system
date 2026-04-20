const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  submitFeedback, getAllFeedbacks, getFeedbackById, deleteFeedback,
  getTemplates, createTemplate, deleteTemplate,
} = require('../controllers/feedbackController');

// Templates
router.get('/templates',          protect, getTemplates);
router.post('/templates',         protect, adminOnly, createTemplate);
router.delete('/templates/:id',   protect, adminOnly, deleteTemplate);

// Feedback CRUD
router.route('/')
  .get(protect, getAllFeedbacks)
  .post(protect, submitFeedback);

router.route('/:id')
  .get(protect, getFeedbackById)
  .delete(protect, adminOnly, deleteFeedback);

module.exports = router;
