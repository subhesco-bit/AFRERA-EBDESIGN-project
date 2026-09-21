'use strict';

// logisticsEnhancements_merged.js was already mounted at
// /api/logisticsenhancements and already covered fleet/tracking/
// temperature/warehouse endpoints for LogisticsEnhancementPage.jsx, but
// 3 of its ActionCards (recordDriverLocation/getActiveDrivers/
// getShipmentTrail) had no matching route even though
// logisticsEnhancementService.js already implemented all 3 real,
// DB-backed methods (driver_location table). Added the missing 3 routes
// (2026-09-16) rather than writing a new file, since this router was
// already real and mounted - only the gap needed closing.

const express = require('express');
const request = require('supertest');

describe('logisticsEnhancements_merged.js - added driver-location routes', () => {
  test('loads without throwing and registers 24 routes (21 pre-existing + 3 new)', () => {
    const router = require('../logisticsEnhancements_merged.js');
    expect(router.stack.filter((l) => l.route).length).toBe(24);
  });

  test.each([
    ['POST', '/api/logisticsenhancements/drivers/location'],
    ['GET', '/api/logisticsenhancements/drivers/active'],
    ['GET', '/api/logisticsenhancements/shipments/SH-1/trail'],
    // sanity: a pre-existing route on the same file still works
    ['GET', '/api/logisticsenhancements/fleet'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../logisticsEnhancements_merged.js');
    const app = express();
    app.use(express.json());
    app.use('/api/logisticsenhancements', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
