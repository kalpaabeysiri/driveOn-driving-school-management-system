import api from './api';

// ── Instructors ───────────────────────────────────────────────────────────────
export const instructorLogin      = (data)        => api.post('/instructors/login', data);
export const getAllInstructors    = (params)       => api.get('/instructors', { params });
export const getInstructorById   = (id)           => api.get(`/instructors/${id}`);
export const createInstructor    = (formData)     => api.post('/instructors', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateInstructor    = (id, formData) => api.put(`/instructors/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteInstructor    = (id)           => api.delete(`/instructors/${id}`);
export const assignVehicle       = (id, vehicleId)=> api.post(`/instructors/${id}/assign-vehicle`, { vehicleId });
export const removeVehicle       = (id, vehicleId)=> api.delete(`/instructors/${id}/assign-vehicle/${vehicleId}`);
export const getNotifications    = (id)           => api.get(`/instructors/${id}/notifications`);
export const markNotificationRead= (notifId)      => api.patch(`/instructors/notifications/${notifId}/read`);
export const markAllRead         = (id)           => api.patch(`/instructors/${id}/notifications/read-all`);

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const getAllVehicles       = (params)       => api.get('/vehicles', { params });
export const getVehicleById      = (id)           => api.get(`/vehicles/${id}`);
export const createVehicle       = (formData)     => api.post('/vehicles', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateVehicle       = (id, formData) => api.put(`/vehicles/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteVehicle       = (id)           => api.delete(`/vehicles/${id}`);
export const updateVehicleStatus = (id, data)     => api.patch(`/vehicles/${id}/status`, data);
export const addInsurance        = (id, data)     => api.post(`/vehicles/${id}/insurance`, data);
export const updateInsurance     = (id, data)     => api.put(`/vehicles/${id}/insurance`, data);
export const addVehicleUsage     = (id, data)     => api.post(`/vehicles/${id}/usage`, data);
export const getUsageReport      = (params)       => api.get('/vehicles/report/usage', { params });
export const getExpiryAlerts     = ()             => api.get('/vehicles/alerts/expiry');

// ── Owners ────────────────────────────────────────────────────────────────────
export const getAllOwners  = ()       => api.get('/owners');
export const createOwner  = (data)   => api.post('/owners', data);
export const updateOwner  = (id, data)=> api.put(`/owners/${id}`, data);
export const deleteOwner  = (id)     => api.delete(`/owners/${id}`);
