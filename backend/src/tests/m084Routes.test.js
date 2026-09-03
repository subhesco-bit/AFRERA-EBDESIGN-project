const express = require('express');
const request = require('supertest');

const mockController = {
  createTrendDefinition: jest.fn((req, res) => res.status(201).json({ success: true })),
  addDataPoint: jest.fn(),
  getTrendDataPoints: jest.fn(),
  analyzeTrend: jest.fn(),
  generateTrendForecast: jest.fn(),
  detectSeasonality: jest.fn(),
  calculateCorrelation: jest.fn(),
  detectBreakpoints: jest.fn(),
  createTrendAlert: jest.fn(),
  getTrendAlerts: jest.fn(),
  createDisasterAlert: jest.fn(),
  listDisasterAlerts: jest.fn(),
  getDisasterAlert: jest.fn(),
  cancelDisasterAlert: jest.fn(),
  getDisasterAlertAdvisory: jest.fn(),
};

jest.mock('../modules/M084/controller', () => mockController);
jest.mock('../middleware/rateLimit', () => ({
  rateLimiters: {
    read: (req, res, next) => next(),
    write: (req, res, next) => next(),
  },
}));
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    if (!req.headers.authorization) return res.status(401).json({ error: 'Unauthorized' });
    req.user = { role: req.headers['x-test-role'] || 'farmer' };
    next();
  },
  requireRole: (...roles) => (req, res, next) => roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'Forbidden' }),
}));

const app = express();
app.use(express.json());
app.use(require('../modules/M084/routes'));

beforeEach(() => jest.clearAllMocks());

test('rejects unauthenticated trend mutations and lets an admin reach the controller', async () => {
  await request(app).post('/trends').send({ trend_name: 'Rainfall' }).expect(401);
  expect(mockController.createTrendDefinition).not.toHaveBeenCalled();

  await request(app)
    .post('/trends')
    .set('Authorization', 'Bearer test')
    .set('x-test-role', 'admin')
    .send({ trend_name: 'Rainfall' })
    .expect(201);
  expect(mockController.createTrendDefinition).toHaveBeenCalledTimes(1);
});