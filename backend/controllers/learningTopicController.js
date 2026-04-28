const LearningTopic = require('../models/LearningTopic');
const LearningLesson = require('../models/LearningLesson');
const LearningQuiz = require('../models/LearningQuiz');
const VideoTutorial = require('../models/VideoTutorial');

// @desc   Create topic (Admin)
// @route  POST /api/learning/topics
const createTopic = async (req, res) => {
  try {
    const { title, description, displayOrder, status } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const order = displayOrder ?? 0;

    // Shift all existing topics at this position or above up by 1
    await LearningTopic.updateMany(
      { displayOrder: { $gte: order } },
      { $inc: { displayOrder: 1 } }
    );

    const topic = await LearningTopic.create({
      title,
      description,
      displayOrder: order,
      status: status ?? 'Active',
      createdBy: req.user.id,
    });

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get topics (Admin/Student)
// @route  GET /api/learning/topics
const getTopics = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const topics = await LearningTopic.find(filter)
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort({ displayOrder: 1, createdDate: -1 });

    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get topic by id
// @route  GET /api/learning/topics/:id
const getTopicById = async (req, res) => {
  try {
    const topic = await LearningTopic.findById(req.params.id)
      .populate('licenseCategory', 'licenseCategoryName')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name');

    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update topic (Admin)
// @route  PUT /api/learning/topics/:id
const updateTopic = async (req, res) => {
  try {
    const topic = await LearningTopic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const allowedFields = ['title', 'description', 'displayOrder', 'status', 'licenseCategory'];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) topic[f] = req.body[f];
    });
    topic.modifiedBy = req.user.id;

    const updated = await topic.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete topic (Admin) - cascades to delete lessons, videos, and quizzes
// @route  DELETE /api/learning/topics/:id
const deleteTopic = async (req, res) => {
  try {
    const topic = await LearningTopic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const deletedOrder = topic.displayOrder;
    const topicId = topic._id;

    // Find all lessons belonging to this topic
    const lessons = await LearningLesson.find({ topic: topicId });
    const lessonIds = lessons.map(lesson => lesson._id);

    // Delete all video tutorials belonging to these lessons
    const deletedVideos = await VideoTutorial.deleteMany({ lesson: { $in: lessonIds } });

    // Delete all quizzes belonging to these lessons
    const deletedQuizzes = await LearningQuiz.deleteMany({ lesson: { $in: lessonIds } });

    // Delete all lessons belonging to this topic
    const deletedLessons = await LearningLesson.deleteMany({ topic: topicId });

    // Delete the topic
    await topic.deleteOne();

    // Shift all topics below the deleted position down by 1
    await LearningTopic.updateMany(
      { displayOrder: { $gt: deletedOrder } },
      { $inc: { displayOrder: -1 } }
    );

    res.json({ 
      message: 'Topic deleted successfully', 
      deletedLessons: deletedLessons.deletedCount,
      deletedVideos: deletedVideos.deletedCount,
      deletedQuizzes: deletedQuizzes.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Fix display order — reassign sequentially (1,2,3…) based on current sort
// @route  POST /api/learning/topics/reorder
const reorderTopics = async (req, res) => {
  try {
    const topics = await LearningTopic.find().sort({ displayOrder: 1, createdAt: 1 });
    const updates = topics.map((topic, index) =>
      LearningTopic.findByIdAndUpdate(topic._id, { displayOrder: index + 1 })
    );
    await Promise.all(updates);
    const reordered = await LearningTopic.find().sort({ displayOrder: 1 });
    res.json({ message: `Reordered ${topics.length} topics`, topics: reordered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete ALL topics (Admin) - cascades to delete all lessons, videos, and quizzes
// @route  DELETE /api/learning/topics/delete-all
const deleteAllTopics = async (req, res) => {
  try {
    const lessons = await LearningLesson.find();
    const lessonIds = lessons.map(l => l._id);

    const deletedVideos = await VideoTutorial.deleteMany({ lesson: { $in: lessonIds } });
    const deletedQuizzes = await LearningQuiz.deleteMany({ lesson: { $in: lessonIds } });
    const deletedLessons = await LearningLesson.deleteMany();
    const deletedTopics = await LearningTopic.deleteMany();

    res.json({
      message: 'All topics deleted successfully',
      deletedTopics: deletedTopics.deletedCount,
      deletedLessons: deletedLessons.deletedCount,
      deletedVideos: deletedVideos.deletedCount,
      deletedQuizzes: deletedQuizzes.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTopic, getTopics, getTopicById, updateTopic, deleteTopic, reorderTopics, deleteAllTopics };
