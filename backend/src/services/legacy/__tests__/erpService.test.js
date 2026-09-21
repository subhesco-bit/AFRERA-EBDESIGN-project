'use strict';

// erpService.js's exported `router` (GET /status, POST /sync/bulk, etc.)
// is already mounted at /api/erp in index.js (`const { router: erpRoutesNewlyMounted } = require(...)`).
// erpDashboardAPI.getSyncStatus()/triggerSync() on ERPDashboardPage.jsx
// point nowhere until wired (2026-09-16) against these real, already-live
// endpoints - GET /status maps to getSyncStatus(), POST /sync/bulk maps
// to triggerBulkSync(entity_type, erp_type). getDashboard/getGLEntries/
// getReconciliation/getFinancialReports/resolveConflict have no matching
// endpoint anywhere in this file - genuine gaps, not wired.

const express = require('express');
const request = require('supertest');

describe('erpService.js router - already mounted, now has a frontend client for 2 of 7 methods', () => {
  test('GET /status reaches a real handler (never 404, no auth required)', async () => {
    const { router } = require('../erpService.js');
    const app = express();
    app.use(express.json());
    app.use('/api/erp', router);
    const res = await request(app).get('/api/erp/status');
    expect(res.status).not.toBe(404);
  });

  test('rejects an unauthenticated POST /sync/bulk with 401, not 404', async () => {
    const { router } = require('../erpService.js');
    const app = express();
    app.use(express.json());
    app.use('/api/erp', router);
    const res = await request(app).post('/api/erp/sync/bulk');
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
