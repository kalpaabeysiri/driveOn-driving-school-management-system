const LearningQuizAttempt = require('../models/LearningQuizAttempt');
const LearningQuiz = require('../models/LearningQuiz');
const LearningLesson = require('../models/LearningLesson');
const LearningTopic = require('../models/LearningTopic');

// @desc   Quiz analytics (Admin)
// @route  GET /api/learning/analytics/quizzes/:quizId
const quizAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await LearningQuiz.findById(quizId).select('title passMark totalMarks');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const agg = await LearningQuizAttempt.aggregate([
      { $match: { quiz: quiz._id, submittedAt: { $ne: null } } },
      {
        $group: {
          _id: '$quiz',
          averageScore: { $avg: '$percentage' },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' },
          totalAttempts: { $sum: 1 },
          passCount: { $sum: { $cond: [{ $eq: ['$status', 'Passed'] }, 1, 0] } },
          failCount: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
        },
      },
    ]);

    const row = agg[0] || {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalAttempts: 0,
      passCount: 0,
      failCount: 0,
    };

    res.json({
      quiz: { _id: quiz._id, title: quiz.title, passMark: quiz.passMark, totalMarks: quiz.totalMarks },
      ...row,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Lesson analytics (Admin)
// @route  GET /api/learning/analytics/lessons/:lessonId
const lessonAnalytics = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await LearningLesson.findById(lessonId).select('title');
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const quizzes = await LearningQuiz.find({ lesson: lesson._id }).select('_id');
    const quizIds = quizzes.map((q) => q._id);

    const agg = await LearningQuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds }, submittedAt: { $ne: null } } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$percentage' },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' },
          totalAttempts: { $sum: 1 },
          passCount: { $sum: { $cond: [{ $eq: ['$status', 'Passed'] }, 1, 0] } },
          failCount: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
        },
      },
    ]);

    const row = agg[0] || {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalAttempts: 0,
      passCount: 0,
      failCount: 0,
    };

    res.json({
      lesson: { _id: lesson._id, title: lesson.title },
      ...row,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Topic analytics (Admin)
// @route  GET /api/learning/analytics/topics/:topicId
const topicAnalytics = async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await LearningTopic.findById(topicId).select('title');
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const lessons = await LearningLesson.find({ topic: topic._id }).select('_id');
    const lessonIds = lessons.map((l) => l._id);
    const quizzes = await LearningQuiz.find({ lesson: { $in: lessonIds } }).select('_id');
    const quizIds = quizzes.map((q) => q._id);

    const agg = await LearningQuizAttempt.aggregate([
      { $match: { quiz: { $in: quizIds }, submittedAt: { $ne: null } } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$percentage' },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' },
          totalAttempts: { $sum: 1 },
          passCount: { $sum: { $cond: [{ $eq: ['$status', 'Passed'] }, 1, 0] } },
          failCount: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
        },
      },
    ]);

    const row = agg[0] || {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalAttempts: 0,
      passCount: 0,
      failCount: 0,
    };

    res.json({
      topic: { _id: topic._id, title: topic.title },
      ...row,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { quizAnalytics, lessonAnalytics, topicAnalytics };
