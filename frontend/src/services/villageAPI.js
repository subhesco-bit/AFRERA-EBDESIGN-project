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
  getVillages: (params = {}) => villageClient.get('/backend-modules/M041/getVillages', { params }),
  getVillage: (id) => villageClient.get(`/backend-modules/M041/getVillage/${id}`),
  createVillage: (data) => villageClient.post('/backend-modules/M041/createVillage', data),
  updateVillage: (id, data) => villageClient.put(`/backend-modules/M041/updateVillage/${id}`, data),
  deleteVillage: (id) => villageClient.delete(`/backend-modules/M041/deleteVillage/${id}`),
  addVillageResource: (id, data) => villageClient.post('/backend-modules/M041/addVillageResource', { villageId: id, ...data }),
  getVillageAnalytics: (id) => villageClient.get(`/backend-modules/M041/getVillageAnalytics/${id}`),
};

export default villageAPI;
