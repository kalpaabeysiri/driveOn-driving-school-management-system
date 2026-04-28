const PracticalExam = require('../models/PracticalExam');
const Student = require('../models/Student');
const StudentProgress = require('../models/StudentProgress');
const ExamResult = require('../models/ExamResult');
const mongoose = require('mongoose');

// @desc    Get all practical exams
// @route   GET /api/exams/practical
// @access Private (Admin, Instructor, Student)
const getPracticalExams = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, vehicleCategory, upcoming } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (vehicleCategory) filter.vehicleCategory = vehicleCategory;
    if (upcoming === 'true') {
      filter.date = { $gte: new Date() };
      filter.status = 'Scheduled';
    }
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const exams = await PracticalExam.find(filter)
      .populate('createdBy', 'name email')
      .populate('examiner', 'fullName email')
      .populate('assignedVehicle', 'licensePlate brand model')
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

// @desc    Get practical exam by ID
// @route   GET /api/exams/practical/:id
// @access Private (Admin, Instructor, Student)
const getPracticalExamById = async (req, res) => {
  try {
    const exam = await PracticalExam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('examiner', 'fullName email')
      .populate('assignedVehicle', 'licensePlate brand model vehicleType')
      .populate('enrolledStudents', 'firstName lastName email contactNo accountStatus')
      .populate('results');

    if (!exam) {
      return res.status(404).json({ message: 'Practical exam not found' });
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

// @desc    Get assignable students for a practical exam
// @route   GET /api/exams/practical/:id/assignable-students
// @access Private (Admin only)
const getAssignableStudents = async (req, res) => {
  try {
    const exam = await PracticalExam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Practical exam not found' });
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

      // Check if student has passed theory exam (prerequisite)
      const studentProgress = await StudentProgress.findOne({ student: student._id });
      if (!studentProgress || studentProgress.theoryExamStatus !== 'Passed') {
        isAssignable = false;
        reasons.push('Theory exam not passed yet');
      }

      if (studentProgress && studentProgress.practicalExamStatus === 'Passed') {
        isAssignable = false;
        reasons.push('Practical exam already passed');
      }

      // Check vehicle category match
      const studentCourses = student.enrolledCourses || [];
      const hasMatchingCategory = studentCourses.some(course => 
        course.licenseCategory && course.licenseCategory.licenseCategoryName === exam.vehicleCategory
      );
      
      if (!hasMatchingCategory) {
        isAssignable = false;
        reasons.push(`Vehicle category mismatch. Student needs ${exam.vehicleCategory} category`);
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
        seatsRemaining,
        theoryPassed: studentProgress?.theoryExamStatus === 'Passed',
        matchingCategory: hasMatchingCategory
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
      seatsRemaining: exam.maxSeats - exam.enrolledStudents.length,
      vehicleCategory: exam.vehicleCategory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign student to practical exam
// @route   POST /api/exams/practical/:id/assign-student
// @access Private (Admin only)
const assignStudentToPracticalExam = async (req, res) => {
  try {
    const { studentId } = req.body;
    const exam = await PracticalExam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Practical exam not found' });
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

    // Check if student has passed theory exam
    const studentProgress = await StudentProgress.findOne({ student: studentId });
    if (!studentProgress || studentProgress.theoryExamStatus !== 'Passed') {
      return res.status(400).json({ message: 'Student must pass theory exam first' });
    }

    // Use findOneAndUpdate to prevent race conditions
    const updatedExam = await PracticalExam.findOneAndUpdate(
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
    await StudentProgress.findOneAndUpdate(
      { student: studentId },
      { $set: { overallStatus: 'Assigned for Practical Exam', lastUpdated: new Date() } },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Student assigned successfully',
      exam: updatedExam,
      seatsRemaining: updatedExam.maxSeats - updatedExam.enrolledStudents.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unassign student from practical exam
// @route   POST /api/exams/practical/:id/unassign-student
// @access Private (Admin only)
const unassignStudentFromPracticalExam = async (req, res) => {
  try {
    const { studentId } = req.body;
    const exam = await PracticalExam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Practical exam not found' });
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
    const updatedExam = await PracticalExam.findByIdAndUpdate(
      req.params.id,
      { $pull: { enrolledStudents: studentId } },
      { new: true }
    ).populate('enrolledStudents', 'firstName lastName email');

    // Update student progress
    await StudentProgress.findOneAndUpdate(
      { student: studentId },
      { 
        overallStatus: 'Theory Passed',
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

// @desc    Get upcoming practical exams (for dashboard)
// @route   GET /api/exams/practical/upcoming
// @access Private
const getUpcomingPracticalExams = async (req, res) => {
  try {
    const exams = await PracticalExam.find({
      date: { $gte: new Date() },
      status: 'Scheduled'
    })
    .populate('createdBy', 'name')
    .populate('examiner', 'fullName')
    .populate('assignedVehicle', 'licensePlate brand')
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

// @desc    Create new practical exam
// @route   POST /api/exams/practical
// @access Private (Admin only)
const createPracticalExam = async (req, res) => {
  try {
    const {
      date,
      startTime,
      endTime,
      trialLocation,
      vehicleCategory,
      maxSeats,
      sourceType = 'manual',
      sourceNote,
      examiner,
      assignedVehicle
    } = req.body;

    // Validation
    if (!date || !startTime || !endTime || !trialLocation || !vehicleCategory) {
      return res.status(400).json({ 
        message: 'Missing required fields: date, startTime, endTime, trialLocation, vehicleCategory' 
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
    const exam = new PracticalExam({
      date: examDate,
      startTime,
      endTime,
      trialLocation,
      vehicleCategory,
      maxSeats: maxSeats || 10,
      sourceType,
      sourceNote,
      examiner,
      assignedVehicle,
      createdBy: req.user.id
    });

    await exam.save();

    res.status(201).json({
      message: 'Practical exam created successfully',
      exam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update practical exam
// @route   PUT /api/exams/practical/:id
// @access Private (Admin only)
const updatePracticalExam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      startTime,
      endTime,
      trialLocation,
      vehicleCategory,
      maxSeats,
      sourceType,
      sourceNote,
      examiner,
      assignedVehicle
    } = req.body;

    // Validation
    if (!date || !startTime || !endTime || !trialLocation || !vehicleCategory) {
      return res.status(400).json({ 
        message: 'Missing required fields: date, startTime, endTime, trialLocation, vehicleCategory' 
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

    const exam = await PracticalExam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Practical exam not found' });
    }

    // Update fields
    if (date) exam.date = examDate;
    if (startTime) exam.startTime = startTime;
    if (endTime) exam.endTime = endTime;
    if (trialLocation) exam.trialLocation = trialLocation;
    if (vehicleCategory) exam.vehicleCategory = vehicleCategory;
    if (maxSeats) exam.maxSeats = maxSeats;
    if (sourceType) exam.sourceType = sourceType;
    if (sourceNote) exam.sourceNote = sourceNote;
    if (examiner) exam.examiner = examiner;
    if (assignedVehicle) exam.assignedVehicle = assignedVehicle;

    await exam.save();

    res.status(200).json({
      message: 'Practical exam updated successfully',
      exam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete practical exam
// @route   DELETE /api/exams/practical/:id
// @access Private (Admin only)
const deletePracticalExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await PracticalExam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Practical exam not found' });
    }

    // Check if exam has enrolled students
    if (exam.enrolledStudents && exam.enrolledStudents.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete exam with enrolled students' 
      });
    }

    await PracticalExam.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Practical exam deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Import/seed practical exams (restricted endpoint)
// @route   POST /api/exams/practical/import
// @access Private (Admin only - for seeding/importing)
const importPracticalExams = async (req, res) => {
  try {
    const { exams } = req.body;
    
    if (!Array.isArray(exams) || exams.length === 0) {
      return res.status(400).json({ message: 'Invalid exam data' });
    }

    const createdExams = [];
    const errors = [];

    for (const examData of exams) {
      try {
        // Set default values for imported exams
        const exam = new PracticalExam({
          ...examData,
          sourceType: 'imported',
          importedAt: new Date(),
          createdBy: req.user.id
        });

        await exam.save();
        createdExams.push(exam);
      } catch (error) {
        errors.push({ exam: `${examData.date} ${examData.vehicleCategory}`, error: error.message });
      }
    }

    res.status(201).json({
      message: `Imported ${createdExams.length} exams successfully`,
      createdExams,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPracticalExams,
  getPracticalExamById,
  createPracticalExam,
  updatePracticalExam,
  deletePracticalExam,
  getUpcomingPracticalExams,
  getAssignableStudents,
  assignStudentToPracticalExam,
  unassignStudentFromPracticalExam
};
