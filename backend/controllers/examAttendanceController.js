const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');
const Instructor = require('../models/Instructor');
const mongoose = require('mongoose');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access Private (Admin, Instructor)
const getAttendanceRecords = async (req, res) => {
  try {
    const { 
      attendanceType, 
      status, 
      dateFrom, 
      dateTo, 
      studentId, 
      instructorId,
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Build filter
    const filter = {};
    if (attendanceType) filter.attendanceType = attendanceType;
    if (status) filter.status = status;
    if (studentId) filter.student = studentId;
    if (instructorId) filter.verifiedBy = instructorId;
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      AttendanceRecord.find(filter)
        .populate({
          path: 'student',
          select: 'firstName lastName email contactNo'
        })
        .populate({
          path: 'verifiedBy',
          select: 'fullName email'
        })
        .populate('session', 'sessionType date startTime endTime')
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AttendanceRecord.countDocuments(filter)
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

// @desc    Create attendance record
// @route   POST /api/attendance
// @access Private (Admin, Instructor)
const createAttendanceRecord = async (req, res) => {
  try {
    const {
      attendanceType,
      date,
      durationHours,
      status,
      student,
      verifiedBy,
      session,
      remarks
    } = req.body;

    // Validate required fields
    if (!attendanceType || !date || !durationHours || !status || !student || !verifiedBy) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if student exists
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if instructor exists
    const instructorExists = await Instructor.findById(verifiedBy);
    if (!instructorExists) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Check for duplicate attendance (same student, same session)
    if (session) {
      const existingAttendance = await AttendanceRecord.findOne({
        student,
        session
      });

      if (existingAttendance) {
        return res.status(400).json({ message: 'Attendance already recorded for this student and session' });
      }
    }

    const attendance = new AttendanceRecord({
      attendanceType,
      date: new Date(date),
      durationHours,
      status,
      student,
      verifiedBy,
      session,
      remarks
    });

    const savedAttendance = await attendance.save();
    await savedAttendance.populate([
      { path: 'student', select: 'firstName lastName email' },
      { path: 'verifiedBy', select: 'fullName email' },
      { path: 'session', select: 'sessionType date startTime endTime' }
    ]);

    res.status(201).json(savedAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance analytics
// @route   GET /api/attendance/analytics
// @access Private (Admin, Instructor)
const getAttendanceAnalytics = async (req, res) => {
  try {
    const { dateFrom, dateTo, attendanceType, period = 'monthly' } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    
    const baseFilter = {};
    if (dateFrom || dateTo) baseFilter.date = dateFilter;
    if (attendanceType) baseFilter.attendanceType = attendanceType;

    // Overall attendance rates
    const overallStats = await AttendanceRecord.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$attendanceType',
          totalSessions: { $sum: 1 },
          presentSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          totalHours: { $sum: '$durationHours' }
        }
      }
    ]);

    // Calculate attendance rates
    const statsWithRates = overallStats.map(stat => ({
      ...stat,
      attendanceRate: stat.totalSessions > 0 
        ? Math.round((stat.presentSessions / stat.totalSessions) * 100)
        : 0
    }));

    // Student attendance summary
    const studentSummary = await AttendanceRecord.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$student',
          totalSessions: { $sum: 1 },
          presentSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          totalHours: { $sum: '$durationHours' }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: '$_id',
          fullName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
          email: '$student.email',
          totalSessions: 1,
          presentSessions: 1,
          totalHours: 1,
          attendanceRate: {
            $cond: [
              { $gt: ['$totalSessions', 0] },
              { $multiply: [{ $divide: ['$presentSessions', '$totalSessions'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { attendanceRate: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      overallStats: statsWithRates,
      topStudents: studentSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance reports
// @route   GET /api/attendance/reports
// @access Private (Admin)
const getAttendanceReports = async (req, res) => {
  try {
    const { reportType, dateFrom, dateTo, attendanceType } = req.query;
    
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    
    const baseFilter = {};
    if (dateFrom || dateTo) baseFilter.date = dateFilter;
    if (attendanceType) baseFilter.attendanceType = attendanceType;

    let report;

    switch (reportType) {
      case 'summary':
        report = await AttendanceRecord.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: null,
              totalRecords: { $sum: 1 },
              presentRecords: {
                $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
              },
              totalHours: { $sum: '$durationHours' }
            }
          }
        ]);
        break;

      case 'byStudent':
        report = await AttendanceRecord.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$student',
              totalSessions: { $sum: 1 },
              presentSessions: {
                $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
              },
              totalHours: { $sum: '$durationHours' }
            }
          },
          {
            $lookup: {
              from: 'students',
              localField: '_id',
              foreignField: '_id',
              as: 'student'
            }
          },
          { $unwind: '$student' },
          {
            $project: {
              studentId: '$_id',
              fullName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
              email: '$student.email',
              totalSessions: 1,
              presentSessions: 1,
              totalHours: 1,
              attendanceRate: {
                $cond: [
                  { $gt: ['$totalSessions', 0] },
                  { $multiply: [{ $divide: ['$presentSessions', '$totalSessions'] }, 100] },
                  0
                ]
              }
            }
          },
          { $sort: { fullName: 1 } }
        ]);
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      reportType,
      filters: { dateFrom, dateTo, attendanceType },
      data: report,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAttendanceRecords,
  createAttendanceRecord,
  getAttendanceAnalytics,
  getAttendanceReports
};
