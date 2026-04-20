import api from './api';

// ── Student Exams ──────────────────────────────────────────────────────
export const getStudentExams = () => api.get('/student-exams/me/exams');
export const getStudentExamById = (id) => api.get(`/student-exams/me/exams/${id}`);
export const getStudentExamStatus = () => api.get('/student-exams/me/exam-status');
