const StudyMaterial = require('../models/StudyMaterial');
const path = require('path');

const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.webm'].includes(ext)) return 'video';
  if (ext === '.pdf') return 'pdf';
  return 'document';
};

// @desc   Upload study material (Admin)
// @route  POST /api/study-materials
const createStudyMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const { title, description, status, topic, lesson } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const material = await StudyMaterial.create({
      title,
      description,
      fileType: getFileType(req.file.originalname),
      filePath: `/uploads/materials/${req.file.filename}`,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      status: status || 'Active',
      topic: topic || undefined,
      lesson: lesson || undefined,
      uploadedBy: req.user.id,
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get study materials (Admin/Student)
// @route  GET /api/study-materials
const getStudyMaterials = async (req, res) => {
  try {
    const { topic, lesson, fileType, status } = req.query;
    const filter = {};
    if (topic) filter.topic = topic;
    if (lesson) filter.lesson = lesson;
    if (fileType) filter.fileType = fileType;
    if (status) filter.status = status;

    const materials = await StudyMaterial.find(filter)
      .populate('topic', 'title')
      .populate('lesson', 'title')
      .populate('uploadedBy', 'name')
      .sort({ createdDate: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get study material by id
// @route  GET /api/study-materials/:id
const getStudyMaterialById = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id)
      .populate('topic', 'title')
      .populate('lesson', 'title')
      .populate('uploadedBy', 'name');

    if (!material) return res.status(404).json({ message: 'Material not found' });
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update study material (Admin)
// @route  PUT /api/study-materials/:id
const updateStudyMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });

    const allowedFields = ['title', 'description', 'status', 'topic', 'lesson'];
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) material[f] = req.body[f];
    });

    if (req.file) {
      material.filePath = `/uploads/materials/${req.file.filename}`;
      material.originalName = req.file.originalname;
      material.fileSize = req.file.size;
      material.fileType = getFileType(req.file.originalname);
    }

    const updated = await material.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete study material (Admin)
// @route  DELETE /api/study-materials/:id
const deleteStudyMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    await material.deleteOne();
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStudyMaterial,
  getStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
};
