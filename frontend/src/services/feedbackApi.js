import api from './api';

// ── Feedback Templates ──────────────────────────────────────────────────────────
export const getFeedbackTemplates = () => api.get('/feedbacks/templates');
export const createFeedbackTemplate = (data) => api.post('/feedbacks/templates', data);
export const deleteFeedbackTemplate = (id) => api.delete(`/feedbacks/templates/${id}`);

// ── Feedback CRUD ───────────────────────────────────────────────────────────────
export const getAllFeedbacks = (params) => api.get('/feedbacks', { params });
export const getFeedbackById = (id) => api.get(`/feedbacks/${id}`);
export const submitFeedback = (data) => api.post('/feedbacks', data);
export const deleteFeedback = (id) => api.delete(`/feedbacks/${id}`);

export default api;
