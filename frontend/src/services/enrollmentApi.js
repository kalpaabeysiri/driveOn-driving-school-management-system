import api from './api';

// ── Enrollment Courses ────────────────────────────────────────────────────────
export const getEnrollmentCourses = (studentId) => 
  api.get(`/enrollment/courses${studentId ? `?student=${studentId}` : ''}`);
export const getEnrollmentCourseById = (id) => api.get(`/enrollment/courses/${id}`);
export const createEnrollmentCourse = (data) => api.post('/enrollment/courses', data);
export const updateEnrollmentCourse = (id, data) => api.put(`/enrollment/courses/${id}`, data);
export const deleteEnrollmentCourse = (id) => api.delete(`/enrollment/courses/${id}`);

// ── Enrollment Payments ───────────────────────────────────────────────────────
export const getEnrollmentPayments = (studentId) => 
  api.get(`/enrollment/payments${studentId ? `?student=${studentId}` : ''}`);
export const createEnrollmentPayment = (data) => api.post('/enrollment/payments', data);
export const deleteEnrollmentPayment = (id) => api.delete(`/enrollment/payments/${id}`);

export default api;
