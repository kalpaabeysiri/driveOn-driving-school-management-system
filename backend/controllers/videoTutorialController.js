const VideoTutorial = require('../models/VideoTutorial');

// @desc   Create video tutorial (Admin)
// @route  POST /api/learning/videos
// Accepts either JSON { videoUrl } or multipart with file => sets filePath
const createVideoTutorial = async (req, res) => {
  try {
    const {
      title, videoUrl, thumbnailUrl, duration, description, status, lesson,
    } = req.body;

    if (!title || !lesson) {
      return res.status(400).json({ message: 'title and lesson are required' });
    }

    const filePath = req.file ? `/uploads/videos/${req.file.filename}` : undefined;

    const video = await VideoTutorial.create({
      title,
      videoUrl: videoUrl || undefined,
      filePath,
      thumbnailUrl,
      duration: duration ?? 0,
      description,
      status: status ?? 'Active',
      lesson,
      uploadedBy: req.user.id,
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get videos (Admin/Student)
// @route  GET /api/learning/videos?lesson=...
const getVideoTutorials = async (req, res) => {
  try {
    const { lesson, status } = req.query;
    const filter = {};
    if (lesson) filter.lesson = lesson;
    if (status) filter.status = status;

    const videos = await VideoTutorial.find(filter)
      .populate('lesson', 'title status')
      .populate('uploadedBy', 'name')
      .populate('modifiedBy', 'name')
      .sort({ createdDate: -1 });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update video tutorial (Admin)
// @route  PUT /api/learning/videos/:id
const updateVideoTutorial = async (req, res) => {
  try {
    const video = await VideoTutorial.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video tutorial not found' });

    const allowedFields = ['title', 'videoUrl', 'thumbnailUrl', 'duration', 'description', 'status', 'lesson'];
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) video[f] = req.body[f];
    });

    if (req.file) {
      video.filePath = `/uploads/videos/${req.file.filename}`;
    }

    video.modifiedBy = req.user.id;
    const updated = await video.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete video tutorial (Admin)
// @route  DELETE /api/learning/videos/:id
const deleteVideoTutorial = async (req, res) => {
  try {
    const video = await VideoTutorial.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video tutorial not found' });
    await video.deleteOne();
    res.json({ message: 'Video tutorial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete all videos by lesson (Admin)
// @route  DELETE /api/learning/videos/all/:lessonId
const deleteAllVideos = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const result = await VideoTutorial.deleteMany({ lesson: lessonId });
    res.json({ message: 'All videos deleted', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVideoTutorial,
  getVideoTutorials,
  updateVideoTutorial,
  deleteVideoTutorial,
  deleteAllVideos,
};
