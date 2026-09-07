import { api } from './apiClient';

export const productsAPI = {
  getProducts: (filters, pagination) => api.get('/products', { params: { ...filters, ...pagination } }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories/list'),
  getStates: () => api.get('/products/states/list'),
  searchProducts: (query) => api.get('/products/search', { params: { q: query } }),
  requestImage: (productId, prompt) => api.post(`/ai/product-media-ai/products/${productId}/image`, { prompt }),
};

export const productReviewsAPI = {
  getReviews: (productId, params = {}) => api.get(`/product-reviews/products/${productId}`, { params }),
  getStats: (productId) => api.get(`/product-reviews/products/${productId}/stats`),
  createReview: (productId, data) => api.post(`/product-reviews/products/${productId}`, data),
};

export const ordersAPI = {
  getCart: () => api.get('/orders/cart'),
  addToCart: (data) => api.post('/orders/cart', data),
  updateCartItem: (id, data) => api.put(`/orders/cart/${id}`, data),
  removeFromCart: (id) => api.delete(`/orders/cart/${id}`),
  clearCart: () => api.delete('/orders/cart'),
  createOrder: (data) => api.post('/orders', data),
  getOrder: (id) => api.get(`/orders/${id}`),
  getOrders: (filters, pagination) => api.get('/orders', { params: { ...filters, ...pagination } }),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  processPayment: (id, data) => api.post(`/orders/${id}/payment`, data),
  cancelOrder: (id) => api.delete(`/orders/${id}`),
};

export const blockchainVerificationAPI = {
  getStats: () => api.get('/blockchain/stats'),
  verifyProduct: (productId) => api.get(`/blockchain/products/${productId}/verify`),
};

export const enterpriseIntegrationAPI = {
  getCurrentOrganizationIntegrations: () => api.get('/enterprise/organizations/current/integrations'),
  getSystemStatus: () => api.get('/enterprise/system/status'),
  getIntegrationHealth: (integrationId) => api.get(`/enterprise/integrations/${integrationId}/health`),
};

export const farmersAPI = {
  getFarmer: (id) => api.get(`/farmers/${id}`),
  getFarmers: (filters, pagination) => api.get('/farmers', { params: { ...filters, ...pagination } }),
  calculateFDI: (id) => api.post(`/farmers/${id}/fdi`),
  addCertification: (id, data) => api.post(`/farmers/${id}/certifications`, data),
  getCertifications: (id) => api.get(`/farmers/${id}/certifications`),
  getFPOs: (filters) => api.get('/farmers/fpos/list', { params: filters }),
};

export const seedVaultAPI = {
  getSeeds: () => api.get('/seed-vault'),
  getCategories: () => api.get('/seed-vault/categories'),
  addSeed: (data) => api.post('/seed-vault', data),
  updateSeed: (id, data) => api.put(`/seed-vault/${id}`, data),
  recordUsage: (id, amountUsed) => api.post(`/seed-vault/${id}/record-usage`, { amountUsed }),
  deleteSeed: (id) => api.delete(`/seed-vault/${id}`),
};
