const ExamResult = require('../models/ExamResult');
const TheoryExam = require('../models/TheoryExam');
const PracticalExam = require('../models/PracticalExam');
const StudentProgress = require('../models/StudentProgress');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// @desc    Create exam result
// @route   POST /api/results
// @access Private (Admin only)
const createExamResult = async (req, res) => {
  try {
    const {
      attemptNumber,
      status,
      examinerRemarks,
      student,
      theoryExam,
      practicalExam
    } = req.body;

    // Validate required fields
    if (!attemptNumber || !status || !student) {
      return res.status(400).json({ message: 'Required fields: attemptNumber, status, student' });
    }

    // Validate exam reference
    if (!theoryExam && !practicalExam) {
      return res.status(400).json({ message: 'Either theoryExam or practicalExam must be specified' });
    }

    if (theoryExam && practicalExam) {
      return res.status(400).json({ message: 'Cannot specify both theoryExam and practicalExam' });
    }

    // Check if student exists
    const studentExists = await Student.findById(student);
    if (!studentExists) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if exam exists
    let exam;
    if (theoryExam) {
      exam = await TheoryExam.findById(theoryExam);
    } else {
      exam = await PracticalExam.findById(practicalExam);
    }

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Create result
    const result = new ExamResult({
      attemptNumber,
      status,
      examinerRemarks,
      student,
      theoryExam,
      practicalExam,
      recordedBy: req.user.id
    });

    const savedResult = await result.save();
    await savedResult.populate([
      { path: 'student', select: 'firstName lastName email' },
      { path: 'theoryExam', select: 'examName date' },
      { path: 'practicalExam', select: 'date vehicleCategory' }
    ]);

    // Update student progress
    await StudentProgress.findOneAndUpdate(
      { student },
      { lastUpdated: new Date() },
      { upsert: true }
    );

    // Trigger progress update
    await updateStudentProgressHandler(student, 'exam_result');

    res.status(201).json(savedResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get results for a student
// @route   GET /api/results/student/:studentId
// @access Private (Admin, Instructor, Student for own profile)
const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Students can only view their own results
    if (req.user.role === 'student' && req.user.studentId.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { examType, page = 1, limit = 20 } = req.query;
    
    const filter = { student: studentId };
    if (examType === 'theory') {
      filter.theoryExam = { $exists: true };
    } else if (examType === 'practical') {
      filter.practicalExam = { $exists: true };
    }

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      ExamResult.find(filter)
        .populate('theoryExam', 'examName date locationOrHall')
        .populate('practicalExam', 'date trialLocation vehicleCategory')
        .populate('recordedBy', 'name email')
        .sort({ recordedDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ExamResult.countDocuments(filter)
    ]);

    // Get summary statistics
    const [theoryStats, practicalStats] = await Promise.all([
      ExamResult.aggregate([
        { $match: { student: mongoose.Types.ObjectId(studentId), theoryExam: { $exists: true } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            latestAttempt: { $max: '$attemptNumber' }
          }
        }
      ]),
      ExamResult.aggregate([
        { $match: { student: mongoose.Types.ObjectId(studentId), practicalExam: { $exists: true } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            latestAttempt: { $max: '$attemptNumber' }
          }
        }
      ])
    ]);

    const summary = {
      theory: {
        totalAttempts: theoryStats.reduce((sum, stat) => sum + stat.count, 0),
        passCount: theoryStats.find(s => s._id === 'Pass')?.count || 0,
        failCount: theoryStats.find(s => s._id === 'Fail')?.count || 0,
        latestAttempt: Math.max(...theoryStats.map(s => s.latestAttempt), 0)
      },
      practical: {
        totalAttempts: practicalStats.reduce((sum, stat) => sum + stat.count, 0),
        passCount: practicalStats.find(s => s._id === 'Pass')?.count || 0,
        failCount: practicalStats.find(s => s._id === 'Fail')?.count || 0,
        latestAttempt: Math.max(...practicalStats.map(s => s.latestAttempt), 0)
      }
    };

    res.json({
      results,
      summary,
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

// @desc    Get results for an exam
// @route   GET /api/results/exam/:examType/:examId
// @access Private (Admin, Instructor)
const getExamResults = async (req, res) => {
  try {
    const { examType, examId } = req.params;
    
    if (!['theory', 'practical'].includes(examType)) {
      return res.status(400).json({ message: 'Invalid exam type' });
    }

    const filter = {};
    if (examType === 'theory') {
      filter.theoryExam = examId;
    } else {
      filter.practicalExam = examId;
    }

    const results = await ExamResult.find(filter)
      .populate('student', 'firstName lastName email contactNo')
      .populate('recordedBy', 'name email')
      .sort({ attemptNumber: 1, recordedDate: -1 });

    // Get exam details
    let exam;
    if (examType === 'theory') {
      exam = await TheoryExam.findById(examId).select('examName date locationOrHall');
    } else {
      exam = await PracticalExam.findById(examId).select('date trialLocation vehicleCategory');
    }

    // Calculate statistics
    const stats = {
      totalResults: results.length,
      passCount: results.filter(r => r.status === 'Pass').length,
      failCount: results.filter(r => r.status === 'Fail').length,
      passRate: results.length > 0 ? Math.round((results.filter(r => r.status === 'Pass').length / results.length) * 100) : 0
    };

    res.json({
      exam,
      results,
      stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get result statistics
// @route   GET /api/results/stats
// @access Private (Admin, Instructor)
const getResultStats = async (req, res) => {
  try {
    const { dateFrom, dateTo, examType } = req.query;
    
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    
    const baseFilter = {};
    if (dateFrom || dateTo) baseFilter.recordedDate = dateFilter;

    // Overall statistics
    const overallStats = await ExamResult.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalResults: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0] }
          },
          failCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Fail'] }, 1, 0] }
          }
        }
      }
    ]);

    // Theory vs Practical breakdown
    const examTypeStats = await ExamResult.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ['$theoryExam', null] },
              'Theory',
              'Practical'
            ]
          },
          totalResults: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0] }
          }
        }
      }
    ]);

    // Monthly trends
    const monthlyTrends = await ExamResult.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$recordedDate' } },
          totalResults: { $sum: 1 },
          passCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const stats = overallStats[0] || { totalResults: 0, passCount: 0, failCount: 0 };
    stats.passRate = stats.totalResults > 0 ? Math.round((stats.passCount / stats.totalResults) * 100) : 0;

    res.json({
      overall: stats,
      byExamType: examTypeStats,
      monthlyTrends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update student progress
const updateStudentProgressHandler = async (studentId) => {
  try {
    const StudentProgress = require('../models/StudentProgress');

    const mapStatus = (raw) => {
      if (raw === 'Pass')   return 'Passed';
      if (raw === 'Fail')   return 'Failed';
      if (raw === 'Passed' || raw === 'Failed') return raw;
      return 'Not Attempted';
    };

    // Get latest results
    const [latestTheoryResult, latestPracticalResult] = await Promise.all([
      ExamResult.findOne({ student: studentId, theoryExam: { $ne: null, $exists: true } })
        .sort({ recordedDate: -1 }),
      ExamResult.findOne({ student: studentId, practicalExam: { $ne: null, $exists: true } })
        .sort({ recordedDate: -1 })
    ]);

    // Count total attempts
    const [theoryAttempts, practicalAttempts] = await Promise.all([
      ExamResult.countDocuments({ student: studentId, theoryExam: { $ne: null, $exists: true } }),
      ExamResult.countDocuments({ student: studentId, practicalExam: { $ne: null, $exists: true } })
    ]);

    // Determine overall status
    let overallStatus = 'In Progress';
    if (latestPracticalResult?.status === 'Pass') {
      overallStatus = 'Completed';
    } else if (latestTheoryResult?.status === 'Pass') {
      overallStatus = 'Theory Passed';
    }

    await StudentProgress.findOneAndUpdate(
      { student: studentId },
      {
        overallStatus,
        lastUpdated: new Date(),
        ...(latestTheoryResult && {
          theoryExamStatus:   mapStatus(latestTheoryResult.status),
          theoryExamAttempts: theoryAttempts,
          lastTheoryExamDate: latestTheoryResult.recordedDate
        }),
        ...(latestPracticalResult && {
          practicalExamStatus:   mapStatus(latestPracticalResult.status),
          practicalExamAttempts: practicalAttempts,
          lastPracticalExamDate: latestPracticalResult.recordedDate
        })
      },
      { upsert: true, runValidators: true }
    );
  } catch (error) {
    console.error('Error updating student progress:', error);
  }
};

module.exports = {
  createExamResult,
  getStudentResults,
  getExamResults,
  getResultStats
};
