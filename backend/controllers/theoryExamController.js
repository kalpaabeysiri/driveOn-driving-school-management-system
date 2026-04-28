const TheoryExam = require('../models/TheoryExam');
const Student = require('../models/Student');
const StudentProgress = require('../models/StudentProgress');
const ExamResult = require('../models/ExamResult');
const mongoose = require('mongoose');

// @desc    Create new theory exam
// @route   POST /api/exams/theory
// @access Private (Admin only)
const createTheoryExam = async (req, res) => {
  try {
    const {
      examName,
      date,
      startTime,
      endTime,
      locationOrHall,
      language,
      maxSeats,
      sourceType = 'manual',
      sourceNote
    } = req.body;

    // Validation
    if (!examName || !date || !startTime || !endTime || !locationOrHall) {
      return res.status(400).json({ 
        message: 'Missing required fields: examName, date, startTime, endTime, locationOrHall' 
      });
    }

    // Validate date and time
    const examDate = new Date(date);
    const examStartTime = new Date(`${date}T${startTime}`);
    const examEndTime = new Date(`${date}T${endTime}`);

    if (examEndTime <= examStartTime) {
      return res.status(400).json({ 
        message: 'End time must be after start time' 
      });
    }

    if (examDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ 
        message: 'Exam date cannot be in the past' 
      });
    }

    // Validate max seats
    if (maxSeats && (maxSeats < 1 || maxSeats > 10)) {
      return res.status(400).json({ 
        message: 'Maximum seats must be between 1 and 10' 
      });
    }

    // Create exam
    const exam = new TheoryExam({
      examName,
      date: examDate,
      startTime,
      endTime,
      locationOrHall,
      language,
      maxSeats: maxSeats || 10,
      sourceType,
      sourceNote,
      createdBy: req.user.id
    });

    await exam.save();

    res.status(201).json({
      message: 'Theory exam created successfully',
      exam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update theory exam
// @route   PUT /api/exams/theory/:id
// @access Private (Admin only)
const updateTheoryExam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      examName,
      date,
      startTime,
      endTime,
      locationOrHall,
      language,
      maxSeats,
      sourceType,
      sourceNote
    } = req.body;

    // Validation
    if (!examName || !date || !startTime || !endTime || !locationOrHall) {
      return res.status(400).json({ 
        message: 'Missing required fields: examName, date, startTime, endTime, locationOrHall' 
      });
    }

    // Validate date and time
    const examDate = new Date(date);
    const examStartTime = new Date(`${date}T${startTime}`);
    const examEndTime = new Date(`${date}T${endTime}`);

    if (examEndTime <= examStartTime) {
      return res.status(400).json({ 
        message: 'End time must be after start time' 
      });
    }

    // Validate max seats
    if (maxSeats && (maxSeats < 1 || maxSeats > 10)) {
      return res.status(400).json({ 
        message: 'Maximum seats must be between 1 and 10' 
      });
    }

    const exam = await TheoryExam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Theory exam not found' });
    }

    // Update fields
    if (examName) exam.examName = examName;
    if (date) exam.date = examDate;
    if (startTime) exam.startTime = startTime;
    if (endTime) exam.endTime = endTime;
    if (locationOrHall) exam.locationOrHall = locationOrHall;
    if (language) exam.language = language;
    if (maxSeats) exam.maxSeats = maxSeats;
    if (sourceType) exam.sourceType = sourceType;
    if (sourceNote) exam.sourceNote = sourceNote;

    await exam.save();

    res.status(200).json({
      message: 'Theory exam updated successfully',
      exam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete theory exam
// @route   DELETE /api/exams/theory/:id
// @access Private (Admin only)
const deleteTheoryExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await TheoryExam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Theory exam not found' });
    }

    // Check if exam has enrolled students
    if (exam.enrolledStudents && exam.enrolledStudents.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete exam with enrolled students' 
      });
    }

    await TheoryExam.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Theory exam deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all theory exams
// @route   GET /api/exams/theory
// @access Private (Admin, Instructor, Student)
const getTheoryExams = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, language, upcoming } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (language) filter.language = language;
    if (upcoming === 'true') {
      filter.date = { $gte: new Date() };
      filter.status = 'Scheduled';
    }
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const exams = await TheoryExam.find(filter)
      .populate('createdBy', 'name email')
      .populate('enrolledStudents', 'firstName lastName email contactNo')
      .sort({ date: 1, startTime: 1 });

    // Add seat availability info
    const examsWithSeats = exams.map(exam => ({
      ...exam.toObject(),
      seatsUsed: exam.enrolledStudents.length,
      seatsAvailable: exam.maxSeats - exam.enrolledStudents.length,
      isFull: exam.enrolledStudents.length >= exam.maxSeats
    }));

    res.json(examsWithSeats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get theory exam by ID
// @route   GET /api/exams/theory/:id
// @access Private (Admin, Instructor, Student)
const getTheoryExamById = async (req, res) => {
  try {
    const exam = await TheoryExam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('enrolledStudents', 'firstName lastName email contactNo accountStatus')
      .populate('results');

    if (!exam) {
      return res.status(404).json({ message: 'Theory exam not found' });
    }

    // Add seat availability info
    const examWithSeats = {
      ...exam.toObject(),
      seatsUsed: exam.enrolledStudents.length,
      seatsAvailable: exam.maxSeats - exam.enrolledStudents.length,
      isFull: exam.enrolledStudents.length >= exam.maxSeats
    };

    res.json(examWithSeats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assignable students for a theory exam
// @route   GET /api/exams/theory/:id/assignable-students
// @access Private (Admin only)
const getAssignableStudents = async (req, res) => {
  try {
    const exam = await TheoryExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Theory exam not found' });
    }

    // Check if exam is still assignable (compare date only, not time)
    const examDate = new Date(exam.date);
    examDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (exam.status !== 'Scheduled' || examDate < today) {
      return res.status(400).json({ message: 'Exam is not available for assignment' });
    }

    // Check if exam is full
    if (exam.enrolledStudents.length >= exam.maxSeats) {
      return res.status(400).json({ message: 'Exam is already full' });
    }

    const allStudents = await Student.find({ accountStatus: 'Active' })
      .populate('enrolledCourses');

    const assignableStudents = [];
    const nonAssignableStudents = [];

    for (const student of allStudents) {
      const isAlreadyAssigned = exam.enrolledStudents.includes(student._id);
      const seatsRemaining = exam.maxSeats - exam.enrolledStudents.length;
      
      let reasons = [];
      let isAssignable = true;

      if (isAlreadyAssigned) {
        isAssignable = false;
        reasons.push('Already assigned to this exam');
      }

      if (seatsRemaining <= 0) {
        isAssignable = false;
        reasons.push('No seats available');
      }

      // Optional eligibility checks
      const studentProgress = await StudentProgress.findOne({ student: student._id });
      if (studentProgress && studentProgress.theoryExamStatus === 'Passed') {
        isAssignable = false;
        reasons.push('Theory exam already passed');
      }

      const studentData = {
        studentId: student._id,
        fullName: `${student.firstName} ${student.lastName}`,
        email: student.email,
        contactNo: student.contactNo,
        isAssignable,
        reasons,
        alreadyAssigned: isAlreadyAssigned,
        accountStatus: student.accountStatus,
        seatsRemaining
      };

      if (isAssignable) {
        assignableStudents.push(studentData);
      } else {
        nonAssignableStudents.push(studentData);
      }
    }

    res.json({
      assignableStudents,
      nonAssignableStudents,
      seatsRemaining: exam.maxSeats - exam.enrolledStudents.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign student to theory exam
// @route   POST /api/exams/theory/:id/assign-student
// @access Private (Admin only)
const assignStudentToTheoryExam = async (req, res) => {
  try {
    const { studentId } = req.body;
    const exam = await TheoryExam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Theory exam not found' });
    }

    // Validation checks
    if (exam.status !== 'Scheduled') {
      return res.status(400).json({ message: 'Cannot assign to completed or cancelled exam' });
    }

    const examDateAssign = new Date(exam.date);
    examDateAssign.setHours(0, 0, 0, 0);
    const todayAssign = new Date();
    todayAssign.setHours(0, 0, 0, 0);
    if (examDateAssign < todayAssign) {
      return res.status(400).json({ message: 'Cannot assign to past exam' });
    }

    if (exam.enrolledStudents.length >= exam.maxSeats) {
      return res.status(400).json({ message: 'Exam is already full' });
    }

    if (exam.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student already assigned to this exam' });
    }

    // Verify student exists and is active
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.accountStatus !== 'Active') {
      return res.status(400).json({ message: 'Student account is not active' });
    }

    // Use findOneAndUpdate to prevent race conditions
    const updatedExam = await TheoryExam.findOneAndUpdate(
      { 
        _id: req.params.id,
        enrolledStudents: { $nin: [studentId] }
      },
      { 
        $push: { enrolledStudents: studentId },
        $inc: { __v: 1 }
      },
      { new: true }
    ).populate('enrolledStudents', 'firstName lastName email');

    if (!updatedExam) {
      return res.status(400).json({ message: 'Assignment failed. Exam may be full or student already assigned.' });
    }

    // Update student progress
    const progressResult = await StudentProgress.findOneAndUpdate(
      { student: studentId },
      { $set: { overallStatus: 'Assigned for Theory Exam', lastUpdated: new Date() } },
      { upsert: true, new: true }
    );
    console.log('[Progress] upsert result for student', studentId, ':', progressResult?._id, progressResult?.overallStatus);

    res.json({
      message: 'Student assigned successfully',
      exam: updatedExam,
      seatsRemaining: updatedExam.maxSeats - updatedExam.enrolledStudents.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unassign student from theory exam
// @route   POST /api/exams/theory/:id/unassign-student
// @access Private (Admin only)
const unassignStudentFromTheoryExam = async (req, res) => {
  try {
    const { studentId } = req.body;
    const exam = await TheoryExam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Theory exam not found' });
    }

    // Allow unassignment only if exam is today or in the future (date-only comparison)
    const examDate = new Date(exam.date);
    examDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (examDate < today) {
      return res.status(400).json({ message: 'Cannot unassign from past or ongoing exam' });
    }

    if (!exam.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student is not assigned to this exam' });
    }

    // Update exam
    const updatedExam = await TheoryExam.findByIdAndUpdate(
      req.params.id,
      { $pull: { enrolledStudents: studentId } },
      { new: true }
    ).populate('enrolledStudents', 'firstName lastName email');

    // Update student progress
    await StudentProgress.findOneAndUpdate(
      { student: studentId },
      { 
        overallStatus: 'In Progress',
        lastUpdated: new Date()
      }
    );

    res.json({
      message: 'Student unassigned successfully',
      exam: updatedExam,
      seatsRemaining: updatedExam.maxSeats - updatedExam.enrolledStudents.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get upcoming theory exams (for dashboard)
// @route   GET /api/exams/theory/upcoming
// @access Private
const getUpcomingTheoryExams = async (req, res) => {
  try {
    const exams = await TheoryExam.find({
      date: { $gte: new Date() },
      status: 'Scheduled'
    })
    .populate('createdBy', 'name')
    .populate('enrolledStudents', 'firstName lastName')
    .sort({ date: 1, startTime: 1 })
    .limit(10);

    const examsWithStats = exams.map(exam => ({
      ...exam.toObject(),
      seatsUsed: exam.enrolledStudents.length,
      seatsAvailable: exam.maxSeats - exam.enrolledStudents.length,
      utilizationRate: Math.round((exam.enrolledStudents.length / exam.maxSeats) * 100)
    }));

    res.json(examsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTheoryExams,
  getTheoryExamById,
  createTheoryExam,
  updateTheoryExam,
  deleteTheoryExam,
  getUpcomingTheoryExams,
  getAssignableStudents,
  assignStudentToTheoryExam,
  unassignStudentFromTheoryExam
};
