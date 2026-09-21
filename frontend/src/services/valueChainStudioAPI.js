import { api } from './apiClient';

/**
 * Value-Chain Studio API client — follows the same pattern as
 * productMediaAIAPI.js (a thin object of functions over the shared `api`
 * axios instance, matching backend/src/routes/valueChainStudioRoutes.js).
 */
export const valueChainStudioAPI = {
  getLifecyclePlan: (productId, farmerId) => api.get(`/value-chain-studio/${productId}`, {
    params: farmerId ? { farmerId } : {},
  }),
  generatePositioning: (productId, payload = {}) => api.post(
    `/value-chain-studio/${productId}/positioning`,
    payload,
  ),
};

export default valueChainStudioAPI;
