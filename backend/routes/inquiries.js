const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getInquiries,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  replyToInquiry,
  closeInquiry,
  getInquiryStats,
} = require('../controllers/inquiryController');

router.get('/stats', protect, adminOnly, getInquiryStats);
router.get('/', protect, getInquiries);
router.post('/', protect, createInquiry);
router.put('/:id/reply', protect, adminOnly, replyToInquiry);
router.patch('/:id/close', protect, adminOnly, closeInquiry);
router.put('/:id', protect, updateInquiry);
router.delete('/:id', protect, deleteInquiry);

module.exports = router;
