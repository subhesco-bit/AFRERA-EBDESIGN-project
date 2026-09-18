'use strict';

// index.js used to mount routes/organizationManagementRoutes.js, a dead
// 38-line "Route operational" scaffold (POST / + GET /health only).
// routes/platform/organizationManagementRoutes_merged.js is a real
// in-memory CRUD implementation matching organizationManagementAPI's
// real needs (getAllOrganizations/createOrganization/
// deleteOrganization on OrganizationTenantManagementPage.jsx) but was
// never require()'d anywhere until 2026-09-16. Swapped, same pattern as
// the earlier glutWarningRoutes/foluBenchmarkRoutes/wikipediaRoutes
// scaffold swaps this session.

const express = require('express');
const request = require('supertest');

describe('organizationManagementRoutes_merged.js - scaffold swap for the dead stub', () => {
  test('loads without throwing and registers 5 real CRUD routes', () => {
    const router = require('../platform/organizationManagementRoutes_merged.js');
    expect(router.stack.filter((l) => l.route).length).toBe(5);
  });

  test('GET / reaches a real handler and returns an empty list, not the dead stub message', async () => {
    const router = require('../platform/organizationManagementRoutes_merged.js');
    const app = express();
    app.use(express.json());
    app.use('/api/organizationmanagement', router);
    const res = await request(app).get('/api/organizationmanagement');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [] });
  });

  test.each([
    ['POST', '/api/organizationmanagement'],
    ['PUT', '/api/organizationmanagement/1'],
    ['DELETE', '/api/organizationmanagement/1'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../platform/organizationManagementRoutes_merged.js');
    const app = express();
    app.use(express.json());
    app.use('/api/organizationmanagement', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
