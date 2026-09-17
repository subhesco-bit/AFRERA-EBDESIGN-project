'use strict';

// services/legacy/soilManagementService.js exports 3 real, DB-backed
// createCrudService(...) objects (soil health cards, nutrient plans,
// fertility records) that had zero Express router wrapping them.
// soilRegistryRoutes.js wraps all 3 in a plain REST router (mounted at
// /api/soil-registry, 2026-09-16), same pattern as the other
// *RegistryRoutes.js files added this session. Distinct from the
// pre-existing routes/soilHealth.js (a bare /health stub) and the
// dead soilManagementRoutes.js stub - neither touched here.

const express = require('express');
const request = require('supertest');

describe('soilRegistryRoutes.js - new CRUD wrapper for 3 soil resources', () => {
  test('loads without throwing and registers 5 routes per resource (15 total)', () => {
    const router = require('../soilRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(15);
  });

  test.each([
    ['GET', '/api/soil-registry/health-cards'],
    ['GET', '/api/soil-registry/nutrient-plans'],
    ['GET', '/api/soil-registry/fertility-records'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../soilRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/soil-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
