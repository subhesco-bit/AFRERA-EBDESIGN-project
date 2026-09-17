import axios from 'axios';
import config from '../config/env';

const API_BASE_URL = config.API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    try {
      const storedModes = JSON.parse(localStorage.getItem('afrera.a11y') || '{}');
      const modes = Object.entries({
        ...storedModes,
        sms: storedModes.sms === undefined ? true : storedModes.sms,
      })
        .filter(([, enabled]) => enabled)
        .map(([mode]) => mode);
      requestConfig.headers['X-A11y-Modes'] = modes.length ? modes.join(',') : 'none';
      requestConfig.headers['X-Low-Bandwidth'] = storedModes.sms ? '1' : '0';
    } catch {
      requestConfig.headers['X-A11y-Modes'] = 'none';
      requestConfig.headers['X-Low-Bandwidth'] = '0';
    }
    return requestConfig;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');
        // The real backend refresh endpoint lives at /api/auth/refresh, not
        // under API_BASE_URL (".../api/v1") - see coreApi.js's AUTH_BASE for
        // the same reasoning. It also responds with camelCase
        // accessToken/refreshToken (services/dual-use/authService.js), not
        // snake_case - reading access_token/refresh_token here always
        // produced undefined and silently broke token refresh.
        const authBase = `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/api/auth`;
        const response = await axios.post(`${authBase}/refresh`, {
          refresh_token: refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { api };
