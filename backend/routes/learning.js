const express = require('express');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/auth');
const videoUpload = require('../middleware/videoUpload');

const {
  createTopic, getTopics, getTopicById, updateTopic, deleteTopic,
} = require('../controllers/learningTopicController');

const {
  createLesson, getLessons, getLessonById, updateLesson, deleteLesson,
} = require('../controllers/learningLessonController');

const {
  createVideoTutorial, getVideoTutorials, updateVideoTutorial, deleteVideoTutorial,
} = require('../controllers/videoTutorialController');

const {
  createQuiz, getQuizzes, getQuizById, updateQuiz, deleteQuiz,
} = require('../controllers/learningQuizController');

const { startAttempt, submitAttempt } = require('../controllers/learningQuizAttemptController');
const { upsertLessonProgress } = require('../controllers/studentLessonProgressController');
const { getCatalog } = require('../controllers/learningCatalogController');
const { quizAnalytics, lessonAnalytics, topicAnalytics } = require('../controllers/learningAnalyticsController');
const { getStudentPerformance, getStudentQuizHistory, getStudentLessonProgress } = require('../controllers/studentPerformanceController');

// Student catalog/progress/attempts
router.get('/catalog', protect, getCatalog);
router.post('/progress/lessons/:lessonId', protect, upsertLessonProgress);
router.post('/quizzes/:quizId/start', protect, startAttempt);
router.post('/quizzes/:quizId/submit', protect, submitAttempt);

// Student performance endpoints
router.get('/student/performance', protect, getStudentPerformance);
router.get('/student/quiz-history', protect, getStudentQuizHistory);
router.get('/student/lesson-progress', protect, getStudentLessonProgress);

// Topics
router.route('/topics')
  .get(protect, getTopics)
  .post(protect, adminOnly, createTopic);
router.route('/topics/:id')
  .get(protect, getTopicById)
  .put(protect, adminOnly, updateTopic)
  .delete(protect, adminOnly, deleteTopic);

// Lessons
router.route('/lessons')
  .get(protect, getLessons)
  .post(protect, adminOnly, createLesson);
router.route('/lessons/:id')
  .get(protect, getLessonById)
  .put(protect, adminOnly, updateLesson)
  .delete(protect, adminOnly, deleteLesson);

// Videos
router.route('/videos')
  .get(protect, getVideoTutorials)
  .post(protect, adminOnly, videoUpload.single('video'), createVideoTutorial);
router.route('/videos/:id')
  .put(protect, adminOnly, videoUpload.single('video'), updateVideoTutorial)
  .delete(protect, adminOnly, deleteVideoTutorial);

// Quizzes
router.route('/quizzes')
  .get(protect, getQuizzes)
  .post(protect, adminOnly, createQuiz);
router.route('/quizzes/:id')
  .get(protect, getQuizById)
  .put(protect, adminOnly, updateQuiz)
  .delete(protect, adminOnly, deleteQuiz);

// Analytics (Admin)
router.get('/analytics/quizzes/:quizId', protect, adminOnly, quizAnalytics);
router.get('/analytics/lessons/:lessonId', protect, adminOnly, lessonAnalytics);
router.get('/analytics/topics/:topicId', protect, adminOnly, topicAnalytics);

module.exports = router;
