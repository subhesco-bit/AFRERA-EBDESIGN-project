const express = require('express');
const request = require('supertest');

const mockSignals = [];
const mockDairyService = { listAnimals: jest.fn(), createAnimal: jest.fn() };
const mockHealthService = { listExaminations: jest.fn(), createExamination: jest.fn() };
const mockFisheriesService = { getAllFisheries: jest.fn(), createFishery: jest.fn() };

jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.user = { id: 'farmer-1', role: 'farmer' };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));
jest.mock('../../middleware/rateLimiter', () => ({ rateLimiter: (req, res, next) => next() }));
jest.mock('../../middleware/roleGroups', () => ({ FARM_OPERATIONS_ROLES: ['farmer'] }));
jest.mock('../../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../../core/signalBus', () => ({
  SIGNAL: {
    LIVESTOCK_RECORD_CHANGED: 'livestock.record.changed',
    FISHERIES_RECORD_CHANGED: 'fisheries.record.changed',
    ANIMAL_HEALTH_CHECK: 'livestock.animal.health_check',
  },
  SEVERITY: { INFO: 10, WARNING: 30 },
  signalBus: { emitSignal: (...args) => mockSignals.push(args) },
}));
jest.mock('../../services/legacy/dairyService', () => mockDairyService);
jest.mock('../../services/legacy/animalHealthService', () => mockHealthService);
jest.mock('../../services/legacy/fisheriesService', () => mockFisheriesService);

const dairyRoutes = require('../dairyRoutes');
const animalHealthRoutes = require('../animalHealthRoutes');
const fisheriesRoutes = require('../legacy/fisheriesRoutes');

const app = express();
app.use(express.json());
app.use('/dairy', dairyRoutes);
app.use('/animal-health', animalHealthRoutes);
app.use('/fisheries', fisheriesRoutes);

beforeEach(() => {
  jest.clearAllMocks();
  mockSignals.length = 0;
});

test('sanitizes and signals a dairy animal creation with correlation', async () => {
  mockDairyService.createAnimal.mockResolvedValue({ id: 12, name: 'Cow' });
  await request(app).post('/dairy/animals')
    .set('Authorization', 'Bearer test').set('x-correlation-id', 'livestock-1')
    .send({ name: '<Cow>' }).expect(201);

  expect(mockDairyService.createAnimal).toHaveBeenCalledWith({ name: 'Cow' });
  expect(mockSignals).toEqual(expect.arrayContaining([
    expect.arrayContaining(['livestock.record.changed', expect.any(Object), expect.objectContaining({ correlationId: 'livestock-1' })]),
  ]));
});

test('enforces animal-health auth and bounds invalid IDs', async () => {
  await request(app).post('/animal-health/examinations').send({ animal_id: 1 }).expect(401);
  await request(app).put('/animal-health/examinations/invalid').set('Authorization', 'Bearer test').send({}).expect(400);
  expect(mockHealthService.createExamination).not.toHaveBeenCalled();
});

test('rejects unbounded fisheries pagination before service access', async () => {
  await request(app).get('/fisheries?limit=101').expect(400);
  await request(app).get('/fisheries').expect(401);
  expect(mockFisheriesService.getAllFisheries).not.toHaveBeenCalled();
});