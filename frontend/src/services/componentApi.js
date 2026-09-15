// Component-facing adapter. API ownership remains in services/api.js.
import api from './api';
import config from '../config/env';

export { default } from './api';
export * from './api';

// api's baseURL is config.API_URL (".../api/v1"), but the real backend
// mounts this router unversioned at /api/multilingual (see
// backend/src/index.js), same as most non-/api/v1 routes - matches the
// AUTH_BASE pattern already established in coreApi.js.
const MULTILINGUAL_BASE = `${config.API_URL.replace(/\/api\/v1\/?$/, '')}/api/multilingual`;

// 2026-09-15: every method here used to reference an undefined `api`
// (never imported in this file - a guaranteed ReferenceError the moment
// any of them ran) and called endpoints (/i18n/:lang) that don't exist
// on the backend under any mount. components/Multilingual/MultilingualProvider.jsx
// actually calls getLanguages/getPreferences/getContent/updatePreferences/
// translate/detect - none of which existed here. Rewritten against the
// real, previously-unmounted services/legacy/multilingualService.js router
// (now mounted at /api/multilingual in index.js), matching its real
// endpoints and request/response shapes exactly.
export const multilingualAPI = {
  getLanguages: () => api.get(`${MULTILINGUAL_BASE}/languages`),
  getPreferences: () => api.get(`${MULTILINGUAL_BASE}/preferences`),
  getContent: (languageCode) => api.get(`${MULTILINGUAL_BASE}/content`, { params: { language: languageCode } }),
  updatePreferences: (data) => api.put(`${MULTILINGUAL_BASE}/preferences`, data),
  translate: (data) => api.post(`${MULTILINGUAL_BASE}/translate`, data),
  detect: (text) => api.post(`${MULTILINGUAL_BASE}/detect`, { text }),
};

// conversationalAIAPI/voiceAIAPI had the same undefined-`api` bug; fixed
// by the import above. Their /ai/... paths are unchanged (unverified
// against a real backend mount - not part of this fix) but at least no
// longer throw ReferenceError on first use.
export const conversationalAIAPI = {
  sendMessage: (message) => api.post('/ai/conversational/send', { message }),
  getConversationHistory: () => api.get('/ai/conversational/history'),
};

export const voiceAIAPI = {
  transcribeAudio: (audio) => api.post('/ai/voice/transcribe', { audio }),
  generateSpeech: (text) => api.post('/ai/voice/speak', { text }),
};
