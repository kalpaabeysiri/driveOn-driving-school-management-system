import api from './api';

// ── Session booking (Student) ─────────────────────────────────────────────────
export const getAvailableSessions = ()      => api.get('/sessions/available');
export const getMyBookedSessions  = ()      => api.get('/sessions/my-bookings');
export const bookSession          = (id)    => api.post(`/sessions/${id}/book`);
export const cancelBooking        = (id)    => api.delete(`/sessions/${id}/book`);

// ── Sessions (Admin) ──────────────────────────────────────────────────────────
export const getSessions          = (params)       => api.get('/sessions', { params });
export const getSessionById       = (id)           => api.get(`/sessions/${id}`);
export const getAvailableSessionsAdmin = ()        => api.get('/sessions/available');
export const createSession        = (data)         => api.post('/sessions', data);
export const updateSession        = (id, data)     => api.put(`/sessions/${id}`, data);
export const deleteSession        = (id)           => api.delete(`/sessions/${id}`);
export const enrollStudent        = (id, studentId)=> api.post(`/sessions/${id}/enroll`, { studentId });
export const removeStudentFromSession = (sessionId, studentId) => api.delete(`/sessions/${sessionId}/enroll/${studentId}`);
export const getSessionReport     = (year)         => api.get(`/sessions/report/monthly?year=${year}`);

// ── Feedback ──────────────────────────────────────────────────────────────────
export const submitFeedback       = (data)   => api.post('/feedbacks', data);
export const getAllFeedbacks       = (params) => api.get('/feedbacks', { params });
export const deleteFeedback       = (id)     => api.delete(`/feedbacks/${id}`);
export const getTemplates         = ()       => api.get('/feedbacks/templates');
export const createTemplate       = (data)   => api.post('/feedbacks/templates', data);

// ── Attendance ────────────────────────────────────────────────────────────────
export const markAttendance       = (data)       => api.post('/attendance', data);
export const getSessionAttendance = (sessionId)  => api.get(`/attendance/session/${sessionId}`);
export const getStudentAttendance = (studentId)  => api.get(`/attendance/student/${studentId}`);
export const updateAttendance     = (id, data)   => api.put(`/attendance/${id}`, data);
export const deleteAttendance     = (id)         => api.delete(`/attendance/${id}`);
export const getAnalytics         = (params)     => api.get('/attendance/analytics', { params });
export const getStudentProgress   = (studentId)  => api.get(`/attendance/progress/${studentId}`);
export const selfMarkAttendance  = (data)       => api.post('/attendance/self-mark', data);
export const confirmAttendance    = (data)       => api.post('/attendance/confirm', data);
