'use strict';

// services/legacy/climateMonitoringService.js exports 5 real, DB-backed
// createCrudService(...) objects (drought, flood, disease forecasts,
// climate risk, agro-meteorology) that had zero Express router wrapping
// them. climateRegistryRoutes.js wraps all 5 in a plain REST router
// (mounted at /api/climate-registry, 2026-09-16), same pattern as the
// other *RegistryRoutes.js files added this session. M087 Pest
// Forecasting is deliberately not covered - it's not in this service
// file at all, a genuine gap left unfabricated in api.js.

const express = require('express');
const request = require('supertest');

describe('climateRegistryRoutes.js - new CRUD wrapper for 5 climate resources', () => {
  test('loads without throwing and registers 5 routes per resource (25 total)', () => {
    const router = require('../climateRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(25);
  });

  test.each([
    ['GET', '/api/climate-registry/drought'],
    ['GET', '/api/climate-registry/flood'],
    ['GET', '/api/climate-registry/disease-forecasts'],
    ['GET', '/api/climate-registry/climate-risk'],
    ['GET', '/api/climate-registry/agro-meteorology'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../climateRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/climate-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
