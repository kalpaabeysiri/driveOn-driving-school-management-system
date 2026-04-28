const Staff = require('../models/Staff');
const StaffAttendance = require('../models/StaffAttendance');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

// @desc    Register new staff member
// @route   POST /api/staff
// @access Private (Admin only)
const createStaff = async (req, res) => {
  try {
    const {
      fullName, NIC, dateOfBirth, address, city, gender,
      email, password, contactNumber, emergencyContact,
      department, position, employmentType, salary, workSchedule,
      permissions
    } = req.body;

    // Check if staff already exists
    const existingStaff = await Staff.findOne({
      $or: [{ email }, { NIC }]
    });

    if (existingStaff) {
      return res.status(400).json({ 
        message: 'Staff member with this email or NIC already exists' 
      });
    }

    // Generate employee ID — derive next number from the highest existing ID
    const year = new Date().getFullYear();
    const lastStaff = await Staff.findOne({ employeeId: new RegExp(`^EMP${year}`) }).sort({ employeeId: -1 });
    let nextNum = 1;
    if (lastStaff?.employeeId) {
      const match = lastStaff.employeeId.match(/(\d{4})$/);
      nextNum = match ? parseInt(match[1]) + 1 : 1;
    }
    const employeeId = `EMP${year}${String(nextNum).padStart(4, '0')}`;

    const staff = new Staff({
      employeeId,
      fullName, NIC, dateOfBirth, address, city, gender,
      email, password, contactNumber, emergencyContact,
      department, position, employmentType, salary, workSchedule,
      permissions,
      registeredBy: req.user.id
    });

    await staff.save();

    // Remove password from response
    staff.password = undefined;

    res.status(201).json({
      message: 'Staff member created successfully',
      staff
    });
  } catch (error) {
    console.error('Staff creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff members
// @route   GET /api/staff
// @access Private (Admin, HR)
const getAllStaff = async (req, res) => {
  try {
    const { department, status, page = 1, limit = 20, search } = req.query;
    
    // Build filter
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.isActive = status === 'active';
    
    // Search functionality
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      Staff.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Staff.countDocuments(filter)
    ]);

    res.json({
      staff,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
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

    // Get recent attendance
    const recentAttendance = await StaffAttendance.find({ staff: staff._id })
      .sort({ date: -1 })
      .limit(10);

    res.json({
      staff,
      recentAttendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access Private (Admin only)
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Update fields
    const updates = req.body;
    updates.modifiedBy = req.user.id;

    // If password is being updated, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    Object.assign(staff, updates);
    await staff.save();

    staff.password = undefined;

    res.json({
      message: 'Staff member updated successfully',
      staff
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access Private (Admin only)
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Soft delete by deactivating
    staff.isActive = false;
    staff.modifiedBy = req.user.id;
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

    // Check for staff member
    const staff = await Staff.findOne({ email, isActive: true });
    
    if (!staff) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await staff.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: staff._id, 
        email: staff.email,
        role: 'staff',
        department: staff.department,
        permissions: staff.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    staff.password = undefined;

    res.json({
      token,
      user: {
        id: staff._id,
        name: staff.fullName,
        email: staff.email,
        role: 'staff',
        department: staff.department,
        permissions: staff.permissions,
        employeeId: staff.employeeId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get staff attendance
// @route   GET /api/staff/attendance
// @access Private (Admin, HR)
const getStaffAttendance = async (req, res) => {
  try {
    const { 
      staffId, department, status, month, year, 
      page = 1, limit = 20 
    } = req.query;
    
    // Build filter
    const filter = {};
    if (staffId) filter.staff = staffId;
    if (status) filter.status = status;
    
    // Filter by date range
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    // If department is specified, get staff from that department
    if (department) {
      const staffMembers = await Staff.find({ department }).select('_id');
      filter.staff = { $in: staffMembers.map(s => s._id) };
    }

    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      StaffAttendance.find(filter)
        .populate('staff', 'fullName employeeId department position')
        .populate('verifiedBy', 'fullName employeeId')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StaffAttendance.countDocuments(filter)
    ]);

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark staff attendance
// @route   POST /api/staff/attendance
// @access Private (Admin, HR)
const markStaffAttendance = async (req, res) => {
  try {
    const { staffId, date, checkIn, checkOut, status, remarks, performanceMetrics } = req.body;

    // Check if attendance already exists for this date (UTC)
    const [year, month, day] = date.split('-').map(Number);
    const dateStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dateEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const existing = await StaffAttendance.findOne({
      staff: staffId,
      date: { $gte: dateStart, $lte: dateEnd }
    });

    if (existing) {
      // Update existing attendance
      existing.checkIn = checkIn || existing.checkIn;
      existing.checkOut = checkOut || existing.checkOut;
      existing.status = status;
      if (remarks !== undefined) existing.remarks = remarks;
      if (performanceMetrics) existing.performanceMetrics = { ...existing.performanceMetrics, ...performanceMetrics };
      existing.verifiedBy = req.user.id;

      await existing.save();

      res.status(200).json({
        message: 'Attendance updated successfully',
        attendance: existing
      });
    } else {
      // Create new attendance
      const attendance = new StaffAttendance({
        staff: staffId,
        date: dateStart,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        status,
        remarks,
        performanceMetrics,
        verifiedBy: req.user.id
      });

      await attendance.save();

      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get staff performance report
// @route   GET /api/staff/performance
// @access Private (Admin, HR)
const getStaffPerformance = async (req, res) => {
  try {
    const { department, month, year } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.date = { $gte: startDate, $lte: endDate };
    }

    // Build staff filter
    const staffFilter = {};
    if (department) staffFilter.department = department;

    // Get staff with their performance metrics
    const performance = await Staff.aggregate([
      { $match: staffFilter },
      {
        $lookup: {
          from: 'staffattendances',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$staff', '$$staffId'] },
                ...dateFilter
              }
            },
            {
              $group: {
                _id: null,
                totalDays: { $sum: 1 },
                presentDays: {
                  $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
                },
                lateDays: {
                  $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
                },
                totalWorkHours: { $sum: '$workHours' },
                totalOvertimeHours: { $sum: '$overtimeHours' },
                avgEfficiency: { $avg: '$performanceMetrics.efficiency' },
                avgCustomerRating: { $avg: '$performanceMetrics.customerRating' },
                totalTasksCompleted: { $sum: '$performanceMetrics.tasksCompleted' }
              }
            }
          ],
          as: 'attendance'
        }
      },
      {
        $project: {
          fullName: 1,
          employeeId: 1,
          department: 1,
          position: 1,
          attendance: { $arrayElemAt: ['$attendance', 0] }
        }
      }
    ]);

    res.json({ performance });
  } catch (error) {
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
  getStaffAttendance,
  markStaffAttendance,
  getStaffPerformance
};
