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

    const loggedUserId = req.user.id || req.user._id?.toString();
    const isStudentUser = req.user.role === 'student';

    /*
      Student side:
      - Student can only pay for themselves.

      Admin/staff side:
      - Admin/staff must select a student.
      - The selected studentId will be used as the payment owner.
    */
    const payingStudent = isStudentUser ? loggedUserId : studentId;

    if (!payingStudent) {
      return res.status(400).json({
        message: 'Student is required',
      });
    }

    if (method === 'Bank Transfer' && !reference) {
      return res.status(400).json({
        message: 'Transaction ID is required for bank transfer payments',
      });
    }

    const receipt = req.file ? `/uploads/${req.file.filename}` : null;

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

    const populatedPayment = await Payment.findById(payment._id)
      .populate(
        'student',
        'name firstName lastName email NIC contactNumber phone mobile'
      )
      .populate('session', 'type sessionType date startTime');

    res.status(201).json({
      message:
        method === 'Bank Transfer'
          ? 'Bank transfer payment submitted successfully. Waiting for admin verification.'
          : 'Payment recorded successfully.',
      payment: populatedPayment,
    });
  } catch (error) {
    console.error('Create payment error:', error);

    res.status(500).json({
      message: error.message || 'Server error while creating payment',
    });
  }
};

// @desc  Get all payments for admin/staff or my payments for student
// @route GET /api/payments
const getPayments = async (req, res) => {
  try {
    const loggedUserId = req.user.id || req.user._id?.toString();
    const isStudentUser = req.user.role === 'student';

    const filter = isStudentUser ? { student: loggedUserId } : {};

    const payments = await Payment.find(filter)
      .populate(
        'student',
        'name firstName lastName email NIC contactNumber phone mobile'
      )
      .populate('session', 'type sessionType date startTime')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);

    res.status(500).json({
      message: error.message || 'Server error while loading payments',
    });
  }
};

// @desc  Get single payment
// @route GET /api/payments/:id
const getPaymentById = async (req, res) => {
  try {
    const loggedUserId = req.user.id || req.user._id?.toString();
    const isStudentUser = req.user.role === 'student';

    const payment = await Payment.findById(req.params.id)
      .populate(
        'student',
        'name firstName lastName email NIC contactNumber phone mobile'
      )
      .populate('session', 'type sessionType date startTime');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    /*
      Student can only view their own payments.
      Admin/staff can view all payments.
    */
    if (
      isStudentUser &&
      payment.student?._id?.toString() !== loggedUserId
    ) {
      return res.status(403).json({
        message: 'Not authorized to view this payment',
      });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment by ID error:', error);

    res.status(500).json({
      message: error.message || 'Server error while loading payment details',
    });
  }
};

// @desc  Update payment status Admin/Staff
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
      } else {
        payment.paidAt = undefined;
      }
    }

    if (reference !== undefined) {
      payment.reference = reference;
    }

    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        return res.status(400).json({
          message: 'Amount must be greater than 0',
        });
      }

      payment.amount = Number(amount);
    }

    if (method !== undefined) {
      if (!['Cash', 'Card', 'Bank Transfer'].includes(method)) {
        return res.status(400).json({
          message: 'Invalid payment method',
        });
      }

      payment.method = method;
    }

    if (session !== undefined) {
      payment.session = session || undefined;
    }

    if (req.file) {
      payment.receipt = `/uploads/${req.file.filename}`;
    }

    await payment.save();

    const updatedPayment = await Payment.findById(payment._id)
      .populate(
        'student',
        'name firstName lastName email NIC contactNumber phone mobile'
      )
      .populate('session', 'type sessionType date startTime');

    res.json({
      message: 'Payment updated successfully',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Update payment error:', error);

    res.status(500).json({
      message: error.message || 'Server error while updating payment',
    });
  }
};

// @desc  Delete payment Admin/Staff
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

    res.status(500).json({
      message: error.message || 'Server error while deleting payment',
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
};