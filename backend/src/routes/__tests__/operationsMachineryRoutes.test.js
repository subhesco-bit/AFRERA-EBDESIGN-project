const express = require('express');
const request = require('supertest');

const mockService = { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
const mockMaintenance = { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
const mockExchange = { createListing: jest.fn(), listAvailable: jest.fn(), getListing: jest.fn(), reserveListing: jest.fn(), completeExchange: jest.fn(), withdrawListing: jest.fn() };
const mockSignals = [];

jest.mock('../../middleware/auth', () => ({ authMiddleware: (req, res, next) => { if (!req.headers.authorization) return res.status(401).json({ error: 'missing' }); req.user = { id: 'u1', role: req.headers['x-role'] || 'farmer' }; next(); }, requireRole: (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'forbidden' }) }));
jest.mock('../../middleware/rateLimit', () => ({ rateLimiters: { read: (req, res, next) => next(), write: (req, res, next) => next() } }));
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../../core/signalBus', () => ({ SIGNAL: { OPERATIONS_RECORD_CHANGED: 'operations.record_changed', MAINTENANCE_RECORD_CHANGED: 'operations.maintenance.record_changed', EQUIPMENT_EXCHANGE_CHANGED: 'operations.equipment_exchange.changed' }, SEVERITY: { INFO: 10 }, signalBus: { emitSignal: (...args) => mockSignals.push(args) } }));
jest.mock('../../services/legacy/operationsManagementService', () => ({ farmActivities: mockService, farmTasks: mockService, contractors: mockService, machineryOperations: mockService, equipmentScheduling: mockService, inputConsumption: mockService, farmProductivity: mockService, farmOperationsDashboard: mockService }));
jest.mock('../../services/legacy/preventiveMaintenanceService', () => ({ preventiveMaintenance: mockMaintenance }));
jest.mock('../../services/legacy/equipmentExchangeService', () => mockExchange);

const { farmActivityRoutes } = require('../operationsManagementRoutes');
const maintenanceRoutes = require('../preventiveMaintenanceRoutes');
const exchangeRoutes = require('../equipmentExchangeRoutes');
const app = express();
app.use(express.json());
app.use('/activities', farmActivityRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/exchange', exchangeRoutes);

beforeEach(() => { jest.clearAllMocks(); mockSignals.length = 0; });

test('creates sanitized activity and emits a correlated signal', async () => {
  mockService.create.mockResolvedValue({ id: 7 });
  await request(app).post('/activities').set('Authorization', 'Bearer test').set('x-correlation-id', 'op-1').send({ activity_name: '<Planting>', activity_type: 'field' }).expect(201);
  expect(mockService.create).toHaveBeenCalledWith(expect.objectContaining({ activity_name: 'Planting' }));
  expect(mockSignals[0][2]).toEqual(expect.objectContaining({ correlationId: 'op-1' }));
});

test('enforces auth, bounded IDs, and maintenance numeric validation', async () => {
  await request(app).post('/maintenance').send({ equipment_name: 'Tractor' }).expect(401);
  await request(app).get('/maintenance/not-an-id').expect(400);
  await request(app).post('/maintenance').set('Authorization', 'Bearer test').send({ equipment_name: 'Tractor', cost: -1 }).expect(400);
  expect(mockMaintenance.create).not.toHaveBeenCalled();
});

test('validates exchange listing and preserves ownership call', async () => {
  mockExchange.createListing.mockResolvedValue({ id: 9 });
  await request(app).post('/exchange').set('Authorization', 'Bearer test').send({ equipmentName: 'Tractor', conditionGrade: 'A', pricingType: 'priced', priceInr: 1200 }).expect(201);
  expect(mockExchange.createListing).toHaveBeenCalledWith('u1', expect.objectContaining({ equipmentName: 'Tractor' }));
  await request(app).post('/exchange').set('Authorization', 'Bearer test').send({ equipmentName: 'Tractor', conditionGrade: 'A', pricingType: 'priced', priceInr: -1 }).expect(400);
  await request(app).post('/exchange/9/reserve').set('Authorization', 'Bearer test').set('x-role', 'consumer').expect(403);
});