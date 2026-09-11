import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const cloneGapClosureAPI = {
  financeJournal: (payload) => api.post('/clone-gap-closure/finance/journal', payload),
  enqueueEvent: (payload) => api.post('/clone-gap-closure/events', payload),
  verificationEvidence: (payload) => api.post('/clone-gap-closure/verification/evidence', payload),
  canonicalizeMasterData: (payload) => api.post('/clone-gap-closure/master-data/canonicalize', payload),
};

export default cloneGapClosureAPI;
