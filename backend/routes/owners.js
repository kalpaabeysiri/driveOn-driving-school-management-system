const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { createOwner, getAllOwners, getOwnerById, updateOwner, deleteOwner } = require('../controllers/ownerController');

router.route('/')
  .get(protect, getAllOwners)
  .post(protect, adminOnly, createOwner);

router.route('/:id')
  .get(protect, getOwnerById)
  .put(protect, adminOnly, updateOwner)
  .delete(protect, adminOnly, deleteOwner);

module.exports = router;
