const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/sessions',    require('./routes/sessions'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/instructor-exams', require('./routes/instructorExams'));
app.use('/api/vehicles',    require('./routes/vehicles'));
app.use('/api/payments',    require('./routes/payments'));
app.use('/api/quizzes',     require('./routes/quizzes'));
app.use('/api/learning',    require('./routes/learning'));
app.use('/api/students',           require('./routes/students'));
app.use('/api/license-categories', require('./routes/licenseCategories'));
app.use('/api/vehicle-classes',    require('./routes/vehicleClasses'));
app.use('/api/enrollment',         require('./routes/enrollment'));
app.use('/api/owners',    require('./routes/owners'));
app.use('/api/feedbacks', require('./routes/feedbacks'));
app.use('/api/staff',              require('./routes/staff'));
app.use('/api/notifications',      require('./routes/notifications'));
app.use('/api/inquiries',          require('./routes/inquiries'));

// Exam System Routes
app.use('/api/exams', require('./routes/examSystem'));
app.use('/api/exam-progress', require('./routes/examProgress'));
app.use('/api/exam-attendance', require('./routes/examAttendance'));
app.use('/api/exam-results', require('./routes/examResults'));
app.use('/api/student-exams', require('./routes/studentExams'));
app.use('/api/attendance', require('./routes/attendance'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'DriveOn API is running', status: 'OK' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 7070;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://192.168.1.72:${PORT}`);
});
