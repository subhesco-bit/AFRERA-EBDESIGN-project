'use strict';

// services/legacy/horticultureManagementService.js exports 8 real,
// DB-backed createCrudService(...) objects that had zero Express router
// wrapping them. horticultureRegistryRoutes.js wraps all 8 in a plain
// REST router (mounted at /api/horticulture-registry, 2026-09-16), same
// pattern as livestockRegistryRoutes.js/fisheriesRegistryRoutes.js/
// operationsRegistryRoutes.js.

const express = require('express');
const request = require('supertest');

describe('horticultureRegistryRoutes.js - new CRUD wrapper for 8 horticulture resources', () => {
  test('loads without throwing and registers 5 routes per resource (40 total)', () => {
    const router = require('../horticultureRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(40);
  });

  test.each([
    ['GET', '/api/horticulture-registry/vegetable-production'],
    ['GET', '/api/horticulture-registry/floriculture'],
    ['GET', '/api/horticulture-registry/polyhouses'],
    ['GET', '/api/horticulture-registry/hydroponic-systems'],
    ['GET', '/api/horticulture-registry/aeroponic-systems'],
    ['GET', '/api/horticulture-registry/precision-readings'],
    ['GET', '/api/horticulture-registry/protected-structures'],
    ['GET', '/api/horticulture-registry/analytics'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../horticultureRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/horticulture-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
