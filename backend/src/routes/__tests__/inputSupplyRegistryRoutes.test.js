'use strict';

// services/legacy/inputSupplyManagementService.js exports 8 real,
// DB-backed createCrudService(...) objects that had zero Express router
// wrapping them. inputSupplyRegistryRoutes.js wraps all 8 in a plain
// REST router (mounted at /api/input-supply-registry, 2026-09-16), same
// pattern as the other *RegistryRoutes.js files added this session.

const express = require('express');
const request = require('supertest');

describe('inputSupplyRegistryRoutes.js - new CRUD wrapper for 8 input-supply resources', () => {
  test('loads without throwing and registers 5 routes per resource (40 total)', () => {
    const router = require('../inputSupplyRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(40);
  });

  test.each([
    ['GET', '/api/input-supply-registry/biofertilizer'],
    ['GET', '/api/input-supply-registry/pesticide-inventory'],
    ['GET', '/api/input-supply-registry/bio-pesticide'],
    ['GET', '/api/input-supply-registry/micronutrient'],
    ['GET', '/api/input-supply-registry/organic-input'],
    ['GET', '/api/input-supply-registry/procurement-orders'],
    ['GET', '/api/input-supply-registry/distribution-records'],
    ['GET', '/api/input-supply-registry/traceability-records'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../inputSupplyRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/input-supply-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
