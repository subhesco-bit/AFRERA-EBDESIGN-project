const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { id: 'admin-1' };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
}));

jest.mock('../services/publicDataExtractorService', () => ({
  listSources: jest.fn().mockResolvedValue([{ dataset_key: 'mandi-prices' }]),
  registerSource: jest.fn().mockResolvedValue({ id: 'source-1' }),
  extractDataset: jest.fn().mockResolvedValue({ status: 'completed', records_loaded: 1 }),
}));

const routes = require('../routes/publicDataRoutes');
const service = require('../services/publicDataExtractorService');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/public-data', routes);
  return app;
}

describe('public data routes', () => {
  it('lists approved sources', async () => {
    const response = await request(createApp()).get('/public-data/sources');
    expect(response.status).toBe(200);
    expect(response.body.data[0].dataset_key).toBe('mandi-prices');
  });

  it('passes authenticated extraction requests to the service', async () => {
    const response = await request(createApp())
      .post('/public-data/sources/source-1/extract')
      .send({ filter: { state: 'Assam' } });
    expect(response.status).toBe(200);
    expect(service.extractDataset).toHaveBeenCalledWith('source-1', { state: 'Assam' }, 'admin-1');
  });
});
