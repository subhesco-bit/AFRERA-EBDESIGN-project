'use strict';

// platformCoreRoutes_merged.js is already mounted at /api/platformcore
// (index.js) - a real, live bug: a stray CR line-terminator (not a CRLF,
// just a bare \r) between `res.status(501).json({...});` and the first
// `router.post('/initialize', ...)` call meant all 10 notImplemented()
// route registrations were silently swallowed inside the notImplemented
// function's own body, never executed at require time. Only the 5
// non-notImplemented routes (config GET/PUT, health, stats, optimizations)
// were ever actually registered - the other 9 endpoints 404'd instead of
// returning the intended 501 "not implemented". Fixed (2026-09-16) by
// closing the function properly and moving the registrations out of it.

const express = require('express');
const request = require('supertest');

describe('platformCoreRoutes_merged.js - notImplemented routes now actually register', () => {
  test('registers all 15 routes (5 real + 10 honest-501 stubs)', () => {
    const router = require('../platformCoreRoutes_merged.js');
    const routes = router.stack
      .filter((l) => l.route)
      .map((l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`);
    expect(routes).toHaveLength(15);
    expect(routes).toEqual(
      expect.arrayContaining([
        'GET /config',
        'PUT /config/:key',
        'GET /health',
        'GET /stats',
        'GET /optimizations',
        'POST /initialize',
        'GET /scaling/recommendations',
        'GET /capacity/predict',
        'POST /disaster-recovery',
        'GET /performance/monitor',
        'POST /self-healing',
        'GET /configuration/optimized',
        'POST /configuration/apply',
        'GET /metrics',
        'GET /state',
      ])
    );
  });

  test.each([
    ['POST', '/initialize'],
    ['GET', '/scaling/recommendations'],
    ['GET', '/capacity/predict'],
    ['POST', '/disaster-recovery'],
    ['GET', '/performance/monitor'],
    ['POST', '/self-healing'],
    ['GET', '/configuration/optimized'],
    ['POST', '/configuration/apply'],
    ['GET', '/metrics'],
    ['GET', '/state'],
  ])('%s %s is reachable (never 404, no longer swallowed)', async (method, url) => {
    const router = require('../platformCoreRoutes_merged.js');
    const app = express();
    app.use(express.json());
    app.use('/api/platformcore', router);
    const res = await request(app)[method.toLowerCase()](`/api/platformcore${url}`);
    expect(res.status).not.toBe(404);
  });
});
