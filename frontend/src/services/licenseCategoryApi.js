import api from './api';

// ── License Categories ────────────────────────────────────────────────────────
export const getLicenseCategories = () => api.get('/license-categories');
export const getLicenseCategoryById = (id) => api.get(`/license-categories/${id}`);
export const createLicenseCategory = (data) => api.post('/license-categories', data);
export const updateLicenseCategory = (id, data) => api.put(`/license-categories/${id}`, data);
export const deleteLicenseCategory = (id) => api.delete(`/license-categories/${id}`);

export default api;
