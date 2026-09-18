'use strict';

// services/legacy/marketIntelligenceService.js was never mounted
// anywhere. Unlike most services/legacy/*.js files it doesn't export a
// plain Express router - it exports a setupRoutes(app) function that
// mounts itself directly at /api/v1/market-intelligence, called from
// index.js for the first time (2026-09-15). This test locks in that the
// call actually registers real, auth-protected routes.

const express = require('express');
const request = require('supertest');

jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn(() => null),
}));

describe('marketIntelligenceService.setupRoutes() - mounted for the first time', () => {
  test('registers routes on the app and rejects an unauthenticated request with 401, not 404', async () => {
    const app = express();
    app.use(express.json());
    require('../../services/legacy/marketIntelligenceService.js').setupRoutes(app);

    const res = await request(app).post('/api/v1/market-intelligence/intelligence').send({ village_id: 'v1' });
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
