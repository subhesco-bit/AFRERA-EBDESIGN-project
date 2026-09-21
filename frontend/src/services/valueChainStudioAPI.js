import { api } from './apiClient';

/**
 * Value-Chain Studio API client (v2).
 * Thin wrappers over /api/v1/value-chain-studio/* matching valueChainStudioRoutes.js.
 */
export const valueChainStudioAPI = {
  getCapabilities: () => api.get('/value-chain-studio/capabilities'),

  getLifecyclePlan: (productId, farmerId) => api.get(`/value-chain-studio/${productId}`, {
    params: farmerId ? { farmerId } : {},
  }),

  generatePositioning: (productId, payload = {}) => api.post(
    `/value-chain-studio/${productId}/positioning`,
    payload,
  ),
};

export default valueChainStudioAPI;
