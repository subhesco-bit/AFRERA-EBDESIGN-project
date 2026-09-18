'use strict';

// farmerTrainingRoutes.js was a 38-line 'Route operational' scaffold;
// farmerTrainingRoutes_merged.js is the real training-program/carbon-
// footprint/FOLU-compliance implementation sitting unmounted next to it
// (routes/agriculture/farmerTrainingRoutes.js is a third, separate
// generic-CRUD file - not this one). Swapped in at /api/farmertraining
// (2026-09-15). This test locks in real route registration and real
// auth enforcement.

const express = require('express');
const request = require('supertest');

describe('farmerTrainingRoutes_merged.js - scaffold swap', () => {
  test('loads without throwing and registers real routes', () => {
    const router = require('../farmerTrainingRoutes_merged.js');
    expect(router.stack.filter((l) => l.route).length).toBeGreaterThan(0);
  });

  test('rejects an unauthenticated POST /register with 401, not 404', async () => {
    const router = require('../farmerTrainingRoutes_merged.js');
    const app = express();
    app.use(express.json());
    app.use('/api/farmertraining', router);
    const res = await request(app).post('/api/farmertraining/register').send({});
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
