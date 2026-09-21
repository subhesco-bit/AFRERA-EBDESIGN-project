'use strict';

// services/legacy/operationsManagementService.js exports 8 real, DB-backed
// createCrudService(...) objects (farm activities, tasks, contractors,
// machinery operations, equipment schedules, input consumption,
// productivity metrics, dashboard KPIs) that had zero Express router
// wrapping them. operationsRegistryRoutes.js wraps all 8 in a plain REST
// router (mounted at /api/operations-registry, 2026-09-16), same pattern
// as livestockRegistryRoutes.js/fisheriesRegistryRoutes.js. Distinct from
// the pre-existing, still-dead operationsManagementRoutes.js stub at
// /api/operationsmanagement - not touched here.

const express = require('express');
const request = require('supertest');

describe('operationsRegistryRoutes.js - new CRUD wrapper for 8 operations resources', () => {
  test('loads without throwing and registers 5 routes per resource (40 total)', () => {
    const router = require('../operationsRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(40);
  });

  test.each([
    ['GET', '/api/operations-registry/activities'],
    ['GET', '/api/operations-registry/tasks'],
    ['GET', '/api/operations-registry/contractors'],
    ['GET', '/api/operations-registry/machinery-operations'],
    ['GET', '/api/operations-registry/equipment-schedules'],
    ['GET', '/api/operations-registry/input-consumption'],
    ['GET', '/api/operations-registry/productivity-metrics'],
    ['GET', '/api/operations-registry/dashboard-kpis'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../operationsRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/operations-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
