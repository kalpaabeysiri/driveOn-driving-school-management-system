const mongoose = require('mongoose');

const enrollmentPaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Amount must be greater than 0'],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnrollmentCourse',
    required: [true, 'Course is required'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: { createdAt: 'createdDate', updatedAt: false } });

module.exports = mongoose.model('EnrollmentPayment', enrollmentPaymentSchema);
