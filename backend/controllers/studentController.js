const Student = require('../models/Student');
const EnrollmentCourse = require('../models/EnrollmentCourse');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');

const generateToken = (student) =>
  jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── ADMIN: Create student ────────────────────────────────────────────────────
// @route POST /api/students
const createStudent = async (req, res) => {
  try {
    const {
      firstName, lastName, NIC, contactNo, email, address,
      city, emergencyContactNo, dateOfBirth, gender, password,
    } = req.body;

    if (!firstName || !lastName || !NIC || !contactNo || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const exists = await Student.findOne({ $or: [{ email }, { NIC }] });
    if (exists) {
      return res.status(400).json({ message: 'Student with this email or NIC already exists' });
    }

    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    const student = await Student.create({
      firstName, lastName, NIC, contactNo, email, address,
      city, emergencyContactNo, dateOfBirth, gender, password,
      profileImage,
      registeredBy: req.user.id,
    });

    res.status(201).json({
      _id:          student._id,
      firstName:    student.firstName,
      lastName:     student.lastName,
      email:        student.email,
      NIC:          student.NIC,
      accountStatus:student.accountStatus,
      registeredDate: student.registeredDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: Get all students ──────────────────────────────────────────────────
// @route GET /api/students
const getAllStudents = async (req, res) => {
  try {
    const { status, city, search } = req.query;
    const filter = {};

    if (status)  filter.accountStatus = status;
    if (city)    filter.city = { $regex: city, $options: 'i' };
    if (search)  filter.$or = [
      { firstName:  { $regex: search, $options: 'i' } },
      { lastName:   { $regex: search, $options: 'i' } },
      { email:      { $regex: search, $options: 'i' } },
      { NIC:        { $regex: search, $options: 'i' } },
      { contactNo:  { $regex: search, $options: 'i' } },
    ];

    const students = await Student.find(filter)
      .select('-password')
      .populate('registeredBy', 'name')
      .populate('modifiedBy', 'name')
      .populate('enrolledCourses')
      .sort({ registeredDate: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN/STUDENT: Get single student ───────────────────────────────────────
// @route GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password')
      .populate('registeredBy', 'name email')
      .populate('modifiedBy', 'name email')
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
          { path: 'vehicle', select: 'brand model' },
        ],
      });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Students can only view their own profile
    if (req.user.role === 'student' && req.user.id !== student._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: Update student ────────────────────────────────────────────────────
// @route PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const allowedFields = [
      'firstName', 'lastName', 'contactNo', 'email', 'address',
      'city', 'emergencyContactNo', 'dateOfBirth', 'gender', 'accountStatus',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) student[field] = req.body[field];
    });

    if (req.file) student.profileImage = `/uploads/${req.file.filename}`;
    if (req.body.password) student.password = req.body.password;

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
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: Delete student ────────────────────────────────────────────────────
// @route DELETE /api/students/:id
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

// ── ADMIN: Update account status (active/suspend) ────────────────────────────
// @route PATCH /api/students/:id/status
const updateStudentStatus = async (req, res) => {
  try {
    const { accountStatus } = req.body;
    if (!['Active', 'Suspended'].includes(accountStatus)) {
      return res.status(400).json({ message: 'Status must be Active or Suspended' });
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

// ── STUDENT: Toggle reminder notifications ────────────────────────────────────
// @route PATCH /api/students/:id/reminders
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

// ── STUDENT: Book a session ───────────────────────────────────────────────────
// @route POST /api/students/:id/book-session
const bookSession = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (student.accountStatus === 'Suspended') {
      return res.status(403).json({ message: 'Your account is suspended. Cannot book sessions.' });
    }

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID is required' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Check if already booked
    if (student.bookedSessions.includes(sessionId)) {
      return res.status(400).json({ message: 'You have already booked this session' });
    }

    student.bookedSessions.push(sessionId);
    await student.save();

    res.json({ message: 'Session booked successfully', bookedSessions: student.bookedSessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: Monthly registrations report ──────────────────────────────────────
// @route GET /api/students/report/monthly
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

    const summary = {
      year,
      totalForYear:     formatted.reduce((a, b) => a + b.totalRegistrations, 0),
      monthlyBreakdown: formatted,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── STUDENT: Login ────────────────────────────────────────────────────────────
// @route POST /api/students/login
const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const student = await Student.findOne({ email });
    if (!student) return res.status(401).json({ message: 'Invalid email or password' });

    if (student.accountStatus === 'Suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact admin.' });
    }

    const isMatch = await student.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

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
