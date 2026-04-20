import api from './api';

// ── Vehicle Classes ───────────────────────────────────────────────────────────
export const getVehicleClasses = (licenseCategoryId) => 
  api.get(`/vehicle-classes${licenseCategoryId ? `?licenseCategory=${licenseCategoryId}` : ''}`);
export const getVehicleClassById = (id) => api.get(`/vehicle-classes/${id}`);
export const createVehicleClass = (data) => api.post('/vehicle-classes', data);
export const updateVehicleClass = (id, data) => api.put(`/vehicle-classes/${id}`, data);
export const deleteVehicleClass = (id) => api.delete(`/vehicle-classes/${id}`);

export default api;
