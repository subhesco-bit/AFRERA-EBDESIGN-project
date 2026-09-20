'use strict';

// services/legacy/fisheriesManagementService.js exports 9 real, DB-backed
// createCrudService(...) objects (biofloc tanks, hatcheries, feed logs,
// water quality, health records, harvests, processing batches, cold-chain
// shipments, analytics) that had zero Express router wrapping them.
// fisheriesRegistryRoutes.js wraps all 9 in a plain REST router (mounted
// at /api/fisheries-registry, 2026-09-16), same pattern as
// livestockRegistryRoutes.js.

const express = require('express');
const request = require('supertest');

describe('fisheriesRegistryRoutes.js - new CRUD wrapper for 9 fisheries resources', () => {
  test('loads without throwing and registers 5 routes per resource (45 total)', () => {
    const router = require('../fisheriesRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(45);
  });

  test.each([
    ['GET', '/api/fisheries-registry/biofloc-tanks'],
    ['GET', '/api/fisheries-registry/hatcheries'],
    ['GET', '/api/fisheries-registry/feed-logs'],
    ['GET', '/api/fisheries-registry/water-quality'],
    ['GET', '/api/fisheries-registry/health-records'],
    ['GET', '/api/fisheries-registry/harvests'],
    ['GET', '/api/fisheries-registry/processing-batches'],
    ['GET', '/api/fisheries-registry/cold-chain-shipments'],
    ['GET', '/api/fisheries-registry/analytics'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../fisheriesRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/fisheries-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
