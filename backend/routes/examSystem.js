const express = require('express');
const router = express.Router();

// Import individual route modules
const examRoutes = require('./exams');
const practicalExamRoutes = require('./practicalExams');

// Mount exam routes
router.use('/theory', examRoutes);
router.use('/practical', practicalExamRoutes);

module.exports = router;
