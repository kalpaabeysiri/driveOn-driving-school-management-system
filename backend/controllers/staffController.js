const Staff = require('../models/Staff');
const StaffAttendance = require('../models/StaffAttendance');
const Instructor = require('../models/Instructor');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');

// Helper: normalize date to start of day
const normalizeDate = dateValue => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
};

// @desc    Register new staff member
// @route   POST /api/staff
// @access Private
const createStaff = async (req, res) => {
  try {
    const {
      fullName,
      NIC,
      dateOfBirth,
      address,
      city,
      gender,
      email,
      password,
      contactNumber,
      emergencyContact,
      position,
      employmentType,
      salary,
      permissions,
    } = req.body;

    const existingStaff = await Staff.findOne({
      $or: [
        { email: email?.toLowerCase()?.trim() },
        { NIC: NIC?.trim() },
      ],
    });

    if (existingStaff) {
      return res.status(400).json({
        message: 'Staff member with this email or NIC already exists',
      });
    }

    const year = new Date().getFullYear();

    const lastStaff = await Staff.findOne({
      employeeId: new RegExp(`^STF${year}`),
    }).sort({ employeeId: -1 });

    let nextNum = 1;

    if (lastStaff?.employeeId) {
      const match = lastStaff.employeeId.match(/(\d{4})$/);
      nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    }

    const employeeId = `STF${year}${String(nextNum).padStart(4, '0')}`;

    const staff = new Staff({
      employeeId,
      fullName,
      NIC,
      dateOfBirth,
      address,
      city,
      gender,
      email,
      password,
      contactNumber,
      emergencyContact,
      position,
      employmentType,
      salary,
      permissions,
      registeredBy: req.user?.id,
    });

    await staff.save();

    staff.password = undefined;

    res.status(201).json({
      message: 'Staff member created successfully',
      staff,
    });
  } catch (error) {
    console.error('Staff creation error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];

      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff members
// @route   GET /api/staff
// @access Private
const getAllStaff = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const filter = {};

    if (status) {
      filter.isActive = status === 'active';
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { NIC: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Staff.countDocuments(filter),
    ]);

    res.json({
      staff,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get staff by ID
// @route   GET /api/staff/:id
// @access Private
const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const recentAttendance = await StaffAttendance.find({
      'staffAttendance.staff': staff._id,
    })
      .select('date staffAttendance createdDate modifiedDate')
      .sort({ date: -1 })
      .limit(10);

    res.json({
      staff,
      recentAttendance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access Private
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const updates = { ...req.body };

    delete updates.department;
    delete updates.workSchedule;
    delete updates.employeeId;

    if (!updates.password) {
      delete updates.password;
    }

    updates.modifiedBy = req.user?.id;

    Object.assign(staff, updates);

    // Do not manually hash password here.
    // Staff model pre-save middleware will hash it if password is modified.
    await staff.save();

    staff.password = undefined;

    res.json({
      message: 'Staff member updated successfully',
      staff,
    });
  } catch (error) {
    console.error('Staff update error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];

      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// @desc    Deactivate staff member
// @route   DELETE /api/staff/:id
// @access Private
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    staff.isActive = false;
    staff.modifiedBy = req.user?.id;

    await staff.save();

    res.json({ message: 'Staff member deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Staff login
// @route   POST /api/staff/login
// @access Public
const staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const staff = await Staff.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!staff) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await staff.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: staff._id,
        email: staff.email,
        role: 'staff',
        position: staff.position,
        permissions: staff.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: staff._id,
        name: staff.fullName,
        email: staff.email,
        role: 'staff',
        position: staff.position,
        permissions: staff.permissions,
        employeeId: staff.employeeId,
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active staff and instructors for attendance UI
// @route   GET /api/staff/attendance/members
// @access Private
const getAttendanceMembers = async (req, res) => {
  try {
    const [staffMembers, instructors] = await Promise.all([
      Staff.find({ isActive: true })
        .select('employeeId fullName email contactNumber position')
        .sort({ fullName: 1 }),

      Instructor.find({ isActive: true })
        .select('instructorId employeeId fullName name email contactNumber')
        .sort({ fullName: 1 }),
    ]);

    res.json({
      staff: staffMembers,
      instructors,
    });
  } catch (error) {
    console.error('Get attendance members error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance by date
// @route   GET /api/staff/attendance?date=2026-04-24
// @access Private
const getStaffAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: 'Date is required',
      });
    }

    const attendanceDate = normalizeDate(date);

    const attendance = await StaffAttendance.findOne({
      date: attendanceDate,
    })
      .populate('staffAttendance.staff', 'employeeId fullName email contactNumber position')
      .populate('instructorAttendance.instructor', 'instructorId employeeId fullName name email contactNumber')
      .populate('markedBy', 'fullName email');

    if (!attendance) {
      const [staffMembers, instructors] = await Promise.all([
        Staff.find({ isActive: true })
          .select('employeeId fullName email contactNumber position')
          .sort({ fullName: 1 }),

        Instructor.find({ isActive: true })
          .select('instructorId employeeId fullName name email contactNumber')
          .sort({ fullName: 1 }),
      ]);

      return res.json({
        date: attendanceDate,
        staffAttendance: staffMembers.map(staff => ({
          staff,
          attended: false,
        })),
        instructorAttendance: instructors.map(instructor => ({
          instructor,
          attended: false,
        })),
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get staff attendance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save staff and instructor attendance sheet
// @route   POST /api/staff/attendance
// @access Private
const markStaffAttendance = async (req, res) => {
  try {
    const {
      date,
      staffAttendance = [],
      instructorAttendance = [],
      remarks,
    } = req.body;

    if (!date) {
      return res.status(400).json({
        message: 'Date is required',
      });
    }

    const attendanceDate = normalizeDate(date);

    const formattedStaffAttendance = staffAttendance.map(item => ({
      staff: item.staff || item.staffId,
      attended: Boolean(item.attended),
    }));

    const formattedInstructorAttendance = instructorAttendance.map(item => ({
      instructor: item.instructor || item.instructorId,
      attended: Boolean(item.attended),
    }));

    const attendance = await StaffAttendance.findOneAndUpdate(
      { date: attendanceDate },
      {
        date: attendanceDate,
        staffAttendance: formattedStaffAttendance,
        instructorAttendance: formattedInstructorAttendance,
        remarks,
        markedBy: req.user?.id,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    )
      .populate('staffAttendance.staff', 'employeeId fullName email contactNumber position')
      .populate('instructorAttendance.instructor', 'instructorId employeeId fullName name email contactNumber')
      .populate('markedBy', 'fullName email');

    res.status(200).json({
      message: 'Attendance saved successfully',
      attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// @desc    Get staff performance report
// @route   GET /api/staff/performance
// @access Private
const getStaffPerformance = async (req, res) => {
  try {
    const { month, year } = req.query;

    const dateFilter = {};

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      endDate.setHours(23, 59, 59, 999);

      dateFilter.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const attendanceRecords = await StaffAttendance.find(dateFilter)
      .populate('staffAttendance.staff', 'employeeId fullName position')
      .sort({ date: -1 });

    const reportMap = {};

    attendanceRecords.forEach(record => {
      record.staffAttendance.forEach(item => {
        if (!item.staff) return;

        const staffId = item.staff._id.toString();

        if (!reportMap[staffId]) {
          reportMap[staffId] = {
            staff: item.staff,
            totalMarkedDays: 0,
            presentDays: 0,
            absentDays: 0,
          };
        }

        reportMap[staffId].totalMarkedDays += 1;

        if (item.attended) {
          reportMap[staffId].presentDays += 1;
        } else {
          reportMap[staffId].absentDays += 1;
        }
      });
    });

    res.json({
      performance: Object.values(reportMap),
    });
  } catch (error) {
    console.error('Get staff performance error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  staffLogin,

  getAttendanceMembers,
  getStaffAttendance,
  markStaffAttendance,
  getStaffPerformance,
};