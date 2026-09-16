'use strict';

// platformTelemetryRoutes.js used to be a dead "Route operational"
// scaffold with no connection to controllers/platformTelemetryController.js
// at all, even though that controller (backed by services/legacy/
// platformTelemetryService.js's real getSystemMetrics/getServiceHealth/
// getPlatformAnalytics) already existed and worked - it was simply an
// orphaned controller nobody wired to a route (not a duplicate-filename
// shadowing case, and not fixed via a new *RegistryRoutes.js file since
// this is a controller/service pair, not a createCrudService object).
// Rewritten (2026-09-16) to actually route to it, matching
// PlatformManagementPage.jsx's platformTelemetryAPI.getStatus()/
// .getAnalytics() calls.

const express = require('express');
const request = require('supertest');

describe('platformTelemetryRoutes.js - wired to the previously-orphaned controller', () => {
  test('loads without throwing and registers 2 real routes', () => {
    const router = require('../platformTelemetryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(2);
  });

  test.each([
    ['GET', '/api/platformtelemetry/status'],
    ['GET', '/api/platformtelemetry/analytics'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../platformTelemetryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/platformtelemetry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
