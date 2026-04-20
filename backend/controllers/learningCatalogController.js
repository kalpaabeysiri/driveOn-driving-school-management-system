const LearningTopic = require('../models/LearningTopic');
const LearningLesson = require('../models/LearningLesson');
const VideoTutorial = require('../models/VideoTutorial');
const LearningQuiz = require('../models/LearningQuiz');

// @desc   Student catalog (Topics -> Lessons -> Videos/Quizzes)
// @route  GET /api/learning/catalog
const getCatalog = async (req, res) => {
  try {
    const topics = await LearningTopic.find({
      status: 'Active',
    }).sort({ displayOrder: 1, createdDate: -1 });

    const topicIds = topics.map((t) => t._id);

    const lessons = await LearningLesson.find({
      topic: { $in: topicIds },
      status: 'Published',
    }).sort({ displayOrder: 1, createdDate: -1 });

    const lessonIds = lessons.map((l) => l._id);

    const [videos, quizzes] = await Promise.all([
      VideoTutorial.find({ lesson: { $in: lessonIds }, status: 'Active' }).sort({ createdDate: -1 }),
      LearningQuiz.find({ lesson: { $in: lessonIds }, status: 'Published' }).sort({ createdDate: -1 }).select('-questions.options.isCorrect'),
    ]);

    const videosByLesson = new Map();
    for (const v of videos) {
      const k = String(v.lesson);
      if (!videosByLesson.has(k)) videosByLesson.set(k, []);
      videosByLesson.get(k).push(v);
    }

    const quizzesByLesson = new Map();
    for (const q of quizzes) {
      const k = String(q.lesson);
      if (!quizzesByLesson.has(k)) quizzesByLesson.set(k, []);
      quizzesByLesson.get(k).push(q);
    }

    const lessonsByTopic = new Map();
    for (const l of lessons) {
      const k = String(l.topic);
      if (!lessonsByTopic.has(k)) lessonsByTopic.set(k, []);
      lessonsByTopic.get(k).push({
        ...l.toObject(),
        videoTutorials: videosByLesson.get(String(l._id)) || [],
        quizzes: quizzesByLesson.get(String(l._id)) || [],
      });
    }

    const response = topics.map((t) => ({
      ...t.toObject(),
      lessons: lessonsByTopic.get(String(t._id)) || [],
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCatalog };
