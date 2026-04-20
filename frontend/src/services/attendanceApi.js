import api from './api';

// ── Attendance Records ─────────────────────────────────────────────────────────
export const getAllAttendance = (params) => api.get('/attendance', { params });
export const getAttendanceById = (id) => api.get(`/attendance/${id}`);
export const createAttendance = (data) => api.post('/attendance', data);
export const updateAttendance = (id, data) => api.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);

// ── Attendance Sessions ───────────────────────────────────────────────────────
export const getAttendanceSessions = (params) => api.get('/attendance/sessions', { params });
export const createAttendanceSession = (data) => api.post('/attendance/sessions', data);
export const getAttendanceSessionById = (id) => api.get(`/attendance/sessions/${id}`);
export const markAttendance = (sessionId, data) => 
  api.post(`/attendance/sessions/${sessionId}/mark`, data);
export const bulkMarkAttendance = (sessionId, data) => 
  api.post(`/attendance/sessions/${sessionId}/bulk-mark`, data);

// ── Attendance Reports ───────────────────────────────────────────────────────
export const getAttendanceReport = (params) => api.get('/attendance/reports', { params });
export const getAttendanceAnalytics = (params) => api.get('/attendance/analytics', { params });
export const exportAttendanceReport = (params) => 
  api.get('/attendance/export', { params, responseType: 'blob' });

export default api;
