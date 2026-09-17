'use strict';

// labourRoutes.js was never mounted anywhere in index.js, and separately
// had the same silent route-registration bug found 3 times already this
// session (seedVaultRoutes_merged.js, unifiedAIRoutes_merged.js,
// trackDartRoutes_merged.js): a lone CR sat where handle()'s closing
// brace and the ';' ending its const declaration should have been, so
// every router.*() call below ran as dead code inside handle()'s own
// catch block instead of at module scope. node -c and require() both
// stayed silent about it - only a live request would have caught it, and
// nothing had made one since the file was never mounted. Fixed
// (2026-09-15) and mounted at /api/labour; this test locks in real route
// registration and real auth enforcement.

const express = require('express');
const request = require('supertest');

jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn(() => null),
}));

describe('labourRoutes.js - silent route-registration bug fix', () => {
  test('loads without throwing and registers all 7 real routes', () => {
    const router = require('../labourRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(7);
  });

  test('rejects an unauthenticated GET /workers with 401, not 404', async () => {
    const router = require('../labourRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/labour', router);
    const res = await request(app).get('/api/labour/workers');
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
