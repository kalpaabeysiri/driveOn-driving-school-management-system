const Payment = require('../models/Payment');

// @desc  Create payment
// @route POST /api/payments
const createPayment = async (req, res) => {
  try {
    const { session, amount, method, reference, studentId } = req.body;

    if (!amount || !method) {
      return res.status(400).json({
        message: 'Amount and method are required',
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0',
      });
    }

    if (!['Cash', 'Card', 'Bank Transfer'].includes(method)) {
      return res.status(400).json({
        message: 'Invalid payment method',
      });
    }

    const isAdmin = req.user.role === 'admin';

    // Admin can select any student.
    // Student can only pay for himself/herself.
    const payingStudent = isAdmin && studentId ? studentId : req.user.id;

    if (!payingStudent) {
      return res.status(400).json({
        message: 'Student is required',
      });
    }

    // For bank transfer, transaction/reference is required
    if (method === 'Bank Transfer' && !reference) {
      return res.status(400).json({
        message: 'Transaction ID is required for bank transfer payments',
      });
    }

    const receipt = req.file ? `/uploads/${req.file.filename}` : null;

    // Bank transfers should wait for admin verification
    const paymentStatus = method === 'Bank Transfer' ? 'Pending' : 'Completed';

    const payment = await Payment.create({
      student: payingStudent,
      session: session || undefined,
      amount: Number(amount),
      method,
      reference: reference || undefined,
      receipt,
      status: paymentStatus,
      paidAt: paymentStatus === 'Completed' ? new Date() : undefined,
    });

    res.status(201).json({
      message:
        method === 'Bank Transfer'
          ? 'Bank transfer payment submitted successfully. Waiting for admin verification.'
          : 'Payment recorded successfully.',
      payment,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all payments admin or my payments student
// @route GET /api/payments
const getPayments = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { student: req.user.id };

    const payments = await Payment.find(filter)
      .populate('student', 'name firstName lastName email NIC')
      .populate('session', 'type sessionType date startTime')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single payment
// @route GET /api/payments/:id
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name firstName lastName email NIC')
      .populate('session', 'type sessionType date startTime');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      payment.student?._id?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Not authorized to view this payment',
      });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update payment status Admin
// @route PUT /api/payments/:id
const updatePayment = async (req, res) => {
  try {
    const { status, reference, amount, method, session } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    if (status) {
      if (!['Pending', 'Completed', 'Failed', 'Refunded'].includes(status)) {
        return res.status(400).json({
          message: 'Invalid payment status',
        });
      }

      payment.status = status;

      if (status === 'Completed') {
        payment.paidAt = payment.paidAt || new Date();
      }

      if (status !== 'Completed') {
        payment.paidAt = undefined;
      }
    }

    if (reference !== undefined) payment.reference = reference;
    if (amount !== undefined) payment.amount = Number(amount);
    if (method !== undefined) payment.method = method;
    if (session !== undefined) payment.session = session || undefined;

    if (req.file) {
      payment.receipt = `/uploads/${req.file.filename}`;
    }

    await payment.save();

    res.json({
      message: 'Payment updated successfully',
      payment,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete payment Admin
// @route DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    await payment.deleteOne();

    res.json({
      message: 'Payment deleted',
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
};