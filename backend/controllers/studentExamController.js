// ── studentExamController.js ──────────────────────────────────────────────────────
const TheoryExam = require('../models/TheoryExam');
const PracticalExam = require('../models/PracticalExam');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// @desc    Get all exams for current student
// @route   GET /api/student/me/exams
// @access Private (Student only)
const getStudentExams = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get both theory and practical exams where student is enrolled
    const [theoryExams, practicalExams] = await Promise.all([
      TheoryExam.find({ 
        enrolledStudents: studentId,
        date: { $gte: new Date() }
      }).populate('createdBy', 'name email')
        .sort({ date: 1 }),
      
      PracticalExam.find({ 
        enrolledStudents: studentId,
        date: { $gte: new Date() }
      }).populate('createdBy', 'name email')
        .sort({ date: 1 })
    ]);

    // Format exam data for student view
    const formattedTheoryExams = theoryExams.map(exam => ({
      _id: exam._id,
      examName: exam.examName,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      locationOrHall: exam.locationOrHall,
      language: exam.language,
      status: exam.status,
      type: 'theory',
      maxSeats: exam.maxSeats,
      seatsUsed: exam.enrolledStudents?.length || 0,
      isAssigned: true
    }));

    const formattedPracticalExams = practicalExams.map(exam => ({
      _id: exam._id,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      trialLocation: exam.trialLocation,
      vehicleCategory: exam.vehicleCategory,
      status: exam.status,
      type: 'practical',
      maxSeats: exam.maxSeats,
      seatsUsed: exam.enrolledStudents?.length || 0,
      isAssigned: true
    }));

    // Combine and sort by date
    const allExams = [...formattedTheoryExams, ...formattedPracticalExams]
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      message: 'Student exams retrieved successfully',
      exams: allExams,
      totalExams: allExams.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get specific exam details for student
// @route   GET /api/student/me/exams/:id
// @access Private (Student only)
const getStudentExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;
    
    // Find exam and verify student is enrolled
    let exam;
    
    // Try theory exam first
    exam = await TheoryExam.findOne({ 
      _id: id,
      enrolledStudents: studentId 
    }).populate('createdBy', 'name email')
      .populate('enrolledStudents', 'firstName lastName email');
    
    // If not found, try practical exam
    if (!exam) {
      exam = await PracticalExam.findOne({ 
        _id: id,
        enrolledStudents: studentId 
      }).populate('createdBy', 'name email')
        .populate('enrolledStudents', 'firstName lastName email');
    }

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found or you are not enrolled' });
    }

    // Format exam details for student view
    const examData = {
      _id: exam._id,
      ...(exam.examName && { examName: exam.examName }),
      ...(exam.locationOrHall && { locationOrHall: exam.locationOrHall }),
      ...(exam.trialLocation && { trialLocation: exam.trialLocation }),
      ...(exam.language && { language: exam.language }),
      ...(exam.vehicleCategory && { vehicleCategory: exam.vehicleCategory }),
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      status: exam.status,
      type: exam.examName ? 'theory' : 'practical',
      maxSeats: exam.maxSeats,
      seatsUsed: exam.enrolledStudents?.length || 0,
      seatsAvailable: exam.maxSeats - (exam.enrolledStudents?.length || 0),
      isAssigned: true,
      createdBy: exam.createdBy,
      enrolledStudents: exam.enrolledStudents
    };

    res.json({
      message: 'Exam details retrieved successfully',
      exam: examData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exam status for student
// @route   GET /api/student/me/exam-status
// @access Private (Student only)
const getStudentExamStatus = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get student's progress
    const student = await Student.findById(studentId).populate('progress');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get current exam assignments
    const [theoryExams, practicalExams] = await Promise.all([
      TheoryExam.find({ enrolledStudents: studentId }),
      PracticalExam.find({ enrolledStudents: studentId })
    ]);

    // Calculate exam status
    const totalAssignedExams = theoryExams.length + practicalExams.length;
    const upcomingExams = [
      ...theoryExams.filter(exam => exam.status === 'Scheduled' && exam.date > new Date()),
      ...practicalExams.filter(exam => exam.status === 'Scheduled' && exam.date > new Date())
    ];

    const status = {
      totalAssignedExams,
      upcomingExams: upcomingExams.length,
      hasUpcomingExams: upcomingExams.length > 0,
      nextExam: upcomingExams.length > 0 ? {
        date: upcomingExams.sort((a, b) => new Date(a.date) - new Date(b.date))[0].date,
        type: upcomingExams.sort((a, b) => new Date(a.date) - new Date(b.date))[0].examName ? 'theory' : 'practical'
      } : null,
      progressStatus: student.progress?.overallStatus || 'Not Started'
    };

    res.json({
      message: 'Student exam status retrieved successfully',
      status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentExams,
  getStudentExamById,
  getStudentExamStatus
};
