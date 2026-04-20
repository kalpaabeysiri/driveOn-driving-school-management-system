const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getNotifications,
  sendNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');

// Get notifications for logged-in user
router.get('/', protect, getNotifications);

// Send notification (Admin only)
router.post('/', protect, adminOnly, sendNotification);

// Mark notification as read
router.patch('/:id/read', protect, markNotificationRead);

// Mark all notifications as read
router.patch('/read-all', protect, markAllNotificationsRead);

// Delete notification
router.delete('/:id', protect, deleteNotification);

// Get notification statistics (Admin only)
router.get('/stats', protect, adminOnly, getNotificationStats);

module.exports = router;
