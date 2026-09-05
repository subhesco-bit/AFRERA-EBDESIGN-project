import { api } from './apiClient';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: (data) => api.post('/auth/refresh', data),
  getMe: () => api.get('/auth/me'),
  setup2FA: (userId) => api.post('/auth/2fa/setup', { user_id: userId }),
  verify2FA: (userId, code) => api.post('/auth/2fa/verify', { user_id: userId, code }),
  disable2FA: (userId, password) => api.post('/auth/2fa/disable', { user_id: userId, password }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/addresses', data),
};

export const mfaAPI = {
  setup: () => api.post('/mfa/setup'),
  verify: (userId, token) => api.post('/mfa/verify', { userId, token }),
  disable: () => api.post('/mfa/disable'),
};

export const privacyAPI = {
  recordConsent: (consentType, consentGiven) => api.post('/privacy/consent', { consentType, consentGiven }),
  getConsent: (userId) => api.get(`/privacy/consent/${userId}`),
  requestDeletion: (reason) => api.post('/privacy/rtbf', { reason }),
};

export const libraryAPI = {
  initialize: (options = {}) => api.post('/library/initialize', options),
  getStatistics: () => api.get('/library/statistics'),
  verifyCatalog: () => api.get('/library/verify'),
  search: (params = {}) => api.get('/library/search', { params }),
  getModules: (params = {}) => api.get('/library/modules', { params }),
  getModule: (moduleId) => api.get(`/library/modules/${encodeURIComponent(moduleId)}`),
  buildAIContext: (data) => api.post('/library/ai-context', data),
};
