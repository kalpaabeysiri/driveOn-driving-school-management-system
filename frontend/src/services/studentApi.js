import api from './api';

// ── Students ──────────────────────────────────────────────────────────────────
export const studentLogin         = (data)         => api.post('/students/login', data);
export const getAllStudents        = (params)        => api.get('/students', { params });
export const getStudentById       = (id)            => api.get(`/students/${id}`);
export const createStudent        = (formData)      => api.post('/students', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateStudent        = (id, formData)  => api.put(`/students/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteStudent        = (id)            => api.delete(`/students/${id}`);
export const updateStudentStatus  = (id, status)    => api.patch(`/students/${id}/status`, { accountStatus: status });
export const toggleReminders      = (id)            => api.patch(`/students/${id}/reminders`);
export const studentBookSession   = (id, sessionId) => api.post(`/students/${id}/book-session`, { sessionId });
export const getMonthlyReport     = (year)          => api.get(`/students/report/monthly?year=${year}`);

// ── License Categories ────────────────────────────────────────────────────────
export const getLicenseCategories   = ()          => api.get('/license-categories');
export const getLicenseCategoryById = (id)        => api.get(`/license-categories/${id}`);
export const createLicenseCategory  = (data)      => api.post('/license-categories', data);
export const updateLicenseCategory  = (id, data)  => api.put(`/license-categories/${id}`, data);
export const deleteLicenseCategory  = (id)        => api.delete(`/license-categories/${id}`);

// ── Vehicle Classes ───────────────────────────────────────────────────────────
export const getVehicleClasses  = (lcId)     => api.get(`/vehicle-classes${lcId ? `?licenseCategory=${lcId}` : ''}`);
export const createVehicleClass = (data)     => api.post('/vehicle-classes', data);
export const updateVehicleClass = (id, data) => api.put(`/vehicle-classes/${id}`, data);
export const deleteVehicleClass = (id)       => api.delete(`/vehicle-classes/${id}`);

// ── Enrollment Courses ────────────────────────────────────────────────────────
export const getEnrollmentCourses    = (studentId) => api.get(`/enrollment/courses${studentId ? `?student=${studentId}` : ''}`);
export const getEnrollmentCourseById = (id)        => api.get(`/enrollment/courses/${id}`);
export const createEnrollmentCourse  = (data)      => api.post('/enrollment/courses', data);
export const updateEnrollmentCourse  = (id, data)  => api.put(`/enrollment/courses/${id}`, data);
export const deleteEnrollmentCourse  = (id)        => api.delete(`/enrollment/courses/${id}`);

// ── Enrollment Payments ───────────────────────────────────────────────────────
export const getEnrollmentPayments   = (studentId) => api.get(`/enrollment/payments${studentId ? `?student=${studentId}` : ''}`);
export const createEnrollmentPayment = (data)      => api.post('/enrollment/payments', data);
export const deleteEnrollmentPayment = (id)        => api.delete(`/enrollment/payments/${id}`);