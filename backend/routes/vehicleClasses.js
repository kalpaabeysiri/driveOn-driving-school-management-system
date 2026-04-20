// ── vehicleClasses.js ────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createVehicleClass, getAllVehicleClasses,
  getVehicleClassById, updateVehicleClass, deleteVehicleClass,
} = require('../controllers/vehicleClassController');

router.route('/')
  .get(protect, getAllVehicleClasses)
  .post(protect, adminOnly, createVehicleClass);
router.route('/:id')
  .get(protect, getVehicleClassById)
  .put(protect, adminOnly, updateVehicleClass)
  .delete(protect, adminOnly, deleteVehicleClass);

module.exports = router;
