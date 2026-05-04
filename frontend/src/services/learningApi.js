import api from './api';

// ── Catalog (Student) ─────────────────────────────────────────────────────────
export const getLearningCatalog = () =>
  api.get('/learning/catalog');

export const upsertLessonProgress = (lessonId, data) =>
  api.post(`/learning/progress/lessons/${lessonId}`, data);

export const startLearningQuizAttempt = (quizId) =>
  api.post(`/learning/quizzes/${quizId}/start`);

export const submitLearningQuizAttempt = (quizId, data) =>
  api.post(`/learning/quizzes/${quizId}/submit`, data);

// ── Student Performance (Student) ─────────────────────────────────────────────
export const getStudentPerformance = () =>
  api.get('/learning/student/performance');

export const getStudentQuizHistory = () =>
  api.get('/learning/student/quiz-history');

export const getStudentLessonProgress = () =>
  api.get('/learning/student/lesson-progress');

// ── Topics (Admin) ────────────────────────────────────────────────────────────
export const getLearningTopics = (params) => api.get('/learning/topics', { params });
export const getLearningTopicById = (id) => api.get(`/learning/topics/${id}`);
export const createLearningTopic = (data) => api.post('/learning/topics', data);
export const updateLearningTopic = (id, data) => api.put(`/learning/topics/${id}`, data);
export const deleteLearningTopic = (id) => api.delete(`/learning/topics/${id}`);
export const reorderLearningTopics = () => api.post('/learning/topics/reorder');
export const deleteAllLearningTopics = () => api.delete('/learning/topics/delete-all');

// ── Lessons (Admin) ───────────────────────────────────────────────────────────
export const getLearningLessons = (params) => api.get('/learning/lessons', { params });
export const getLearningLessonById = (id) => api.get(`/learning/lessons/${id}`);
export const createLearningLesson = (data) => api.post('/learning/lessons', data);
export const updateLearningLesson = (id, data) => api.put(`/learning/lessons/${id}`, data);
export const deleteLearningLesson = (id) => api.delete(`/learning/lessons/${id}`);
export const reorderLearningLessons = (topicId) => api.post('/learning/lessons/reorder', null, { params: topicId ? { topicId } : {} });

export const deleteAllLearningLessons = (topicId) => api.delete(`/learning/lessons/all/${topicId}`);

// ── Videos (Admin) ────────────────────────────────────────────────────────────
export const getVideoTutorials = (params) => api.get('/learning/videos', { params });
export const createVideoTutorial = (data, file) => {
  if (file) {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v));
    });
    form.append('video', file);
    return api.post('/learning/videos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.post('/learning/videos', data);
};
export const updateVideoTutorial = (id, data, file) => {
  if (file) {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, String(v));
    });
    form.append('video', file);
    return api.put(`/learning/videos/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  return api.put(`/learning/videos/${id}`, data);
};
export const deleteVideoTutorial = (id) => api.delete(`/learning/videos/${id}`);
export const deleteAllVideoTutorials = (lessonId) => api.delete(`/learning/videos/all/${lessonId}`);

// ── Quizzes (Admin/Student) ───────────────────────────────────────────────────
export const getLearningQuizzes = (params) => api.get('/learning/quizzes', { params });
export const getLearningQuizById = (id) => api.get(`/learning/quizzes/${id}`);
export const createLearningQuiz = (data) => api.post('/learning/quizzes', data);
export const updateLearningQuiz = (id, data) => api.put(`/learning/quizzes/${id}`, data);
export const deleteLearningQuiz = (id) => api.delete(`/learning/quizzes/${id}`);
export const deleteAllLearningQuizzes = (lessonId) => api.delete(`/learning/quizzes/all/${lessonId}`);
export const deleteAllLearningQuizzesGlobal = () => api.delete('/learning/quizzes/delete-all');

// ── Analytics (Admin) ─────────────────────────────────────────────────────────
export const getLearningQuizAnalytics = (quizId) => api.get(`/learning/analytics/quizzes/${quizId}`);
export const getLearningLessonAnalytics = (lessonId) => api.get(`/learning/analytics/lessons/${lessonId}`);
export const getLearningTopicAnalytics = (topicId) => api.get(`/learning/analytics/topics/${topicId}`);

