const Feedback         = require('../models/Feedback');
const FeedbackTemplate = require('../models/FeedbackTemplate');
const Session          = require('../models/Session');

// ── SUBMIT FEEDBACK ────────────────────────────────────────────────────────────
// @route POST /api/feedbacks
const submitFeedback = async (req, res) => {
  try {
    const { session, student, rating, comment } = req.body;

    if (!session || !student || !rating) {
      return res.status(400).json({ message: 'Session, student and rating are required' });
    }

    const sessionDoc = await Session.findById(session);
    if (!sessionDoc) return res.status(404).json({ message: 'Session not found' });

    if (sessionDoc.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only submit feedback for completed sessions' });
    }

    // Check student was enrolled
    const isEnrolled = sessionDoc.enrolledStudents.some(
      (id) => id.toString() === student.toString()
    );
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You were not enrolled in this session' });
    }

    // Check duplicate
    const existing = await Feedback.findOne({ session, student });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted feedback for this session' });
    }

    const feedback = await Feedback.create({ session, student, rating, comment });

    // Add to session's feedbacks list
    sessionDoc.feedbacks.push(feedback._id);

    // Recalculate average rating
    const allFeedbacks = await Feedback.find({ session });
    const avgRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length;
    sessionDoc.averageRating = parseFloat(avgRating.toFixed(1));
    await sessionDoc.save();

    // Add to student's feedbacks
    const Student = require('../models/Student');
    await Student.findByIdAndUpdate(student, { $push: { feedbacks: feedback._id } });

    const populated = await feedback.populate([
      { path: 'student', select: 'firstName lastName' },
      { path: 'session', select: 'sessionType date startTime' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Feedback already submitted for this session' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ── GET ALL FEEDBACKS ──────────────────────────────────────────────────────────
// @route GET /api/feedbacks
const getAllFeedbacks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.session) filter.session = req.query.session;
    if (req.query.student) filter.student = req.query.student;
    if (req.query.rating)  filter.rating  = parseInt(req.query.rating);

    const feedbacks = await Feedback.find(filter)
      .populate('student', 'firstName lastName email')
      .populate('session', 'sessionType date startTime instructor')
      .sort({ createdDate: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET FEEDBACK BY ID ─────────────────────────────────────────────────────────
// @route GET /api/feedbacks/:id
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('student', 'firstName lastName email')
      .populate({ path: 'session', populate: { path: 'instructor', select: 'fullName' } });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE FEEDBACK ────────────────────────────────────────────────────────────
// @route DELETE /api/feedbacks/:id
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    // Remove from session and recalculate rating
    await Session.findByIdAndUpdate(feedback.session, {
      $pull: { feedbacks: feedback._id },
    });
    const sessionDoc = await Session.findById(feedback.session);
    if (sessionDoc && sessionDoc.feedbacks.length > 0) {
      const remaining = await Feedback.find({
        session: feedback.session,
        _id: { $ne: feedback._id },
      });
      const avg = remaining.length > 0
        ? remaining.reduce((sum, f) => sum + f.rating, 0) / remaining.length
        : 0;
      sessionDoc.averageRating = parseFloat(avg.toFixed(1));
      await sessionDoc.save();
    }

    await feedback.deleteOne();
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── FEEDBACK TEMPLATES ─────────────────────────────────────────────────────────
// @route GET /api/feedbacks/templates
const getTemplates = async (req, res) => {
  try {
    const templates = await FeedbackTemplate.find().sort({ category: 1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/feedbacks/templates
const createTemplate = async (req, res) => {
  try {
    const { comment, category } = req.body;
    if (!comment) return res.status(400).json({ message: 'Comment is required' });
    const template = await FeedbackTemplate.create({ comment, category, createdBy: req.user.id });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/feedbacks/templates/:id
const deleteTemplate = async (req, res) => {
  try {
    const template = await FeedbackTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    await template.deleteOne();
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback, getAllFeedbacks, getFeedbackById, deleteFeedback,
  getTemplates, createTemplate, deleteTemplate,
};
