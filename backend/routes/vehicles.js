const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const {
  createVehicle, getAllVehicles, getVehicleById,
  updateVehicle, deleteVehicle, updateVehicleStatus,
  addInsurance, updateInsurance,
  addUsage, usageReport, expiryAlerts,
} = require('../controllers/vehicleController');

router.get('/report/usage',   protect, usageReport);
router.get('/alerts/expiry',  protect, expiryAlerts);

router.route('/')
  .get(protect, getAllVehicles)
  .post(protect, adminOnly, upload.single('image'), createVehicle);

router.route('/:id')
  .get(protect, getVehicleById)
  .put(protect, adminOnly, upload.single('image'), updateVehicle)
  .delete(protect, adminOnly, deleteVehicle);

router.patch('/:id/status',    protect, adminOnly, updateVehicleStatus);
router.post('/:id/insurance',  protect, adminOnly, addInsurance);
router.put('/:id/insurance',   protect, adminOnly, updateInsurance);
router.post('/:id/usage',      protect, addUsage);

module.exports = router;
