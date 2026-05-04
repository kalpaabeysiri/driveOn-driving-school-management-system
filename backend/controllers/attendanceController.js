const Attendance = require('../models/Attendance');
const Session    = require('../models/Session');
const Student    = require('../models/Student');

// ── STUDENT SELF-MARK ATTENDANCE ───────────────────────────────────────────────
// @route POST /api/attendance/self-mark
// Student marks their own attendance (only when session is Ongoing)
const selfMarkAttendance = async (req, res) => {
  try {
    const { sessionId, status } = req.body;
    const studentId = req.user.id;

    if (!sessionId || !status) {
      return res.status(400).json({ message: 'sessionId and status are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Only allow self-mark when session is Ongoing
    if (session.status !== 'Ongoing') {
      return res.status(400).json({ message: 'Can only mark attendance when session is Ongoing' });
    }

    // Check if student is enrolled
    const isEnrolled = session.enrolledStudents.some(id => id.toString() === studentId);
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You are not enrolled in this session' });
    }

    // Check if already marked
    const existing = await Attendance.findOne({ session: sessionId, student: studentId });
    if (existing && existing.confirmed) {
      return res.status(400).json({ message: 'Attendance already confirmed by instructor' });
    }

    const record = await Attendance.findOneAndUpdate(
      { session: sessionId, student: studentId },
      {
        status,
        selfMarked: true,
        markedBy: studentId,
        markedByRole: 'student',
        markedAt: new Date(),
      },
      { upsert: true, new: true }
    ).populate('student', 'firstName lastName');

    res.json({ message: 'Attendance marked successfully', record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── INSTRUCTOR CONFIRM ATTENDANCE ──────────────────────────────────────────────
// @route POST /api/attendance/confirm
// Instructor confirms student attendance for their assigned session
const confirmAttendance = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;
    const instructorId = req.user.id;

    if (!sessionId || !studentId) {
      return res.status(400).json({ message: 'sessionId and studentId are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Check if this instructor is assigned to the session
    if (session.instructor.toString() !== instructorId) {
      return res.status(403).json({ message: 'You are not assigned to this session' });
    }

    const record = await Attendance.findOne({ session: sessionId, student: studentId });
    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (record.confirmed) {
      return res.status(400).json({ message: 'Attendance already confirmed' });
    }

    record.confirmed = true;
    record.confirmedBy = instructorId;
    record.confirmedAt = new Date();
    await record.save();

    res.json({ message: 'Attendance confirmed successfully', record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── MARK ATTENDANCE (Admin) ───────────────────────────────────────────────────
// @route POST /api/attendance
// Mark attendance for multiple students at once for a session
const markAttendance = async (req, res) => {
  try {
    const { sessionId, attendanceList } = req.body;
    // attendanceList = [{ studentId, status, notes }]

    if (!sessionId || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({ message: 'sessionId and attendanceList are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const results = [];
    for (const item of attendanceList) {
      const { studentId, status, notes } = item;
      const record = await Attendance.findOneAndUpdate(
        { session: sessionId, student: studentId },
        { status: status || 'Present', notes, markedBy: req.user.id, markedAt: new Date() },
        { upsert: true, new: true }
      );
      results.push(record);
    }

    res.json({ message: 'Attendance marked successfully', count: results.length, records: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET ATTENDANCE FOR A SESSION (Admin + Instructor) ──────────────────────────────
// @route GET /api/attendance/session/:sessionId
const getSessionAttendance = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('enrolledStudents', 'firstName lastName NIC contactNo email');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // If user is instructor, check if they're assigned to this session
    if (req.user.role === 'instructor') {
      if (session.instructor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this session' });
      }
    }

    const attendanceRecords = await Attendance.find({ session: req.params.sessionId })
      .populate('student', 'firstName lastName NIC contactNo')
      .populate('markedBy', 'name');

    // Build full list including students with no attendance record yet
    const attendanceMap = {};
    attendanceRecords.forEach(r => { attendanceMap[r.student._id.toString()] = r; });

    const fullList = session.enrolledStudents.map(student => ({
      student,
      attendance: attendanceMap[student._id.toString()] || null,
      status:     attendanceMap[student._id.toString()]?.status || 'Not Marked',
    }));

    const summary = {
      total:     fullList.length,
      present:   fullList.filter(r => r.status === 'Present').length,
      absent:    fullList.filter(r => r.status === 'Absent').length,
      late:      fullList.filter(r => r.status === 'Late').length,
      notMarked: fullList.filter(r => r.status === 'Not Marked').length,
    };

    res.json({ session, attendanceList: fullList, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET STUDENT ATTENDANCE HISTORY (Admin + Student) ─────────────────────────
// @route GET /api/attendance/student/:studentId
const getStudentAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.params.studentId })
      .populate({
        path: 'session',
        select: 'sessionType date startTime endTime status instructor',
        populate: { path: 'instructor', select: 'fullName' },
      })
      .sort({ markedAt: -1 });

    const total   = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent  = records.filter(r => r.status === 'Absent').length;
    const late    = records.filter(r => r.status === 'Late').length;
    const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.json({
      records,
      summary: { total, present, absent, late, attendanceRate: rate },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE SINGLE ATTENDANCE RECORD (Admin) ───────────────────────────────────
// @route PUT /api/attendance/:id
const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, notes: req.body.notes, markedBy: req.user.id, markedAt: new Date() },
      { new: true }
    ).populate('student', 'firstName lastName');
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ATTENDANCE ANALYTICS (Admin) ──────────────────────────────────────────────
// @route GET /api/attendance/analytics
const getAnalytics = async (req, res) => {
  try {
    const { sessionType, startDate, endDate } = req.query;

    // Build session filter
    const sessionFilter = {};
    if (sessionType) sessionFilter.sessionType = sessionType;
    if (startDate || endDate) {
      sessionFilter.date = {};
      if (startDate) sessionFilter.date.$gte = new Date(startDate);
      if (endDate)   sessionFilter.date.$lte = new Date(endDate);
    }

    const sessions = await Session.find(sessionFilter).select('_id sessionType date');
    const sessionIds = sessions.map(s => s._id);

    if (sessionIds.length === 0) {
      return res.json({ overall: { total: 0, present: 0, absent: 0, late: 0, rate: 0 }, bySession: [], topStudents: [], lowAttendance: [] });
    }

    // Overall stats
    const overall = await Attendance.aggregate([
      { $match: { session: { $in: sessionIds } } },
      {
        $group: {
          _id:     null,
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent:  { $sum: { $cond: [{ $eq: ['$status', 'Absent']  }, 1, 0] } },
          late:    { $sum: { $cond: [{ $eq: ['$status', 'Late']    }, 1, 0] } },
        },
      },
    ]);

    const overallStats = overall[0] || { total: 0, present: 0, absent: 0, late: 0 };
    overallStats.rate  = overallStats.total > 0
      ? Math.round(((overallStats.present + overallStats.late) / overallStats.total) * 100)
      : 0;

    // Per-student attendance rate
    const byStudent = await Attendance.aggregate([
      { $match: { session: { $in: sessionIds } } },
      {
        $group: {
          _id:     '$student',
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          late:    { $sum: { $cond: [{ $eq: ['$status', 'Late']    }, 1, 0] } },
          absent:  { $sum: { $cond: [{ $eq: ['$status', 'Absent']  }, 1, 0] } },
        },
      },
      {
        $addFields: {
          rate: { $multiply: [{ $divide: [{ $add: ['$present', '$late'] }, '$total'] }, 100] },
        },
      },
      { $sort: { rate: -1 } },
    ]);

    // Populate student names
    const populated = await Student.populate(byStudent, { path: '_id', select: 'firstName lastName NIC' });

    const topStudents = populated.filter(s => s.rate >= 80).slice(0, 5).map(s => ({
      student: s._id, rate: Math.round(s.rate), present: s.present, absent: s.absent, total: s.total,
    }));

    const lowAttendance = populated.filter(s => s.rate < 50).map(s => ({
      student: s._id, rate: Math.round(s.rate), present: s.present, absent: s.absent, total: s.total,
    }));

    res.json({ overall: overallStats, topStudents, lowAttendance, totalSessions: sessions.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PROGRESS & COMPLETION STATUS (Admin) ──────────────────────────────────────
// @route GET /api/attendance/progress/:studentId
const getStudentProgress = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const student = await Student.findById(studentId)
      .select('firstName lastName NIC enrolledCourses bookedSessions')
      .populate('enrolledCourses', 'courseFee discount remainingBalance licenseCategory')
      .populate({
        path: 'bookedSessions',
        select: 'sessionType status date startTime instructor',
        populate: { path: 'instructor', select: 'fullName' },
      });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Attendance stats
    const attendanceRecords = await Attendance.find({ student: studentId });
    const totalSessions   = student.bookedSessions?.length || 0;
    const completedSess   = student.bookedSessions?.filter(s => s.status === 'Completed').length || 0;
    const theorySess      = student.bookedSessions?.filter(s => s.sessionType === 'Theory').length || 0;
    const practicalSess   = student.bookedSessions?.filter(s => s.sessionType === 'Practical').length || 0;
    const presentCount    = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const attendanceRate  = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
    const completionRate  = totalSessions > 0 ? Math.round((completedSess / totalSessions) * 100) : 0;

    // Payment completion
    const totalCourses    = student.enrolledCourses?.length || 0;
    const fullyPaid       = student.enrolledCourses?.filter(c => c.remainingBalance === 0).length || 0;

    res.json({
      student: {
        _id:       student._id,
        firstName: student.firstName,
        lastName:  student.lastName,
        NIC:       student.NIC,
      },
      sessions: {
        total:          totalSessions,
        completed:      completedSess,
        theory:         theorySess,
        practical:      practicalSess,
        completionRate,
      },
      attendance: {
        present:        presentCount,
        total:          attendanceRecords.length,
        attendanceRate,
      },
      payment: {
        totalCourses,
        fullyPaid,
        pendingPayment: totalCourses - fullyPaid,
      },
      enrolledCourses: student.enrolledCourses,
      recentSessions:  student.bookedSessions?.slice(-5).reverse(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE ATTENDANCE (Admin) ─────────────────────────────────────────────────────
// @route DELETE /api/attendance/:id
const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  markAttendance, getSessionAttendance, getStudentAttendance,
  updateAttendance, getAnalytics, getStudentProgress,
  selfMarkAttendance, confirmAttendance, deleteAttendance,
};
