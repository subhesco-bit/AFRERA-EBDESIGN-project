const express = require('express');
const request = require('supertest');

const mockSignals = [];
const mockController = new Proxy({}, {
  get: () => jest.fn().mockResolvedValue({ id: 'ok' })
});
const mockBulkController = {
  createBulkOrderRequest: jest.fn((req, res) => res.status(201).json({ success: true, data: req.body })),
  getBulkOrderAnalytics: jest.fn(),
  getUserBulkOrders: jest.fn(),
  getBulkOrder: jest.fn(),
  updateBulkOrderStatus: jest.fn(),
  getBulkOrderQuotations: jest.fn(),
  submitQuotation: jest.fn(),
  acceptQuotation: jest.fn(),
  cancelBulkOrder: jest.fn()
};

jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.user = { id: 'admin-1', role: 'admin', permissions: [] };
    next();
  },
  requireRole: (...roles) => (req, res, next) => roles.includes(req.user?.role)
    ? next() : res.status(403).json({ success: false, error: 'Insufficient permissions' })
}));
jest.mock('../../middleware/rateLimiter', () => ({ rateLimiter: (req, res, next) => next() }));
jest.mock('../../middleware/inputValidation', () => ({
  sanitizeObject: (value) => JSON.parse(JSON.stringify(value).replace(/[<>]/g, ''))
}));
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../../core/signalBus', () => ({
  SIGNAL: {},
  SEVERITY: { INFO: 10 },
  signalBus: { emitSignal: (...args) => mockSignals.push(args) }
}));
jest.mock('../../controllers/completeERPIntegrationController', () => mockController);
jest.mock('../../controllers/bulkOrderController', () => mockBulkController);

const completeERPRoutes = require('../completeERPIntegrationRoutes');
const bulkOrderRoutes = require('../bulkOrderRoutes');

function appFor(router, path) {
  const app = express();
  app.use(express.json());
  app.use(path, router);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSignals.length = 0;
});

test('requires authentication before ERP integration access', async () => {
  await request(appFor(completeERPRoutes, '/erp')).post('/erp/farmer/1/harvest').send({}).expect(401);
  expect(mockController.syncFarmerHarvestWithERP).not.toHaveBeenCalled();
});

test('bounds ERP IDs and requires explicit human authorization', async () => {
  const app = appFor(completeERPRoutes, '/erp');
  await request(app).post('/erp/farmer/invalid.id/harvest').set('Authorization', 'Bearer test').set('x-human-authorization', 'confirmed').send({}).expect(400);
  await request(app).post('/erp/farmer/1/harvest').set('Authorization', 'Bearer test').send({ quantity: 2 }).expect(403);
  expect(mockController.syncFarmerHarvestWithERP).not.toHaveBeenCalled();
});

test('sanitizes commerce writes and emits a correlated mutation signal', async () => {
  const response = await request(appFor(bulkOrderRoutes, '/bulk'))
    .post('/bulk')
    .set('Authorization', 'Bearer test')
    .set('x-correlation-id', 'commerce-1')
    .send({ product: '<rice>', quantity: 5 })
    .expect(201);

  expect(response.body.data.product).toBe('rice');
  expect(mockSignals).toEqual(expect.arrayContaining([
    expect.arrayContaining(['commerce.bulk_order.changed', expect.any(Object), expect.objectContaining({ correlationId: 'commerce-1' })])
  ]));
});

test('rejects unbounded commerce pagination before controller access', async () => {
  await request(appFor(bulkOrderRoutes, '/bulk')).get('/bulk?limit=101').set('Authorization', 'Bearer test').expect(400);
  expect(mockBulkController.getBulkOrderAnalytics).not.toHaveBeenCalled();
});
