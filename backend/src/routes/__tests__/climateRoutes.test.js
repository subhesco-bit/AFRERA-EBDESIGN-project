const express = require('express');
const request = require('supertest');

const mockServices = {
  drought: { list: jest.fn(), get: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() },
  weather: { coverage: jest.fn(), raiseAlert: jest.fn(), recordForecast: jest.fn() },
  advisory: { listAdvisories: jest.fn(), getAdvisory: jest.fn(), createAdvisory: jest.fn(), updateAdvisory: jest.fn() },
};
const mockSignals = [];

jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ error: 'No authorization header provided' });
    req.user = { id: 'user-1', role: req.headers['x-test-role'] || 'farmer' };
    next();
  },
  requireRole: (...roles) => (req, res, next) => roles.includes(req.user.role)
    ? next() : res.status(403).json({ success: false, error: 'Insufficient permissions' }),
}));
jest.mock('../../middleware/rateLimit', () => ({ rateLimiters: { read: (req, res, next) => next(), write: (req, res, next) => next() } }));
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }));
jest.mock('../../core/signalBus', () => ({
  SIGNAL: { WEATHER_ALERT: 'agronomy.weather.alert' },
  SEVERITY: { NOTICE: 20, WARNING: 30, EMERGENCY: 50 },
  signalBus: { emitSignal: (...args) => mockSignals.push(args) },
}));
jest.mock('../../services/legacy/climateMonitoringService', () => ({ droughtMonitoring: mockServices.drought, floodMonitoring: mockServices.drought, diseaseForecasting: mockServices.drought, climateRisk: mockServices.drought, agroMeteorology: mockServices.drought }));
jest.mock('../../services/legacy/weatherService', () => ({
  coverage: mockServices.weather.coverage,
  raiseAlert: mockServices.weather.raiseAlert,
  recordForecast: mockServices.weather.recordForecast,
  listAdvisories: mockServices.advisory.listAdvisories,
  getAdvisory: mockServices.advisory.getAdvisory,
  createAdvisory: mockServices.advisory.createAdvisory,
  updateAdvisory: mockServices.advisory.updateAdvisory,
}));

const app = express();
app.use(express.json());
app.use('/drought', require('../climateMonitoringRoutes').droughtMonitoringRoutes);
app.use('/weather', require('../weatherRoutes'));
app.use('/advisory', require('../climateAdvisoryRoutes'));

beforeEach(() => { jest.clearAllMocks(); mockSignals.length = 0; });

test('rejects invalid pagination and IDs before calling climate services', async () => {
  await request(app).get('/drought?limit=201').expect(400);
  await request(app).get('/drought/not-an-id').expect(400);
  expect(mockServices.drought.list).not.toHaveBeenCalled();
  expect(mockServices.drought.get).not.toHaveBeenCalled();
});

test('requires auth for climate writes and validates bounded forecast input', async () => {
  await request(app).post('/weather/forecasts').send({ validFor: '2026-09-03', horizonDays: 5 }).expect(401);
  await request(app).post('/weather/forecasts').set('Authorization', 'Bearer test').send({ validFor: '2026-09-03', horizonDays: 31 }).expect(400);
  expect(mockServices.weather.recordForecast).not.toHaveBeenCalled();
});

test('redacts service failures and preserves request correlation', async () => {
  mockServices.weather.coverage.mockRejectedValue(new Error('postgres password leaked'));
  const response = await request(app).get('/weather/coverage').set('x-correlation-id', 'climate-123').expect(500);
  expect(response.body).toEqual(expect.objectContaining({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId: 'climate-123' }));
  expect(response.body.error).not.toMatch(/postgres/i);
});

test('emits existing weather signal for alert and advisory mutations', async () => {
  mockServices.weather.raiseAlert.mockResolvedValue({ id: 8, alert_code: 'A-8', severity: 'warning' });
  mockServices.advisory.createAdvisory.mockResolvedValue({ id: 9, source: 'manual' });
  const alert = { alertCode: 'A-8', alertType: 'flood', severity: 'warning', headline: 'Flood watch', recommendedAction: 'Avoid route', effectiveFrom: '2026-09-02T00:00:00Z', effectiveUntil: '2026-09-03T00:00:00Z' };
  await request(app).post('/weather/alerts').set('Authorization', 'Bearer test').set('x-correlation-id', 'alert-1').send(alert).expect(200);
  await request(app).post('/advisory/advisories').set('Authorization', 'Bearer test').set('x-correlation-id', 'advisory-1').send({ advisory: 'Irrigate at dawn', title: 'Irrigation', type: 'Irrigation', valid_until: '2026-09-03' }).expect(201);
  expect(mockSignals).toHaveLength(2);
  expect(mockSignals[0][2]).toEqual(expect.objectContaining({ correlationId: 'alert-1' }));
  expect(mockSignals[1][2]).toEqual(expect.objectContaining({ correlationId: 'advisory-1' }));
});