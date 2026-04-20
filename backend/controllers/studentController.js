const Student          = require('../models/Student');
const EnrollmentCourse = require('../models/EnrollmentCourse');
const Session          = require('../models/Session');
const jwt              = require('jsonwebtoken');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateToken = (student) =>
  jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '30d' });

const NIC_REGEX   = /^([0-9]{9}[VvXx]|[0-9]{12})$/;
const PHONE_REGEX = /^0[0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Collect all validation errors for student create/update.
 * Returns an array of error strings (empty = all good).
 */
const validateStudentFields = (fields, isCreate = true) => {
  const {
    firstName, lastName, NIC, contactNo, email,
    emergencyContactNo, dateOfBirth, gender, password,
  } = fields;

  const errs = [];

  // ── Required fields (create only) ─────────────────────────────────────────
  if (isCreate) {
    if (!firstName || !lastName || !NIC || !contactNo || !email || !password) {
      errs.push('Please fill all required fields: firstName, lastName, NIC, contactNo, email, password.');
      // Return early — no point checking format if empty
      return errs;
    }
  }

  // ── First name ─────────────────────────────────────────────────────────────
  if (firstName !== undefined) {
    if (!firstName.trim()) {
      errs.push('First name is required.');
    } else if (firstName.trim().length < 2) {
      errs.push('First name must be at least 2 characters.');
    } else if (firstName.trim().length > 50) {
      errs.push('First name cannot exceed 50 characters.');
    }
  }

  // ── Last name ──────────────────────────────────────────────────────────────
  if (lastName !== undefined) {
    if (!lastName.trim()) {
      errs.push('Last name is required.');
    } else if (lastName.trim().length < 2) {
      errs.push('Last name must be at least 2 characters.');
    } else if (lastName.trim().length > 50) {
      errs.push('Last name cannot exceed 50 characters.');
    }
  }

  // ── NIC ────────────────────────────────────────────────────────────────────
  if (NIC !== undefined) {
    if (!NIC.trim()) {
      errs.push('NIC is required.');
    } else if (!NIC_REGEX.test(NIC.trim())) {
      errs.push('Invalid NIC format. Use 9 digits + V/X (old format, e.g. 871234567V) or 12 digits (new format, e.g. 200012345678).');
    }
  }

  // ── Contact number ─────────────────────────────────────────────────────────
  if (contactNo !== undefined) {
    if (!contactNo.trim()) {
      errs.push('Contact number is required.');
    } else if (!PHONE_REGEX.test(contactNo.trim())) {
      errs.push('Contact number must be a valid 10-digit Sri Lankan number starting with 0 (e.g. 0771234567).');
    }
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  if (email !== undefined) {
    if (!email.trim()) {
      errs.push('Email is required.');
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.push('Please provide a valid email address.');
    }
  }

  // ── Emergency contact (optional but must be valid if provided) ─────────────
  if (emergencyContactNo && emergencyContactNo.trim()) {
    if (!PHONE_REGEX.test(emergencyContactNo.trim())) {
      errs.push('Emergency contact must be a valid 10-digit Sri Lankan number starting with 0.');
    }
  }

  // ── Date of birth (optional but must be valid + age ≥ 16) ─────────────────
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      errs.push('Date of birth must be a valid date (YYYY-MM-DD).');
    } else {
      const today  = new Date();
      const minAge = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      if (dob > minAge) {
        errs.push('Student must be at least 16 years old.');
      }
    }
  }

  // ── Gender ─────────────────────────────────────────────────────────────────
  if (gender !== undefined && !['Male', 'Female', 'Other'].includes(gender)) {
    errs.push('Gender must be Male, Female, or Other.');
  }

  // ── Password (create: required; update: optional but if provided check length) ──
  if (isCreate && !password) {
    errs.push('Password is required.');
  } else if (password && password.length < 6) {
    errs.push('Password must be at least 6 characters.');
  }

  return errs;
};

// ─── ADMIN: Create student ────────────────────────────────────────────────────
// @route  POST /api/students
// @access Admin
const createStudent = async (req, res) => {
  try {
    const {
      firstName, lastName, NIC, contactNo, email, address,
      city, emergencyContactNo, dateOfBirth, gender, password,
    } = req.body;

    // 1. Validate inputs
    const errs = validateStudentFields(req.body, true);
    if (errs.length) {
      return res.status(400).json({ message: errs[0], errors: errs });
    }

    // 2. Check uniqueness
    const exists = await Student.findOne({ $or: [{ email: email.toLowerCase() }, { NIC: NIC.trim() }] });
    if (exists) {
      const field = exists.email === email.toLowerCase() ? 'email' : 'NIC';
      return res.status(400).json({ message: `A student with this ${field} already exists.` });
    }

    // 3. Create
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const student = await Student.create({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      NIC:       NIC.trim(),
      contactNo: contactNo.trim(),
      email:     email.trim().toLowerCase(),
      address, city,
      emergencyContactNo: emergencyContactNo || '',
      dateOfBirth: dateOfBirth || null,
      gender:   gender || 'Male',
      password,
      profileImage,
      registeredBy: req.user.id,
    });

    res.status(201).json({
      _id:            student._id,
      firstName:      student.firstName,
      lastName:       student.lastName,
      email:          student.email,
      NIC:            student.NIC,
      accountStatus:  student.accountStatus,
      registeredDate: student.registeredDate,
    });

  } catch (error) {
    // Handle Mongoose unique index violation
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `A student with this ${field} already exists.` });
    }
    // Handle Mongoose validation errors from the model
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: msgs[0], errors: msgs });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN: Get all students ──────────────────────────────────────────────────
// @route  GET /api/students
// @access Admin
const getAllStudents = async (req, res) => {
  try {
    const { status, city, search } = req.query;
    const filter = {};

    if (status) filter.accountStatus = status;
    if (city)   filter.city = { $regex: city, $options: 'i' };
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
      { NIC:       { $regex: search, $options: 'i' } },
      { contactNo: { $regex: search, $options: 'i' } },
    ];

    const students = await Student.find(filter)
      .select('-password')
      .populate('registeredBy', 'name')
      .populate('modifiedBy',   'name')
      .populate('enrolledCourses')
      .sort({ registeredDate: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN/STUDENT: Get single student ───────────────────────────────────────
// @route  GET /api/students/:id
// @access Admin | own Student
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password')
      .populate('registeredBy', 'name email')
      .populate('modifiedBy',   'name email')
      .populate({
        path: 'enrolledCourses',
        populate: [
          { path: 'licenseCategory', select: 'licenseCategoryName' },
          { path: 'payments' },
        ],
      })
      .populate({
        path: 'bookedSessions',
        populate: [
          { path: 'instructor', select: 'fullName' },
          { path: 'vehicle',    select: 'brand model' },
        ],
      });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (req.user.role === 'student' && req.user.id !== student._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN: Update student ────────────────────────────────────────────────────
// @route  PUT /api/students/:id
// @access Admin
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Validate only the fields that are being updated
    const errs = validateStudentFields(req.body, false);
    if (errs.length) {
      return res.status(400).json({ message: errs[0], errors: errs });
    }

    // Check email uniqueness if email is being changed
    if (req.body.email && req.body.email.toLowerCase() !== student.email) {
      const emailExists = await Student.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({ message: 'A student with this email already exists.' });
      }
    }

    const allowedFields = [
      'firstName', 'lastName', 'contactNo', 'email', 'address',
      'city', 'emergencyContactNo', 'dateOfBirth', 'gender', 'accountStatus',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) student[field] = req.body[field];
    });

    if (req.file)        student.profileImage = `/uploads/${req.file.filename}`;
    if (req.body.password) student.password   = req.body.password;

    student.modifiedBy = req.user.id;
    const updated = await student.save();

    res.json({
      _id:           updated._id,
      firstName:     updated.firstName,
      lastName:      updated.lastName,
      email:         updated.email,
      accountStatus: updated.accountStatus,
      modifiedDate:  updated.modifiedDate,
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `A student with this ${field} already exists.` });
    }
    if (error.name === 'ValidationError') {
      const msgs = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: msgs[0], errors: msgs });
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN: Delete student ────────────────────────────────────────────────────
// @route  DELETE /api/students/:id
// @access Admin
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await student.deleteOne();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN: Update account status ────────────────────────────────────────────
// @route  PATCH /api/students/:id/status
// @access Admin
const updateStudentStatus = async (req, res) => {
  try {
    const { accountStatus } = req.body;
    if (!['Active', 'Suspended'].includes(accountStatus)) {
      return res.status(400).json({ message: 'Status must be Active or Suspended.' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { accountStatus, modifiedBy: req.user.id },
      { new: true }
    ).select('-password');

    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── STUDENT: Toggle reminders ────────────────────────────────────────────────
// @route  PATCH /api/students/:id/reminders
// @access own Student
const toggleReminders = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (req.user.role === 'student' && req.user.id !== student._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    student.reminderNotifications = !student.reminderNotifications;
    await student.save();

    res.json({
      message: `Reminders ${student.reminderNotifications ? 'enabled' : 'disabled'}`,
      reminderNotifications: student.reminderNotifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── STUDENT: Book a session ──────────────────────────────────────────────────
// @route  POST /api/students/:id/book-session
// @access Student
const bookSession = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (student.accountStatus === 'Suspended') {
      return res.status(403).json({ message: 'Your account is suspended. Cannot book sessions.' });
    }

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID is required.' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (student.bookedSessions.includes(sessionId)) {
      return res.status(400).json({ message: 'You have already booked this session.' });
    }

    student.bookedSessions.push(sessionId);
    await student.save();

    res.json({ message: 'Session booked successfully', bookedSessions: student.bookedSessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN: Monthly registrations report ─────────────────────────────────────
// @route  GET /api/students/report/monthly
// @access Admin
const monthlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const report = await Student.aggregate([
      {
        $match: {
          registeredDate: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$registeredDate' } },
          totalRegistrations: { $sum: 1 },
          activeStudents:     { $sum: { $cond: [{ $eq: ['$accountStatus', 'Active'] }, 1, 0] } },
          suspendedStudents:  { $sum: { $cond: [{ $eq: ['$accountStatus', 'Suspended'] }, 1, 0] } },
          students: {
            $push: {
              name:   { $concat: ['$firstName', ' ', '$lastName'] },
              email:  '$email',
              status: '$accountStatus',
              date:   '$registeredDate',
            },
          },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ];

    const formatted = report.map(r => ({
      month:              monthNames[r._id.month - 1],
      monthNumber:        r._id.month,
      totalRegistrations: r.totalRegistrations,
      activeStudents:     r.activeStudents,
      suspendedStudents:  r.suspendedStudents,
      students:           r.students,
    }));

    res.json({
      year: targetYear,
      totalForYear:     formatted.reduce((a, b) => a + b.totalRegistrations, 0),
      monthlyBreakdown: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── STUDENT: Login ───────────────────────────────────────────────────────────
// @route  POST /api/students/login
// @access Public
const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) return res.status(401).json({ message: 'Invalid email or password.' });

    if (student.accountStatus === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact admin.' });
    }

    const isMatch = await student.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    res.json({
      _id:                   student._id,
      firstName:             student.firstName,
      lastName:              student.lastName,
      email:                 student.email,
      accountStatus:         student.accountStatus,
      reminderNotifications: student.reminderNotifications,
      token:                 generateToken(student),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStudent, getAllStudents, getStudentById, updateStudent,
  deleteStudent, updateStudentStatus, toggleReminders,
  bookSession, monthlyReport, studentLogin,
};