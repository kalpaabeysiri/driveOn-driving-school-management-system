import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const DEPLOYED_URL = 'https://driveon-driving-school-management-system-production.up.railway.app';

export const BASE_URL = DEPLOYED_URL;

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (data) =>
  api.post('/auth/register', data);

export const loginUser = (data) =>
  api.post('/auth/login', data);

export const getProfile = () =>
  api.get('/auth/profile');

export const updateProfile = (data) =>
  api.put('/auth/profile', data);

// ── Sessions ──────────────────────────────────────────────────────────────────
export const getSessions = () =>
  api.get('/sessions');

export const getSessionById = (id) =>
  api.get(`/sessions/${id}`);

export const createSession = (data) =>
  api.post('/sessions', data);

export const updateSession = (id, data) =>
  api.put(`/sessions/${id}`, data);

export const deleteSession = (id) =>
  api.delete(`/sessions/${id}`);

// ── Instructors ───────────────────────────────────────────────────────────────
export const getInstructors = () =>
  api.get('/instructors');

export const getInstructorById = (id) =>
  api.get(`/instructors/${id}`);

export const createInstructor = (formData) =>
  api.post('/instructors', formData);

export const updateInstructor = (id, formData) =>
  api.put(`/instructors/${id}`, formData);

export const deleteInstructor = (id) =>
  api.delete(`/instructors/${id}`);

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const getVehicles = () =>
  api.get('/vehicles');

export const getVehicleById = (id) =>
  api.get(`/vehicles/${id}`);

export const createVehicle = (formData) =>
  api.post('/vehicles', formData);

export const updateVehicle = (id, formData) =>
  api.put(`/vehicles/${id}`, formData);

export const deleteVehicle = (id) =>
  api.delete(`/vehicles/${id}`);

// ── Payments ──────────────────────────────────────────────────────────────────

// Get all payments.
// Backend decides:
// - student user sees own payments
// - admin/staff sees all payments
export const getPayments = () =>
  api.get('/payments');

// Get one payment details by ID.
// Used when clicking a payment record.
export const getPaymentById = (id) =>
  api.get(`/payments/${id}`);

// Create payment.
// Admin cash payment sends normal JSON:
// createPayment({ amount: 5000, method: 'Cash', studentId: '...' })
//
// Student bank transfer sends FormData:
// createPayment(formData)
//
// Do not manually set multipart headers here.
// Axios/React Native will handle it.
export const createPayment = (data) =>
  api.post('/payments', data);

// Update payment status/details.
// Used for accepting bank transfer payment:
// updatePayment(id, { status: 'Completed' })
export const updatePayment = (id, data) =>
  api.put(`/payments/${id}`, data);

// Update payment with receipt if needed.
export const updatePaymentWithReceipt = (id, formData) =>
  api.put(`/payments/${id}`, formData);

// Delete payment.
export const deletePayment = (id) =>
  api.delete(`/payments/${id}`);

// ── Quizzes ───────────────────────────────────────────────────────────────────
export const getQuizzes = () =>
  api.get('/quizzes');

export const getQuizById = (id) =>
  api.get(`/quizzes/${id}`);

// ── Progress ──────────────────────────────────────────────────────────────────
export const getProgress = () =>
  api.get('/progress');

export const submitProgress = (data) =>
  api.post('/progress', data);

export const getProgressByQuiz = (quizId) =>
  api.get(`/progress/quiz/${quizId}`);

// ── Staff Management ──────────────────────────────────────────────────────────
export const getStaff = (params) =>
  api.get('/staff', { params });

export const getStaffById = (id) =>
  api.get(`/staff/${id}`);

export const createStaff = (data) =>
  api.post('/staff', data);

export const updateStaff = (id, data) =>
  api.put(`/staff/${id}`, data);

export const deleteStaff = (id) =>
  api.delete(`/staff/${id}`);

export const staffLogin = (data) =>
  api.post('/staff/login', data);

// ── Staff Attendance ─────────────────────────────────────────────────────────
export const getAttendanceMembers = () =>
  api.get('/staff/attendance/members');

export const getStaffAttendance = (params) =>
  api.get('/staff/attendance', { params });

export const markStaffAttendance = (data) =>
  api.post('/staff/attendance', data);

export const getStaffPerformance = (params) =>
  api.get('/staff/performance', { params });

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (params) =>
  api.get('/notifications', { params });

export const sendNotification = (data) =>
  api.post('/notifications', data);

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all');

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`);

export const getNotificationStats = () =>
  api.get('/notifications/stats');

// ── Inquiries ────────────────────────────────────────────────────────────────
export const getInquiries = (params) =>
  api.get('/inquiries', { params });

export const createInquiry = (data) =>
  api.post('/inquiries', data);

export const updateInquiry = (id, data) =>
  api.put(`/inquiries/${id}`, data);

export const deleteInquiry = (id) =>
  api.delete(`/inquiries/${id}`);

export const replyToInquiry = (id, data) =>
  api.put(`/inquiries/${id}/reply`, data);

export const closeInquiry = (id) =>
  api.patch(`/inquiries/${id}/close`);

export const getInquiryStats = () =>
  api.get('/inquiries/stats');

export default api;