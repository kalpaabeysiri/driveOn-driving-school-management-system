// ── instructorExamController.js ──────────────────────────────────────────────────────
const TheoryExam = require('../models/TheoryExam');
const PracticalExam = require('../models/PracticalExam');
const mongoose = require('mongoose');

// @desc    Get upcoming exams for instructor
// @route   GET /api/instructor/exams/upcoming
// @access Private (Instructor only)
const getInstructorUpcomingExams = async (req, res) => {
  try {
    const instructorId = req.user._id;
    
    // Get both theory and practical exams
    const [theoryExams, practicalExams] = await Promise.all([
      TheoryExam.find({ 
        date: { $gte: new Date() },
        status: 'Scheduled'
      }).populate('createdBy', 'name email')
        .populate('enrolledStudents', 'firstName lastName email')
        .sort({ date: 1 }),
      
      PracticalExam.find({ 
        date: { $gte: new Date() },
        status: 'Scheduled'
      }).populate('createdBy', 'name email')
        .populate('enrolledStudents', 'firstName lastName email')
        .populate('examiner', 'fullName email')
        .populate('assignedVehicle', 'vehicleNumber')
        .sort({ date: 1 })
    ]);

    // Format exams for instructor view
    const formattedTheoryExams = theoryExams.map(exam => ({
      _id: exam._id,
      examName: exam.examName,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      locationOrHall: exam.locationOrHall,
      language: exam.language,
      status: exam.status,
      maxSeats: exam.maxSeats,
      enrolledStudents: exam.enrolledStudents?.length || 0,
      seatsAvailable: exam.maxSeats - (exam.enrolledStudents?.length || 0),
      type: 'theory'
    }));

    const formattedPracticalExams = practicalExams.map(exam => ({
      _id: exam._id,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      trialLocation: exam.trialLocation,
      vehicleCategory: exam.vehicleCategory,
      status: exam.status,
      maxSeats: exam.maxSeats,
      enrolledStudents: exam.enrolledStudents?.length || 0,
      seatsAvailable: exam.maxSeats - (exam.enrolledStudents?.length || 0),
      type: 'practical',
      examiner: exam.examiner ? {
        _id: exam.examiner._id,
        fullName: exam.examiner.fullName,
        email: exam.examiner.email
      } : null,
      assignedVehicle: exam.assignedVehicle ? {
        _id: exam.assignedVehicle._id,
        vehicleNumber: exam.assignedVehicle.vehicleNumber
      } : null
    }));

    // Combine and sort by date
    const allExams = [...formattedTheoryExams, ...formattedPracticalExams]
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      message: 'Instructor exams retrieved successfully',
      exams: allExams,
      totalExams: allExams.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming exam counts for instructor
// @route   GET /api/instructor/exams/upcoming/counts
// @access Private (Instructor only)
const getInstructorUpcomingExamCounts = async (req, res) => {
  try {
    const instructorId = req.user._id;
    
    // Get both theory and practical exams
    const [theoryExams, practicalExams] = await Promise.all([
      TheoryExam.find({ 
        date: { $gte: new Date() },
        status: 'Scheduled'
      }),
      PracticalExam.find({ 
        date: { $gte: new Date() },
        status: 'Scheduled'
      })
    ]);

    // Calculate counts
    const theoryCount = theoryExams.length;
    const practicalCount = practicalExams.length;
    const totalExams = theoryCount + practicalCount;
    
    // Calculate total assigned students
    const theoryAssignedStudents = theoryExams.reduce((total, exam) => 
      total + (exam.enrolledStudents?.length || 0), 0);
    const practicalAssignedStudents = practicalExams.reduce((total, exam) => 
      total + (exam.enrolledStudents?.length || 0), 0);
    const totalAssignedStudents = theoryAssignedStudents + practicalAssignedStudents;

    const counts = {
      totalExams,
      theoryExams: theoryCount,
      practicalExams: practicalCount,
      totalAssignedStudents,
      theoryAssignedStudents,
      practicalAssignedStudents,
      averageStudentsPerExam: totalExams > 0 ? Math.round(totalAssignedStudents / totalExams, 1) : 0
    };

    res.json({
      message: 'Instructor exam counts retrieved successfully',
      counts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInstructorUpcomingExams,
  getInstructorUpcomingExamCounts
};
