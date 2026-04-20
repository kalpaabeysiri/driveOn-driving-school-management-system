const LearningTopic = require('../models/LearningTopic');

// @desc   Create topic (Admin)
// @route  POST /api/learning/topics
const createTopic = async (req, res) => {
  try {
    const { title, description, displayOrder, status } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const topic = await LearningTopic.create({
      title,
      description,
      displayOrder: displayOrder ?? 0,
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

// @desc   Delete topic (Admin)
// @route  DELETE /api/learning/topics/:id
const deleteTopic = async (req, res) => {
  try {
    const topic = await LearningTopic.findById(req.params.id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    await topic.deleteOne();
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTopic, getTopics, getTopicById, updateTopic, deleteTopic };
