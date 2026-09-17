'use strict';

// services/legacy/landManagementService.js exports 6 real, DB-backed
// createCrudService(...) objects (land leases, GIS mappings, soil zones,
// water resources, boundaries, surveys) that had zero Express router
// wrapping them. landRegistryRoutes.js wraps all 6 in a plain REST
// router (mounted at /api/land-registry, 2026-09-16), same pattern as
// the other *RegistryRoutes.js files added this session. Distinct from
// the pre-existing, still-dead landManagementRoutes.js stub at
// /api/landmanagement - not touched.

const express = require('express');
const request = require('supertest');

describe('landRegistryRoutes.js - new CRUD wrapper for 6 land resources', () => {
  test('loads without throwing and registers 5 routes per resource (30 total)', () => {
    const router = require('../landRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(30);
  });

  test.each([
    ['GET', '/api/land-registry/leases'],
    ['GET', '/api/land-registry/gis-mappings'],
    ['GET', '/api/land-registry/soil-zones'],
    ['GET', '/api/land-registry/water-resources'],
    ['GET', '/api/land-registry/boundaries'],
    ['GET', '/api/land-registry/surveys'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../landRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/land-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
