const StudentLessonProgress = require('../models/StudentLessonProgress');
const Student = require('../models/Student');

// @desc   Upsert lesson progress (Student)
// @route  POST /api/learning/progress/lessons/:lessonId
const upsertLessonProgress = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { lessonId } = req.params;
    const { completionStatus, progressPercentage } = req.body;

    const update = {
      lastAccessedAt: new Date(),
    };

    if (completionStatus !== undefined) update.completionStatus = completionStatus;
    if (progressPercentage !== undefined) update.progressPercentage = progressPercentage;

    if (completionStatus === 'Completed') {
      update.progressPercentage = 100;
      update.completedAt = new Date();
    }

    const progress = await StudentLessonProgress.findOneAndUpdate(
      { student: studentId, lesson: lessonId },
      { $set: update, $setOnInsert: { student: studentId, lesson: lessonId } },
      { new: true, upsert: true }
    );

    await Student.findByIdAndUpdate(studentId, { $addToSet: { lessonProgressRecords: progress._id } });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { upsertLessonProgress };
