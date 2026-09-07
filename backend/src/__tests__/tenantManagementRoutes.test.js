const express = require('express');
const request = require('supertest');

// See organizationManagementRoutes.test.js - tenantManagementService had the
// same `this.db.query is not a function` bug (fixed 2026-09-07), so this
// mocks the DB boundary rather than requiring a live Postgres instance.
const mockQuery = jest.fn();
jest.mock('../database/connection', () => ({
  getPostgreSQL: () => ({ query: (...args) => mockQuery(...args) }),
}));

// See organizationManagementRoutes.test.js - aiBackboneService.js loads
// fine under plain Node (fixed 2026-09-07) but Jest/Babel's stricter parser
// still trips on unrelated duplicate declarations elsewhere in that
// ~7000-line file (AI Backbone system's own batch, out of scope here).
jest.mock('../services/legacy/aiBackboneService', () => ({
  analyze: jest.fn().mockResolvedValue({ implemented: false }),
  optimize: jest.fn().mockResolvedValue({ implemented: false }),
  predict: jest.fn().mockResolvedValue({ implemented: false }),
  recommend: jest.fn().mockResolvedValue({ implemented: false }),
}));

const { generateAccessToken } = require('../services/dual-use/authService');
const router = require('../routes/tenantManagementRoutes');

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/v1/tenant-management', router);
  return instance;
}

function adminToken() {
  return generateAccessToken({ id: 'admin-1', email: 'admin@example.com', role: 'admin' });
}

describe('tenantManagementRoutes', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('creates a tenant against the real tenants columns (name/domain/tier/allocated_resources/config)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Acme Tenant', domain: 'acme.example.com', tier: 'standard' }],
    });

    const res = await request(app())
      .post('/api/v1/tenant-management/tenants')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Acme Tenant', domain: 'acme.example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tenant.name).toBe('Acme Tenant');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tenants'),
      expect.arrayContaining(['Acme Tenant', 'acme.example.com', 'standard'])
    );
  });

  it('lists tenants with health-score enrichment without throwing on the AI gateway call', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Acme Tenant', tier: 'standard', status: 'active' }] })
      // getTenantUsageMetrics / calculateTenantHealth / analytics helper
      // queries triggered while enriching each row.
      .mockResolvedValue({ rows: [] });

    const res = await request(app())
      .get('/api/v1/tenant-management/tenants')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.tenants).toHaveLength(1);
    expect(res.body.tenants[0].name).toBe('Acme Tenant');
  });

  it('deletes a tenant', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1, name: 'Acme Tenant' }] });

    const res = await request(app())
      .delete('/api/v1/tenant-management/tenants/1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects tenant creation without a token', async () => {
    const res = await request(app())
      .post('/api/v1/tenant-management/tenants')
      .send({ name: 'No Auth Tenant' });

    expect(res.status).toBe(401);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
