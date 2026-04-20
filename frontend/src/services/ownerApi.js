import api from './api';

// ── Owners CRUD ───────────────────────────────────────────────────────────────
export const getAllOwners = (params) => api.get('/owners', { params });
export const getOwnerById = (id) => api.get(`/owners/${id}`);
export const createOwner = (data) => api.post('/owners', data);
export const updateOwner = (id, data) => api.put(`/owners/${id}`, data);
export const deleteOwner = (id) => api.delete(`/owners/${id}`);

// ── Owner Vehicles ───────────────────────────────────────────────────────────
export const getOwnerVehicles = (ownerId) => api.get(`/owners/${ownerId}/vehicles`);
export const addVehicleToOwner = (ownerId, vehicleId) => 
  api.post(`/owners/${ownerId}/vehicles/${vehicleId}`);
export const removeVehicleFromOwner = (ownerId, vehicleId) => 
  api.delete(`/owners/${ownerId}/vehicles/${vehicleId}`);

export default api;
