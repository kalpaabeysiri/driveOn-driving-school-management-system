import api from './api';

// ── Instructor Exams ──────────────────────────────────────────────
export const getInstructorUpcomingExams = () => api.get('/instructor-exams/exams/upcoming');
export const getInstructorUpcomingExamCounts = () => api.get('/instructor-exams/exams/upcoming/counts');
