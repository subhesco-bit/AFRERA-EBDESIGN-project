'use strict';

// services/legacy/waterManagementService.js exports 5 real, DB-backed
// createCrudService(...) objects (water budgets, quality readings,
// rainwater structures, watersheds, analytics) that had zero Express
// router wrapping them - a confirmed regression, not a fresh gap: git
// history shows waterManagementRoutes.js used to require() this exact
// service and was overwritten with a generic stub by a later batch-fix
// commit (a2beb556, 2026-09-10). waterRecordsRegistryRoutes.js wraps all
// 5 in a plain REST router (mounted at /api/water-records-registry,
// 2026-09-16), same pattern as the other *RegistryRoutes.js files added
// this session.

const express = require('express');
const request = require('supertest');

describe('waterRecordsRegistryRoutes.js - new CRUD wrapper for 5 water-records resources', () => {
  test('loads without throwing and registers 5 routes per resource (25 total)', () => {
    const router = require('../waterRecordsRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(25);
  });

  test.each([
    ['GET', '/api/water-records-registry/budgets'],
    ['GET', '/api/water-records-registry/quality-readings'],
    ['GET', '/api/water-records-registry/rainwater-structures'],
    ['GET', '/api/water-records-registry/watersheds'],
    ['GET', '/api/water-records-registry/analytics'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../waterRecordsRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/water-records-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
