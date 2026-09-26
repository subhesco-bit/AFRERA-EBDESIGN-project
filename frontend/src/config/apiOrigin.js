/**
 * Single API origin resolver.
 * Canonical HTTP prefix: /api/v1
 * Dev proxy: Vite /api -> http://localhost:3001
 * Prod proxy: nginx /api/ -> backend:3001
 */
export function resolveApiBaseUrl(env = import.meta.env) {
  const raw = String(env.VITE_API_URL || env.VITE_API_BASE_URL || '/api/v1').trim();

  if (raw.startsWith('/')) {
    if (raw.includes('/api/v1')) return raw.replace(/\/$/, '');
    if (raw === '/api' || raw === '/api/') return '/api/v1';
    return `${raw.replace(/\/$/, '')}/api/v1`;
  }

  try {
    const url = new URL(raw);
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/api/v1';
    } else if (!url.pathname.includes('/api')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}/api/v1`;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return '/api/v1';
  }
}

export function resolveWsUrl(env = import.meta.env, apiBase = resolveApiBaseUrl(env)) {
  const explicit = String(env.VITE_WS_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  if (apiBase.startsWith('/')) return '';
  try {
    const url = new URL(apiBase);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.origin;
  } catch {
    return '';
  }
}

export function readAccessToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('token');
}

export function writeAccessToken(accessToken, refreshToken) {
  if (typeof localStorage === 'undefined') return;
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('token', accessToken);
  }
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
}

export function clearSession() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
