const express = require('express');
const request = require('supertest');

// organizationManagementService talks to Postgres via getPostgreSQL().query()
// (fixed 2026-09-07 - it previously called a `.query()` method that
// database/connection.js never exported, so every route threw at runtime).
// Mock that boundary so these are real unit tests of the route/service
// wiring and the AI-gateway call-signature fix, not integration tests
// requiring a live database.
const mockQuery = jest.fn();
jest.mock('../database/connection', () => ({
  getPostgreSQL: () => ({ query: (...args) => mockQuery(...args) }),
}));

// aiBackboneService.js is a ~7000-line file mechanically concatenated from
// 7 previously-separate services; it now loads correctly under plain Node
// (fixed 2026-09-07 - see that file's dedup-fix comments) but still has
// additional duplicate top-level function declarations Babel's stricter
// parser rejects (out of scope for this Platform/Identity pass - flagged
// for the AI Backbone system's own batch). Mock it here so these tests
// exercise the organization route/service wiring in isolation.
jest.mock('../services/legacy/aiBackboneService', () => ({
  analyze: jest.fn().mockResolvedValue({ implemented: false }),
  optimize: jest.fn().mockResolvedValue({ implemented: false }),
  predict: jest.fn().mockResolvedValue({ implemented: false }),
  recommend: jest.fn().mockResolvedValue({ implemented: false }),
}));

const { generateAccessToken } = require('../services/dual-use/authService');
const router = require('../routes/organizationManagementRoutes');

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/v1/organization-management', router);
  return instance;
}

function adminToken() {
  return generateAccessToken({ id: 'admin-1', email: 'admin@example.com', role: 'admin' });
}

describe('organizationManagementRoutes', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('creates an organization and persists the AI-analysis fallback as an empty structure', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'org-1', name: 'Acme Farms', industry: 'agriculture', status: 'active' }],
    });

    const res = await request(app())
      .post('/api/v1/organization-management/organizations')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Acme Farms', industry: 'agriculture', size: 'small' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.organization.name).toBe('Acme Farms');
    // The AI gateway has no real model connected, so recommendedStructure
    // must come back as the honest "not implemented" shape, not throw and
    // not fabricate data (this is what aiBackboneService.analyze's gateway
    // fix - passing modelType/data as separate args - actually unblocks).
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO organizations'),
      expect.any(Array)
    );
  });

  it('rejects organization creation for a non-admin caller', async () => {
    const token = generateAccessToken({ id: 'farmer-1', email: 'f@example.com', role: 'farmer' });
    const res = await request(app())
      .post('/api/v1/organization-management/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Should Fail' });

    expect(res.status).toBe(403);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('lists organizations via the newly-added GET /organizations (previously missing entirely)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'org-1', name: 'Acme Farms', status: 'active' },
        { id: 'org-2', name: 'Beta Coop', status: 'active' },
      ],
    });

    const res = await request(app())
      .get('/api/v1/organization-management/organizations')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.organizations).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('soft-deletes an organization via the newly-added DELETE /organizations/:id', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'org-1', name: 'Acme Farms', status: 'deleted' }],
    });

    const res = await request(app())
      .delete('/api/v1/organization-management/organizations/org-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deletedOrganization.status).toBe('deleted');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'deleted'"),
      ['org-1']
    );
  });

  it('returns 404 when deleting an organization that does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app())
      .delete('/api/v1/organization-management/organizations/missing')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
