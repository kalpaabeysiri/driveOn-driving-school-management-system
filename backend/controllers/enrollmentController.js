const EnrollmentCourse  = require('../models/EnrollmentCourse');
const EnrollmentPayment = require('../models/EnrollmentPayment');
const Student           = require('../models/Student');

// ══════════════════════════════════════════════════════════════════════════════
//  ENROLLMENT COURSE
// ══════════════════════════════════════════════════════════════════════════════

// @route POST /api/enrollment-courses
const createCourse = async (req, res) => {
  try {
    const { student, licenseCategory, courseFee, discount } = req.body;

    if (!student || !licenseCategory || !courseFee) {
      return res.status(400).json({ message: 'Student, licenseCategory and courseFee are required' });
    }

    const studentDoc = await Student.findById(student);
    if (!studentDoc) return res.status(404).json({ message: 'Student not found' });

    const course = await EnrollmentCourse.create({
      student, licenseCategory, courseFee,
      discount: discount || 0,
      createdBy: req.user.id,
    });

    // Add course to student's enrolledCourses
    studentDoc.enrolledCourses.push(course._id);
    await studentDoc.save();

    const populated = await course.populate([
      { path: 'student',         select: 'firstName lastName email' },
      { path: 'licenseCategory', select: 'licenseCategoryName' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/enrollment-courses
const getAllCourses = async (req, res) => {
  try {
    const filter = req.query.student ? { student: req.query.student } : {};

    const courses = await EnrollmentCourse.find(filter)
      .populate('student',         'firstName lastName email contactNo')
      .populate('licenseCategory', 'licenseCategoryName')
      .populate('payments')
      .populate('createdBy',       'name')
      .sort({ createdDate: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/enrollment-courses/:id
const getCourseById = async (req, res) => {
  try {
    const course = await EnrollmentCourse.findById(req.params.id)
      .populate('student',         'firstName lastName email contactNo NIC')
      .populate('licenseCategory', 'licenseCategoryName vehicleClasses')
      .populate('payments')
      .populate('createdBy',  'name')
      .populate('modifiedBy', 'name');

    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/enrollment-courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await EnrollmentCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.body.courseFee  !== undefined) course.courseFee  = req.body.courseFee;
    if (req.body.discount   !== undefined) course.discount   = req.body.discount;
    if (req.body.remainingBalance !== undefined) course.remainingBalance = req.body.remainingBalance;
    course.modifiedBy = req.user.id;

    const updated = await course.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/enrollment-courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await EnrollmentCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Remove from student's enrolledCourses
    await Student.findByIdAndUpdate(course.student, {
      $pull: { enrolledCourses: course._id },
    });

    // Delete associated payments
    await EnrollmentPayment.deleteMany({ course: course._id });

    await course.deleteOne();
    res.json({ message: 'Enrollment course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  ENROLLMENT PAYMENT
// ══════════════════════════════════════════════════════════════════════════════

// @route POST /api/enrollment-payments
const createPayment = async (req, res) => {
  try {
    const { student, course, amount } = req.body;

    if (!student || !course || !amount) {
      return res.status(400).json({ message: 'Student, course and amount are required' });
    }

    const courseDoc = await EnrollmentCourse.findById(course);
    if (!courseDoc) return res.status(404).json({ message: 'Course not found' });

    if (amount > courseDoc.remainingBalance) {
      return res.status(400).json({
        message: `Amount exceeds remaining balance of LKR ${courseDoc.remainingBalance}`,
      });
    }

    const payment = await EnrollmentPayment.create({
      student, course, amount,
      createdBy: req.user.id,
    });

    // Update remaining balance on course
    courseDoc.remainingBalance -= amount;
    courseDoc.payments.push(payment._id);
    await courseDoc.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/enrollment-payments
const getAllPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.course)  filter.course  = req.query.course;

    const payments = await EnrollmentPayment.find(filter)
      .populate('student', 'firstName lastName email')
      .populate('course',  'courseFee remainingBalance')
      .populate('createdBy', 'name')
      .sort({ createdDate: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/enrollment-payments/:id
const getPaymentById = async (req, res) => {
  try {
    const payment = await EnrollmentPayment.findById(req.params.id)
      .populate('student',   'firstName lastName email NIC')
      .populate('course',    'courseFee discount remainingBalance')
      .populate('createdBy', 'name');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/enrollment-payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await EnrollmentPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Restore remaining balance
    await EnrollmentCourse.findByIdAndUpdate(payment.course, {
      $inc: { remainingBalance: payment.amount },
      $pull: { payments: payment._id },
    });

    await payment.deleteOne();
    res.json({ message: 'Payment deleted and balance restored' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse,
  createPayment, getAllPayments, getPaymentById, deletePayment,
};
