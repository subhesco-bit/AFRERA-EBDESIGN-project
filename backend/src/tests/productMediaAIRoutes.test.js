const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { id: 'test-user' };
    next();
  },
}));

jest.mock('../middleware/rateLimiter', () => ({
  apiLimiter: (_req, _res, next) => next(),
}));

jest.mock('../controllers/productMediaAIController', () => ({
  getProviderStatus: (_req, res) => res.json({ success: true, data: { imageProviders: [] } }),
  generateProductImage: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
  buildNutrientVideoScript: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
  generateProductVideo: (req, res) => res.json({ success: true, data: { productId: req.params.productId } }),
}));

const mediaRoutes = require('../routes/productMediaAIRoutes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/media', mediaRoutes);
  return app;
}

describe('product media AI routes', () => {
  it('exposes provider status behind authentication', async () => {
    const response = await request(createApp()).get('/media/status');

    expect(response.status).toBe(200);
    expect(response.body.data.imageProviders).toEqual([]);
  });

  it('delegates image generation with the product identifier', async () => {
    const response = await request(createApp())
      .post('/media/products/product-123/image')
      .send({ prompt: 'clean product photograph' });

    expect(response.status).toBe(200);
    expect(response.body.data.productId).toBe('product-123');
  });
});
