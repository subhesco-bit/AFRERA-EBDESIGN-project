const express = require('express');
const request = require('supertest');

const mockWaterService = { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
const mockSoilService = { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
const emittedSignals = [];

jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ error: 'No authorization header provided' });
    req.user = { id: 'user-1', role: req.headers['x-test-role'] || 'farmer' };
    next();
  },
  requireRole: (...roles) => (req, res, next) => roles.includes(req.user.role)
    ? next() : res.status(403).json({ success: false, error: 'Insufficient permissions' }),
}));
jest.mock('../../middleware/rateLimit', () => ({ rateLimiters: {
  read: (req, res, next) => next(), write: (req, res, next) => next(), api: (req, res, next) => next(),
} }));
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }));
jest.mock('../../core/signalBus', () => ({
  SIGNAL: { WATER_RECORD_CHANGED: 'agronomy.water.record_changed', SOIL_RECORD_CHANGED: 'agronomy.soil.record_changed' },
  SEVERITY: { INFO: 10 },
  signalBus: { emitSignal: (...args) => emittedSignals.push(args) },
}));
jest.mock('../../services/legacy/waterManagementService', () => ({
  waterBudgeting: mockWaterService, waterQuality: mockWaterService, rainwaterHarvesting: mockWaterService,
  watershedManagement: mockWaterService, waterAnalytics: mockWaterService,
}));
jest.mock('../../services/legacy/soilManagementService', () => ({
  soilHealth: mockSoilService, nutrientManagement: mockSoilService, fertilityManagement: mockSoilService,
}));

const { waterBudgetingRoutes } = require('../waterManagementRoutes');
const { soilHealthRoutes } = require('../soilManagementRoutes');
const app = express();
app.use(express.json());
app.use('/water', waterBudgetingRoutes);
app.use('/soil', soilHealthRoutes);

beforeEach(() => {
  jest.clearAllMocks();
  emittedSignals.length = 0;
});

test('bounds read pagination and IDs before calling services', async () => {
  await request(app).get('/water?limit=201').expect(400);
  await request(app).get('/soil/not-an-id').expect(400);
  expect(mockWaterService.list).not.toHaveBeenCalled();
  expect(mockSoilService.get).not.toHaveBeenCalled();
});

test('requires auth and rejects invalid water and soil writes', async () => {
  await request(app).post('/water').send({ plot_name: 'A' }).expect(401);
  await request(app).post('/water').set('Authorization', 'Bearer test').send({ plot_name: 'A', demand_liters: -1 }).expect(400);
  await request(app).post('/soil').set('Authorization', 'Bearer test').send({ plot_name: 'A', ph_level: 15 }).expect(400);
  expect(mockWaterService.create).not.toHaveBeenCalled();
  expect(mockSoilService.create).not.toHaveBeenCalled();
});

test('redacts service failures and preserves request correlation', async () => {
  mockWaterService.list.mockRejectedValue(new Error('postgres password leaked'));
  const response = await request(app).get('/water').set('x-correlation-id', 'water-123').expect(500);
  expect(response.body).toEqual(expect.objectContaining({
    error: 'Internal server error', code: 'INTERNAL_ERROR', requestId: 'water-123',
  }));
  expect(response.body.error).not.toMatch(/postgres/i);
});

test('emits correlated signals for representative water and soil mutations', async () => {
  mockWaterService.create.mockResolvedValue({ id: 8 });
  mockSoilService.update.mockResolvedValue({ id: 9 });
  mockWaterService.remove.mockResolvedValue(true);

  await request(app).post('/water').set('Authorization', 'Bearer test').set('x-correlation-id', 'water-1')
    .send({ plot_name: '<Plot>', demand_liters: 10 }).expect(201);
  await request(app).put('/soil/9').set('Authorization', 'Bearer test').set('x-correlation-id', 'soil-1')
    .send({ organic_matter_percent: 4 }).expect(200);
  await request(app).delete('/water/8').set('Authorization', 'Bearer test').set('x-correlation-id', 'water-2')
    .expect(200);

  expect(mockWaterService.create).toHaveBeenCalledWith(expect.objectContaining({ plot_name: 'Plot' }));
  expect(emittedSignals).toHaveLength(3);
  expect(emittedSignals[0][0]).toBe('agronomy.water.record_changed');
  expect(emittedSignals[0][2]).toEqual(expect.objectContaining({ correlationId: 'water-1' }));
  expect(emittedSignals[1][0]).toBe('agronomy.soil.record_changed');
  expect(emittedSignals[1][2]).toEqual(expect.objectContaining({ correlationId: 'soil-1' }));
});
