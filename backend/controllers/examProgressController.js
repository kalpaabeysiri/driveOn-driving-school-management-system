const StudentProgress = require('../models/StudentProgress');
const Student = require('../models/Student');
const TheoryExam = require('../models/TheoryExam');
const PracticalExam = require('../models/PracticalExam');
const ExamResult = require('../models/ExamResult');
const AttendanceRecord = require('../models/AttendanceRecord');
const mongoose = require('mongoose');

// @desc    Get progress for all students
// @route   GET /api/progress/students
// @access Private (Admin, Instructor)
const getAllStudentProgress = async (req, res) => {
  try {
    const rawCount = await StudentProgress.countDocuments({});
    console.log('[Progress] RAW total in DB (no filter):', rawCount);
    const { status, page = 1, limit = 20, search } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.overallStatus = status;
    
    // Search by student name
    if (search) {
      const students = await Student.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.student = { $in: students.map(s => s._id) };
    }

    const skip = (page - 1) * limit;

    const [progress, total] = await Promise.all([
      StudentProgress.find(filter)
        .populate({
          path: 'student',
          select: 'firstName lastName email contactNo accountStatus'
        })
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      StudentProgress.countDocuments(filter)
    ]);

    console.log('[Progress] total records:', total, '| returned:', progress.length);
    res.json({
      progress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Progress] getAllStudentProgress error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get progress for a specific student
// @route   GET /api/progress/students/:studentId
// @access Private (Admin, Instructor, Student for own profile)
const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Students can only view their own progress
    if (req.user.role === 'student' && req.user.id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const progress = await StudentProgress.findOne({ student: studentId })
      .populate({
        path: 'student',
        select: 'firstName lastName email contactNo address city dateOfBirth accountStatus'
      });

    if (!progress) {
      // Create progress record if it doesn't exist
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const newProgress = new StudentProgress({
        student: studentId,
        overallStatus: 'Not Started'
      });
      await newProgress.save();
      
      return res.json(newProgress);
    }

    // Get exam history
    const [theoryResults, practicalResults] = await Promise.all([
      ExamResult.find({ student: studentId, theoryExam: { $exists: true } })
        .populate('theoryExam', 'examName date locationOrHall')
        .sort({ recordedDate: -1 }),
      ExamResult.find({ student: studentId, practicalExam: { $exists: true } })
        .populate('practicalExam', 'date trialLocation vehicleCategory')
        .sort({ recordedDate: -1 })
    ]);

    // Get attendance summary
    const attendanceSummary = await AttendanceRecord.aggregate([
      { $match: { student: mongoose.Types.ObjectId(studentId) } },
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

    const attendanceStats = {
      theory: attendanceSummary.find(item => item._id === 'Theory') || {
        totalSessions: 0,
        presentSessions: 0,
        totalHours: 0,
        attendanceRate: 0
      },
      practical: attendanceSummary.find(item => item._id === 'Practical') || {
        totalSessions: 0,
        presentSessions: 0,
        totalHours: 0,
        attendanceRate: 0
      }
    };

    // Calculate attendance rates
    attendanceStats.theory.attendanceRate = attendanceStats.theory.totalSessions > 0 
      ? Math.round((attendanceStats.theory.presentSessions / attendanceStats.theory.totalSessions) * 100)
      : 0;
    
    attendanceStats.practical.attendanceRate = attendanceStats.practical.totalSessions > 0 
      ? Math.round((attendanceStats.practical.presentSessions / attendanceStats.practical.totalSessions) * 100)
      : 0;

    res.json({
      progress,
      theoryResults,
      practicalResults,
      attendanceStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student progress (called after exam results, assignments, etc.)
// @route   POST /api/progress/students/:studentId/update
// @access Private (Admin, System)
const updateStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { updateType } = req.body; // 'exam_assignment', 'exam_result', 'attendance'

    const progress = await StudentProgress.findOne({ student: studentId });
    if (!progress) {
      return res.status(404).json({ message: 'Student progress not found' });
    }

    // Get student's latest results to determine status
    const [latestTheoryResult, latestPracticalResult] = await Promise.all([
      ExamResult.findOne({ student: studentId, theoryExam: { $exists: true } })
        .sort({ recordedDate: -1 }),
      ExamResult.findOne({ student: studentId, practicalExam: { $exists: true } })
        .sort({ recordedDate: -1 })
    ]);

    // Get current exam assignments
    const [assignedTheoryExam, assignedPracticalExam] = await Promise.all([
      TheoryExam.findOne({
        enrolledStudents: studentId,
        status: 'Scheduled',
        date: { $gte: new Date() }
      }),
      PracticalExam.findOne({
        enrolledStudents: studentId,
        status: 'Scheduled',
        date: { $gte: new Date() }
      })
    ]);

    // Determine overall status
    let newStatus = progress.overallStatus;

    if (assignedPracticalExam) {
      newStatus = 'Assigned for Practical Exam';
    } else if (latestPracticalResult && latestPracticalResult.status === 'Pass') {
      newStatus = 'Completed';
    } else if (latestTheoryResult && latestTheoryResult.status === 'Pass' && !latestPracticalResult) {
      newStatus = 'Theory Passed';
    } else if (assignedTheoryExam) {
      newStatus = 'Assigned for Theory Exam';
    } else if (latestTheoryResult || latestPracticalResult) {
      newStatus = 'In Progress';
    }

    const mapStatus = (raw) => {
      if (raw === 'Pass')   return 'Passed';
      if (raw === 'Fail')   return 'Failed';
      if (raw === 'Passed' || raw === 'Failed') return raw;
      return 'Not Attempted';
    };

    // Always sync counts — resets stale values when no ExamResult records exist
    const [theoryCount, practicalCount] = await Promise.all([
      ExamResult.countDocuments({ student: studentId, theoryExam: { $ne: null, $exists: true } }),
      ExamResult.countDocuments({ student: studentId, practicalExam: { $ne: null, $exists: true } })
    ]);

    progress.theoryExamAttempts    = theoryCount;
    progress.practicalExamAttempts = practicalCount;

    if (latestTheoryResult) {
      progress.theoryExamStatus   = mapStatus(latestTheoryResult.status);
      progress.lastTheoryExamDate = latestTheoryResult.recordedDate;
    } else {
      progress.theoryExamStatus   = 'Not Attempted';
    }

    if (latestPracticalResult) {
      progress.practicalExamStatus   = mapStatus(latestPracticalResult.status);
      progress.lastPracticalExamDate = latestPracticalResult.recordedDate;
    } else {
      progress.practicalExamStatus   = 'Not Attempted';
    }

    // Update attendance stats
    const attendanceSummary = await AttendanceRecord.aggregate([
      { $match: { student: mongoose.Types.ObjectId(studentId) } },
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

    attendanceSummary.forEach(item => {
      if (item._id === 'Theory') {
        progress.totalTheoryHours = item.totalHours;
        progress.theoryAttendanceRate = item.totalSessions > 0 
          ? Math.round((item.presentSessions / item.totalSessions) * 100)
          : 0;
      } else if (item._id === 'Practical') {
        progress.totalPracticalHours = item.totalHours;
        progress.practicalAttendanceRate = item.totalSessions > 0 
          ? Math.round((item.presentSessions / item.totalSessions) * 100)
          : 0;
      }
    });

    progress.overallStatus = newStatus;
    progress.lastUpdated = new Date();

    await progress.save();

    res.json({
      message: 'Progress updated successfully',
      progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get progress statistics (for dashboard)
// @route   GET /api/progress/stats
// @access Private (Admin, Instructor)
const getProgressStats = async (req, res) => {
  try {
    const stats = await StudentProgress.aggregate([
      {
        $group: {
          _id: '$overallStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Get exam pass rates
    const [theoryPassRate, practicalPassRate] = await Promise.all([
      ExamResult.aggregate([
        { $match: { theoryExam: { $exists: true } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      ExamResult.aggregate([
        { $match: { practicalExam: { $exists: true } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const calculatePassRate = (results) => {
      const pass = results.find(r => r._id === 'Pass')?.count || 0;
      const fail = results.find(r => r._id === 'Fail')?.count || 0;
      const total = pass + fail;
      return total > 0 ? Math.round((pass / total) * 100) : 0;
    };

    res.json({
      statusDistribution: statusCounts,
      theoryPassRate: calculatePassRate(theoryPassRate),
      practicalPassRate: calculatePassRate(practicalPassRate),
      totalStudents: await StudentProgress.countDocuments()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Recalculate progress for ALL students (fixes stale/inconsistent data)
// @route   POST /api/exam-progress/recalculate-all
// @access  Private (Admin only)
const recalculateAllProgress = async (req, res) => {
  try {
    const allProgress = await StudentProgress.find({}).select('student');
    const studentIds  = allProgress.map(p => p.student.toString());

    const mapStatus = (raw) => {
      if (raw === 'Pass')   return 'Passed';
      if (raw === 'Fail')   return 'Failed';
      if (raw === 'Passed' || raw === 'Failed') return raw;
      return 'Not Attempted';
    };

    let updated = 0;
    let failed  = 0;

    for (const studentId of studentIds) {
      try {
        const progress = await StudentProgress.findOne({ student: studentId });
        if (!progress) continue;

        const [latestTheoryResult, latestPracticalResult] = await Promise.all([
          ExamResult.findOne({ student: studentId, theoryExam: { $ne: null, $exists: true } })
            .sort({ recordedDate: -1 }),
          ExamResult.findOne({ student: studentId, practicalExam: { $ne: null, $exists: true } })
            .sort({ recordedDate: -1 })
        ]);

        const [theoryCount, practicalCount] = await Promise.all([
          ExamResult.countDocuments({ student: studentId, theoryExam: { $ne: null, $exists: true } }),
          ExamResult.countDocuments({ student: studentId, practicalExam: { $ne: null, $exists: true } })
        ]);

        const [assignedTheoryExam, assignedPracticalExam] = await Promise.all([
          TheoryExam.findOne({ enrolledStudents: studentId, status: 'Scheduled', date: { $gte: new Date() } }),
          PracticalExam.findOne({ enrolledStudents: studentId, status: 'Scheduled', date: { $gte: new Date() } })
        ]);

        // Recalculate overall status
        let newStatus = progress.overallStatus;
        if (assignedPracticalExam) {
          newStatus = 'Assigned for Practical Exam';
        } else if (latestPracticalResult?.status === 'Pass') {
          newStatus = 'Completed';
        } else if (latestTheoryResult?.status === 'Pass' && !latestPracticalResult) {
          newStatus = 'Theory Passed';
        } else if (assignedTheoryExam) {
          newStatus = 'Assigned for Theory Exam';
        } else if (latestTheoryResult || latestPracticalResult) {
          newStatus = 'In Progress';
        }

        // Always sync — resets stale values when no ExamResult records exist
        progress.theoryExamAttempts    = theoryCount;
        progress.practicalExamAttempts = practicalCount;

        if (latestTheoryResult) {
          progress.theoryExamStatus   = mapStatus(latestTheoryResult.status);
          progress.lastTheoryExamDate = latestTheoryResult.recordedDate;
        } else {
          progress.theoryExamStatus   = 'Not Attempted';
        }

        if (latestPracticalResult) {
          progress.practicalExamStatus   = mapStatus(latestPracticalResult.status);
          progress.lastPracticalExamDate = latestPracticalResult.recordedDate;
        } else {
          progress.practicalExamStatus   = 'Not Attempted';
        }

        progress.overallStatus = newStatus;
        progress.lastUpdated   = new Date();
        await progress.save();
        updated++;
      } catch (err) {
        console.error(`[Recalculate] Failed for student ${studentId}:`, err.message);
        failed++;
      }
    }

    res.json({ message: 'Recalculation complete', updated, failed, total: studentIds.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudentProgress,
  getStudentProgress,
  updateStudentProgress,
  recalculateAllProgress,
  getProgressStats
};
