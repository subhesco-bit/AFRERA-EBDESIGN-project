'use strict';

// services/legacy/livestockManagementService.js exports 3 real,
// DB-backed createCrudService(...) objects (cattle registry, feed
// records, analytics records) that had zero Express router wrapping
// them - cattleRegistryAPI/feedManagementAPI/livestockAnalyticsAPI on
// LivestockManagementPage.jsx called endpoints that never existed
// anywhere. livestockRegistryRoutes.js wraps them in a plain REST router
// (list/create/get/update/remove per resource) and is mounted at
// /api/livestock-registry (2026-09-16). This test locks in real route
// registration and real auth enforcement, same pattern as
// labourRoutes.test.js.

const express = require('express');
const request = require('supertest');

describe('livestockRegistryRoutes.js - new CRUD wrapper for cattle/feed/analytics', () => {
  test('loads without throwing and registers 5 routes per resource (15 total)', () => {
    const router = require('../livestockRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(15);
  });

  test.each([
    ['GET', '/api/livestock-registry/cattle'],
    ['POST', '/api/livestock-registry/cattle'],
    ['GET', '/api/livestock-registry/feed'],
    ['POST', '/api/livestock-registry/feed'],
    ['GET', '/api/livestock-registry/analytics'],
    ['POST', '/api/livestock-registry/analytics'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../livestockRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/livestock-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
