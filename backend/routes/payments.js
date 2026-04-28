const express = require('express');
const router = express.Router();
const {
  createPayment, getPayments, getPaymentById, updatePayment, deletePayment,
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getPayments)
  .post(protect, upload.single('receipt'), createPayment);

router.route('/:id')
  .get(protect, getPaymentById)
  .put(protect, adminOnly, updatePayment)
  .delete(protect, adminOnly, deletePayment);

module.exports = router;
