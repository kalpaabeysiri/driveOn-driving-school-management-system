const Payment = require('../models/Payment');

// @desc  Create payment
// @route POST /api/payments
const createPayment = async (req, res) => {
  try {
    const { session, amount, method, reference, studentId } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ message: 'Amount and method are required' });
    }

    // Admin can specify which student; students always pay for themselves
    const payingStudent = (req.user.role === 'admin' && studentId) ? studentId : req.user.id;

    const receipt = req.file ? `/uploads/${req.file.filename}` : null;

    const payment = await Payment.create({
      student: payingStudent,
      session, amount, method, reference, receipt,
      status: 'Completed',
      paidAt: new Date(),
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all payments (admin) or my payments (student)
// @route GET /api/payments
const getPayments = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { student: req.user.id };
    const payments = await Payment.find(filter)
      .populate('student', 'name email')
      .populate('session', 'type date')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single payment
// @route GET /api/payments/:id
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email')
      .populate('session');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update payment status (Admin)
// @route PUT /api/payments/:id
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete payment (Admin)
// @route DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await payment.deleteOne();
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPayment, getPayments, getPaymentById, updatePayment, deletePayment };
