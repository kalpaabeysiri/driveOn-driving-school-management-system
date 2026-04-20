const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const {
  createInstructor, getAllInstructors, getInstructorById,
  updateInstructor, deleteInstructor, assignVehicle, removeVehicle,
  getNotifications, markNotificationRead, markAllRead, instructorLogin,
} = require('../controllers/instructorController');

router.post('/login', instructorLogin);

router.route('/')
  .get(protect, getAllInstructors)
  .post(protect, adminOnly, upload.single('image'), createInstructor);

router.route('/:id')
  .get(protect, getInstructorById)
  .put(protect, adminOnly, upload.single('image'), updateInstructor)
  .delete(protect, adminOnly, deleteInstructor);

router.post('/:id/assign-vehicle',                  protect, adminOnly, assignVehicle);
router.delete('/:id/assign-vehicle/:vehicleId',     protect, adminOnly, removeVehicle);
router.get('/:id/notifications',                    protect, getNotifications);
router.patch('/:id/notifications/read-all',         protect, markAllRead);
router.patch('/notifications/:notifId/read',        protect, markNotificationRead);

module.exports = router;
