const Session      = require('../models/Session');
const Instructor   = require('../models/Instructor');
const Vehicle      = require('../models/Vehicle');
const Student      = require('../models/Student');
const Notification = require('../models/Notification');
const Attendance   = require('../models/Attendance');

// ── CREATE SESSION (Admin only) ───────────────────────────────────────────────
const createSession = async (req, res) => {
  try {
    const { sessionType, date, startTime, endTime, maxStudents, instructor, vehicle, notes } = req.body;

    if (!sessionType || !date || !startTime || !endTime || !instructor) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    if (sessionType === 'Practical' && !vehicle) {
      return res.status(400).json({ message: 'Vehicle is required for Practical sessions' });
    }

    const session = await Session.create({
      sessionType, date, startTime, endTime,
      maxStudents: maxStudents || 10,
      instructor, vehicle: vehicle || undefined,
      notes, createdBy: req.user.id,
    });

    // Add to instructor sessions + notify
    await Instructor.findByIdAndUpdate(instructor, { $push: { sessions: session._id } });
    if (vehicle) {
      await Vehicle.findByIdAndUpdate(vehicle, { $push: { sessions: session._id }, usageStatus: 'In Use' });
    }
    const notification = await Notification.create({
      instructor, session: session._id, vehicle: vehicle || undefined,
      type: 'SessionAssigned',
      message: `You have been assigned a new ${sessionType} session on ${new Date(date).toDateString()} at ${startTime}.`,
      status: 'Unread',
    });
    await Instructor.findByIdAndUpdate(instructor, { $push: { notifications: notification._id } });

    const populated = await Session.findById(session._id)
      .populate('instructor', 'fullName contactNumber')
      .populate('vehicle', 'brand model licensePlate');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET ALL SESSIONS ──────────────────────────────────────────────────────────
const getSessions = async (req, res) => {
  try {
    const { sessionType, status, instructor } = req.query;
    const filter = {};
    if (sessionType) filter.sessionType = sessionType;
    if (status)      filter.status      = status;
    if (instructor)  filter.instructor  = instructor;

    const sessions = await Session.find(filter)
      .populate('instructor',       'fullName contactNumber')
      .populate('vehicle',          'brand model licensePlate')
      .populate('enrolledStudents', 'firstName lastName email')
      .populate('createdBy',        'name')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SESSION BY ID ─────────────────────────────────────────────────────────
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('instructor',       'fullName contactNumber email specialization')
      .populate('vehicle',          'brand model licensePlate vehicleType transmission')
      .populate('enrolledStudents', 'firstName lastName email contactNo NIC')
      .populate('createdBy',        'name')
      .populate({ path: 'feedbacks', populate: { path: 'student', select: 'firstName lastName' } });

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE SESSION (Admin only) ───────────────────────────────────────────────
const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const allowedFields = ['sessionType', 'date', 'startTime', 'endTime', 'maxStudents', 'status', 'notes'];
    allowedFields.forEach(f => { if (req.body[f] !== undefined) session[f] = req.body[f]; });

    if (req.body.instructor && req.body.instructor !== session.instructor?.toString()) {
      await Instructor.findByIdAndUpdate(session.instructor, { $pull: { sessions: session._id } });
      const notification = await Notification.create({
        instructor: req.body.instructor, session: session._id, type: 'SessionAssigned',
        message: `You have been assigned a ${session.sessionType} session on ${new Date(session.date).toDateString()} at ${session.startTime}.`,
        status: 'Unread',
      });
      await Instructor.findByIdAndUpdate(req.body.instructor, {
        $push: { sessions: session._id, notifications: notification._id },
      });
      session.instructor = req.body.instructor;
    }

    session.modifiedBy = req.user.id;
    const updated = await session.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE SESSION (Admin only) ───────────────────────────────────────────────
const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.instructor) {
      const notification = await Notification.create({
        instructor: session.instructor, session: session._id, type: 'SessionCancelled',
        message: `A ${session.sessionType} session on ${new Date(session.date).toDateString()} has been cancelled.`,
        status: 'Unread',
      });
      await Instructor.findByIdAndUpdate(session.instructor, {
        $pull: { sessions: session._id }, $push: { notifications: notification._id },
      });
    }
    if (session.vehicle) {
      await Vehicle.findByIdAndUpdate(session.vehicle, {
        $pull: { sessions: session._id }, available: true, usageStatus: 'Active',
      });
    }
    await Student.updateMany({ bookedSessions: session._id }, { $pull: { bookedSessions: session._id } });
    await Attendance.deleteMany({ session: session._id });

    await session.deleteOne();
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── STUDENT SELF-BOOK SESSION ─────────────────────────────────────────────────
// @route POST /api/sessions/:id/book
// Students call this themselves to book a session
const bookSession = async (req, res) => {
  try {
    const studentId = req.user.id; // from JWT token
    const session = await Session.findById(req.params.id)
      .populate('instructor', 'fullName');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.status !== 'Scheduled') {
      return res.status(400).json({ message: 'This session is not available for booking' });
    }
    if ((session.enrolledStudents?.length || 0) >= session.maxStudents) {
      return res.status(400).json({ message: 'Session is fully booked' });
    }
    if (session.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'You have already booked this session' });
    }

    session.enrolledStudents.push(studentId);
    await session.save();

    await Student.findByIdAndUpdate(studentId, { $push: { bookedSessions: session._id } });

    // Create notification for instructor
    const Notification = require('../models/Notification');
    const student = await Student.findById(studentId).select('firstName lastName');
    if (session.instructor) {
      await Notification.create({
        message: `${student.firstName} ${student.lastName} has booked your ${session.sessionType} session`,
        type: 'SessionBooking',
        priority: 'Normal',
        instructor: session.instructor._id,
        status: 'Unread',
        sentVia: 'InApp',
      });
    }

    res.json({
      message: 'Session booked successfully!',
      spotsRemaining: session.maxStudents - session.enrolledStudents.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── STUDENT CANCEL OWN BOOKING ────────────────────────────────────────────────
// @route DELETE /api/sessions/:id/book
const cancelBooking = async (req, res) => {
  try {
    const studentId = req.user.id;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.status === 'Completed' || session.status === 'Ongoing') {
      return res.status(400).json({ message: 'Cannot cancel a session that is ongoing or completed' });
    }

    session.enrolledStudents = session.enrolledStudents.filter(s => s.toString() !== studentId);
    await session.save();

    await Student.findByIdAndUpdate(studentId, { $pull: { bookedSessions: session._id } });
    await Attendance.deleteOne({ session: session._id, student: studentId });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: ENROLL STUDENT ─────────────────────────────────────────────────────
const enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'Cancelled' || session.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot enroll in a cancelled or completed session' });
    }
    if ((session.enrolledStudents?.length || 0) >= session.maxStudents) {
      return res.status(400).json({ message: 'Session is full' });
    }
    if (session.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student already enrolled' });
    }
    session.enrolledStudents.push(studentId);
    await session.save();
    await Student.findByIdAndUpdate(studentId, { $push: { bookedSessions: session._id } });
    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── ADMIN: REMOVE STUDENT ─────────────────────────────────────────────────────
const removeStudent = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.enrolledStudents = session.enrolledStudents.filter(
      s => s.toString() !== req.params.studentId
    );
    await session.save();

    await Student.findByIdAndUpdate(req.params.studentId, { $pull: { bookedSessions: session._id } });
    await Attendance.deleteOne({ session: session._id, student: req.params.studentId });

    res.json({ message: 'Student removed from session' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET AVAILABLE SESSIONS (for students to browse) ───────────────────────────
const getAvailableSessions = async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // compare date only, not time-of-day
    const sessions = await Session.find({ date: { $gte: today }, status: { $in: ['Scheduled', 'Ongoing'] } })
      .populate('instructor', 'fullName specialization')
      .populate('vehicle', 'brand model licensePlate')
      .sort({ date: 1 });

    const available = sessions.filter(s => (s.enrolledStudents?.length || 0) < s.maxStudents);
    res.json(available);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET MY BOOKED SESSIONS (student) ─────────────────────────────────────────
const getMyBookedSessions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const Feedback = require('../models/Feedback');
    
    // Get student's feedbacks to check which sessions have feedback
    const studentFeedbacks = await Feedback.find({ student: studentId }).select('session rating comment');
    const feedbackSessionIds = studentFeedbacks.map(f => f.session.toString());
    const feedbackMap = {};
    studentFeedbacks.forEach(f => {
      feedbackMap[f.session.toString()] = { rating: f.rating, comment: f.comment };
    });

    const sessions = await Session.find({ enrolledStudents: studentId })
      .populate('instructor', 'fullName contactNumber')
      .populate('vehicle',    'brand model licensePlate')
      .sort({ date: -1 });
    
    // Add hasFeedback flag and rating to each session
    const sessionsWithFeedback = sessions.map(session => ({
      ...session.toObject(),
      hasFeedback: feedbackSessionIds.includes(session._id.toString()),
      myFeedback: feedbackMap[session._id.toString()] || null,
    }));
    
    res.json(sessionsWithFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── MONTHLY REPORT ────────────────────────────────────────────────────────────
const monthlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const report = await Session.aggregate([
      {
        $match: {
          createdDate: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id:             { month: { $month: '$date' }, sessionType: '$sessionType' },
          totalSessions:   { $sum: 1 },
          totalStudents:   { $sum: { $size: { $ifNull: ['$enrolledStudents', []] } } },
          completedCount:  { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          cancelledCount:  { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
          avgRating:       { $avg: '$averageRating' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const grouped = {};
    report.forEach(r => {
      const k = r._id.month;
      if (!grouped[k]) {
        grouped[k] = { month: monthNames[k - 1], monthNumber: k, theory: { total: 0, completed: 0, cancelled: 0, students: 0 }, practical: { total: 0, completed: 0, cancelled: 0, students: 0 }, totalSessions: 0, totalStudents: 0, avgRating: 0 };
      }
      const type = r._id.sessionType?.toLowerCase();
      if (type && grouped[k][type]) {
        grouped[k][type].total     = r.totalSessions;
        grouped[k][type].completed = r.completedCount;
        grouped[k][type].cancelled = r.cancelledCount;
        grouped[k][type].students  = r.totalStudents;
      }
      grouped[k].totalSessions += r.totalSessions;
      grouped[k].totalStudents += r.totalStudents;
      grouped[k].avgRating = r.avgRating ? parseFloat(r.avgRating.toFixed(1)) : 0;
    });

    res.json({
      year,
      totalSessionsForYear: Object.values(grouped).reduce((a, b) => a + b.totalSessions, 0),
      totalStudentsForYear: Object.values(grouped).reduce((a, b) => a + b.totalStudents, 0),
      monthlyBreakdown:     Object.values(grouped),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession, getSessions, getSessionById,
  updateSession, deleteSession,
  bookSession, cancelBooking,
  enrollStudent, removeStudent,
  getAvailableSessions, getMyBookedSessions,
  monthlyReport,
};
