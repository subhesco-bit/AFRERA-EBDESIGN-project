'use strict';

// landRecordsRoutes.js was already real and already mounted at
// /api/landrecords (index.js, since 2026-08-29) but had no test and no
// frontend client - farmerPortalAPI.getLandRecords()/addLandRecord()/
// syncGovernmentLandRecords() on LandRecords.jsx resolved to nothing
// (MISSING_EXPORT build error) until wired in componentApi.js (2026-09-16).

const express = require('express');
const request = require('supertest');

describe('landRecordsRoutes.js - already mounted, now has a frontend client', () => {
  test.each([
    ['GET', '/api/landrecords'],
    ['POST', '/api/landrecords'],
    ['POST', '/api/landrecords/sync-government'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../landRecordsRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/landrecords', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });

  test('GET /api/landrecords/regional-statistics reaches a real handler (no auth required)', async () => {
    const router = require('../landRecordsRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/landrecords', router);
    const res = await request(app).get('/api/landrecords/regional-statistics');
    expect(res.status).not.toBe(404);
  });
});
