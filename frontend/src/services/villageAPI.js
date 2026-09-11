import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const villageClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

villageClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const villageAPI = {
  getVillages: (params = {}) => villageClient.get('/backend-modules/M041/villages', { params }),
  getVillage: (id) => villageClient.get(`/backend-modules/M041/villages/${id}`),
  createVillage: (data) => villageClient.post('/backend-modules/M041/villages', data),
  updateVillage: (id, data) => villageClient.put(`/backend-modules/M041/villages/${id}`, data),
  deleteVillage: (id) => villageClient.delete(`/backend-modules/M041/villages/${id}`),
  addVillageResource: (id, data) => villageClient.post(`/backend-modules/M041/villages/${id}/resources`, data),
  getVillageAnalytics: (id) => villageClient.get(`/backend-modules/M041/villages/${id}/analytics`),
};

export default villageAPI;
