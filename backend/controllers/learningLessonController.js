const LearningLesson = require('../models/LearningLesson');

// @desc   Create lesson (Admin)
// @route  POST /api/learning/lessons
const createLesson = async (req, res) => {
  try {
    const {
      title, description, contentType, estimatedDuration,
      displayOrder, status, topic,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const lessonData = {
      title,
      description,
      contentType: contentType ?? 'Mixed',
      estimatedDuration: estimatedDuration ?? 0,
      displayOrder: displayOrder ?? 0,
      status: status ?? 'Draft',
      createdBy: req.user.id,
    };

    // Only add topic if it exists
    if (topic) {
      lessonData.topic = topic;
    }

    const lesson = await LearningLesson.create(lessonData);

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get lessons (Admin/Student)
// @route  GET /api/learning/lessons
const getLessons = async (req, res) => {
  try {
    const { topic, status } = req.query;
    const filter = {};
    if (topic) filter.topic = topic;
    if (status) filter.status = status;

    const lessons = await LearningLesson.find(filter)
      .populate('topic', 'title licenseCategory')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort({ displayOrder: 1, createdDate: -1 });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get lesson by id
// @route  GET /api/learning/lessons/:id
const getLessonById = async (req, res) => {
  try {
    const lesson = await LearningLesson.findById(req.params.id)
      .populate('topic', 'title licenseCategory')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name');

    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update lesson (Admin)
// @route  PUT /api/learning/lessons/:id
const updateLesson = async (req, res) => {
  try {
    const lesson = await LearningLesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const allowedFields = [
      'title', 'description', 'contentType', 'estimatedDuration',
      'displayOrder', 'status', 'topic',
    ];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) lesson[f] = req.body[f];
    });
    lesson.modifiedBy = req.user.id;

    const updated = await lesson.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete lesson (Admin)
// @route  DELETE /api/learning/lessons/:id
const deleteLesson = async (req, res) => {
  try {
    const lesson = await LearningLesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    await lesson.deleteOne();
    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLesson, getLessons, getLessonById, updateLesson, deleteLesson };
