// ── licenseCategories.js ─────────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createLicenseCategory, getAllLicenseCategories,
  getLicenseCategoryById, updateLicenseCategory, deleteLicenseCategory,
} = require('../controllers/licenseCategoryController');

router.route('/')
  .get(protect, getAllLicenseCategories)
  .post(protect, adminOnly, createLicenseCategory);
router.route('/:id')
  .get(protect, getLicenseCategoryById)
  .put(protect, adminOnly, updateLicenseCategory)
  .delete(protect, adminOnly, deleteLicenseCategory);

module.exports = router;
