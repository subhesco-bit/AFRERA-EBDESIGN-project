import { api } from './apiClient';

/**
 * Unified product-media API used by marketplace and farmer listing flows.
 * Keeps image generation, farmer-friendly product visuals and educational
 * cartoon assets on the same authenticated API surface.
 */
export const productMediaAIAPI = {
  getProviderStatus: () => api.get('/product-media-ai/status'),
  generateImage: (productId, prompt, options = {}) => api.post(`/product-media-ai/products/${productId}/image`, {
    prompt,
    ...options,
  }),
  generateCartoon: (productId, prompt, options = {}) => api.post(`/product-media-ai/products/${productId}/cartoon`, {
    prompt,
    ...options,
  }),
  buildVideoScript: (productId) => api.post(`/product-media-ai/products/${productId}/video-script`),
  generateVideo: (productId) => api.post(`/product-media-ai/products/${productId}/video`),
};

export default productMediaAIAPI;
