const mongoose = require('mongoose');

const enrollmentCourseSchema = new mongoose.Schema({
  courseFee: {
    type: Number,
    required: [true, 'Course fee is required'],
    min: [0, 'Fee cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  remainingBalance: {
    type: Number,
    default: 0,
    min: [0, 'Remaining balance cannot be negative'],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student is required'],
  },
  licenseCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LicenseCategory',
    required: [true, 'License category is required'],
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnrollmentPayment',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: { createdAt: 'createdDate', updatedAt: 'modifiedDate' } });

// Auto-calculate remaining balance before saving
enrollmentCourseSchema.pre('save', function (next) {
  const effectiveFee = this.courseFee - (this.discount || 0);
  // remaining balance is updated manually when payments come in
  if (this.isNew) {
    this.remainingBalance = effectiveFee;
  }
  next();
});

module.exports = mongoose.model('EnrollmentCourse', enrollmentCourseSchema);
