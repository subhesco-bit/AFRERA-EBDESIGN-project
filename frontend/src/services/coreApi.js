import { api } from './apiClient';
import config from '../config/env';

// apiClient's `api` instance is based at config.API_URL (".../api/v1"), but
// the backend mounts the real auth router unversioned at /api/auth (see
// backend/src/index.js - app.use('/api/auth', authRoutes) - along with the
// large majority of routes; only a handful use /api/v1/*). A relative
// '/auth/login' here would resolve to ".../api/v1/auth/login", which
// doesn't exist. axios ignores baseURL when the request url is itself
// absolute, so auth calls build their own absolute URL against the same
// origin instead.
const AUTH_BASE = `${config.API_URL.replace(/\/api\/v1\/?$/, '')}/api/auth`;

export const authAPI = {
  register: (data) => api.post(`${AUTH_BASE}/register`, data),
  login: (data) => api.post(`${AUTH_BASE}/login`, data),
  logout: (data) => api.post(`${AUTH_BASE}/logout`, data),
  refresh: (data) => api.post(`${AUTH_BASE}/refresh`, data),
  getMe: () => api.get(`${AUTH_BASE}/me`),
  setup2FA: (userId) => api.post(`${AUTH_BASE}/2fa/setup`, { user_id: userId }),
  verify2FA: (userId, code) => api.post(`${AUTH_BASE}/2fa/verify`, { user_id: userId, code }),
  disable2FA: (userId, password) => api.post(`${AUTH_BASE}/2fa/disable`, { user_id: userId, password }),
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
