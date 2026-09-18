'use strict';

// publicDataRoutes.js used to be a dead "Route operational" scaffold
// with no connection to services/publicDataExtractorService.js at all,
// even though that service already had real, DB-backed (public_data_sources/
// public_data_extraction_runs/public_data_records tables) listSources/
// registerSource/extractDataset methods matching
// PublicDataExtractorPage.jsx's publicDataAPI.listSources()/
// .registerSource()/.extract() calls. Rewritten (2026-09-16) to
// actually route to it.

const express = require('express');
const request = require('supertest');

describe('publicDataRoutes.js - wired to the previously-orphaned service', () => {
  test('loads without throwing and registers 3 real routes', () => {
    const router = require('../publicDataRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(3);
  });

  test.each([
    ['GET', '/api/publicdata/sources'],
    ['POST', '/api/publicdata/sources'],
    ['POST', '/api/publicdata/sources/src-1/extract'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../publicDataRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/publicdata', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
