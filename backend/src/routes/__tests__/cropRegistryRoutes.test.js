'use strict';

// services/legacy/cropManagementService.js exports 6 real, DB-backed
// createCrudService(...) objects (crop registrations, varieties, seed
// plans, nurseries, sowing records, monitoring observations) that had
// zero Express router wrapping them. cropRegistryRoutes.js wraps all 6
// in a plain REST router (mounted at /api/crop-registry, 2026-09-16),
// same pattern as the other *RegistryRoutes.js files added this session.

const express = require('express');
const request = require('supertest');

describe('cropRegistryRoutes.js - new CRUD wrapper for 6 crop resources', () => {
  test('loads without throwing and registers 5 routes per resource (30 total)', () => {
    const router = require('../cropRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(30);
  });

  test.each([
    ['GET', '/api/crop-registry/registrations'],
    ['GET', '/api/crop-registry/varieties'],
    ['GET', '/api/crop-registry/seed-plans'],
    ['GET', '/api/crop-registry/nurseries'],
    ['GET', '/api/crop-registry/sowing-records'],
    ['GET', '/api/crop-registry/monitoring-observations'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../cropRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/crop-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
