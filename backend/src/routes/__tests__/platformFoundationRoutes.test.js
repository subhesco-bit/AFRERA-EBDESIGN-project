const express = require('express');
const request = require('supertest');

const mockServices = {
  platform: { applyOptimizedConfiguration: jest.fn(), getConfigurationHistory: jest.fn() },
  tenant: { createTenant: jest.fn() },
  organization: { updateOrganization: jest.fn() },
  system: { predictIncidents: jest.fn() }
};
const mockEmittedSignals = [];

jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 'admin-1', role: req.headers['x-test-role'] || 'admin' };
    next();
  },
  requireRole: (...roles) => (req, res, next) => roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ success: false, error: 'Insufficient permissions' })
}));
jest.mock('../../middleware/rateLimit', () => ({
  rateLimiters: { api: (req, res, next) => next(), read: (req, res, next) => next(), write: (req, res, next) => next() }
}));
jest.mock('../../utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }));
jest.mock('../../core/signalBus', () => ({
  SIGNAL: { CONFIGURATION_CHANGED: 'configuration.changed', TENANT_CREATED: 'tenant.created', ORGANIZATION_UPDATED: 'organization.updated', CAPACITY_FORECAST_UPDATED: 'capacity.updated' },
  SEVERITY: { INFO: 10, NOTICE: 20, WARNING: 30 },
  signalBus: { emitSignal: (...args) => mockEmittedSignals.push(args) }
}));
jest.mock('../../services/legacy/platformConfigurationService', () => mockServices.platform);
jest.mock('../../services/legacy/tenantManagementService', () => mockServices.tenant);
jest.mock('../../services/legacy/organizationManagementService', () => mockServices.organization);
jest.mock('../../services/legacy/systemAdministrationService', () => mockServices.system);

const app = express();
app.use(express.json());
app.use('/platform', require('../platformConfigurationRoutes'));
app.use('/tenant', require('../tenantManagementRoutes'));
app.use('/organization', require('../organizationManagementRoutes'));
app.use('/system', require('../systemAdministrationRoutes'));

beforeEach(() => {
  jest.clearAllMocks();
  mockEmittedSignals.length = 0;
});

test('rejects invalid configuration history limits and non-admin access', async () => {
  await request(app).get('/platform/configuration/history?limit=1001').expect(400);
  await request(app).get('/platform/configuration/recommendations').set('x-test-role', 'consumer').expect(403);
});

test('rejects malformed writes before calling services', async () => {
  await request(app).post('/platform/configuration/apply').send({ parameters: { cache_size: 1 } }).expect(400);
  await request(app).post('/tenant/tenants').send({ name: 'Tenant', expectedUsers: -1 }).expect(400);
  await request(app).put('/organization/organizations/org-1').send({}).expect(400);
  await request(app).post('/system/incidents/root-cause').send({}).expect(400);
  expect(mockServices.platform.applyOptimizedConfiguration).not.toHaveBeenCalled();
  expect(mockServices.tenant.createTenant).not.toHaveBeenCalled();
});

test('redacts downstream failures and returns request correlation metadata', async () => {
  mockServices.system.predictIncidents.mockRejectedValue(new Error('database password leaked')); 
  const response = await request(app)
    .get('/system/incidents/predict?timeframe=24h')
    .set('x-correlation-id', 'req-123')
    .expect(500);
  expect(response.body).toEqual(expect.objectContaining({ error: 'Internal server error', code: 'INTERNAL_ERROR', requestId: 'req-123' }));
  expect(response.body).not.toHaveProperty('error', 'database password leaked');
});

test('emits mutation signals with the request correlation ID', async () => {
  mockServices.tenant.createTenant.mockResolvedValue({ tenant: { id: 'tenant-1', name: 'Tenant', tier: 'standard' }, resourceAllocation: {} });
  await request(app).post('/tenant/tenants').set('x-correlation-id', 'req-tenant').send({ name: 'Tenant' }).expect(200);
  expect(mockEmittedSignals[0][2]).toEqual(expect.objectContaining({ correlationId: 'req-tenant' }));
});