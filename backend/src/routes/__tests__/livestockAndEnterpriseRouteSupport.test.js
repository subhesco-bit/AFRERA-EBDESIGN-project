'use strict';

// pigRoutes_merged.js, sheepRoutes_merged.js, poultryRoutes_merged.js,
// decisionSupportRoutes_merged.js and rfqRoutes_merged.js each called
// protectLivestockRouter(router) / protectRouter(router, {...}) at module
// load time, imported from routes/livestockRouteSupport.js and
// routes/enterpriseRouteSupport.js respectively. Both of those "support"
// files turned out to be auto-generated scaffold stubs - a plain
// health-check router, never a real function - so every one of these route
// files threw "protect{Livestock}Router is not a function" the moment it
// was required, and none of them were ever mounted in index.js.
//
// goatRoutes.js and animalHealthRoutes.js hit the identical bug earlier and
// already worked around it by skipping the call (both are live today at
// /api/goat and /api/animalhealth with real authMiddleware protection and
// no gap). This test locks in the same fix applied to the 5 files above
// (2026-09-15): they load cleanly, register their real routes, and an
// unauthenticated request is rejected by authMiddleware with 401 - not a
// 404, which is what "the route was never actually registered" looks like
// (the exact failure mode already found once this session in
// seedVaultRoutes_merged.js / unifiedAIRoutes_merged.js).

const express = require('express');
const request = require('supertest');

jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn(() => null),
}));

const { generateAccessToken } = require('../../services/dual-use/authService');

function mountedApp(routerPath, mountPath) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const router = require(routerPath);
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return { app, router };
}

function token() {
  return `Bearer ${generateAccessToken({ id: 'farmer-1', email: 'f@example.com', role: 'farmer' })}`;
}

describe('livestock/enterprise _merged route files - support-stub bug fix', () => {
  const cases = [
    { name: 'pigRoutes_merged', path: '../pigRoutes_merged.js', mount: '/api/pig', method: 'get', url: '/api/pig/herd' },
    { name: 'sheepRoutes_merged', path: '../sheepRoutes_merged.js', mount: '/api/sheep', method: 'get', url: '/api/sheep/flock' },
    { name: 'poultryRoutes_merged', path: '../poultryRoutes_merged.js', mount: '/api/poultry', method: 'get', url: '/api/poultry/flocks' },
    { name: 'decisionSupportRoutes_merged', path: '../decisionSupportRoutes_merged.js', mount: '/api/decisionsupport', method: 'post', url: '/api/decisionsupport/corp-credit-eligible' },
    { name: 'rfqRoutes_merged', path: '../rfqRoutes_merged.js', mount: '/api/rfq', method: 'post', url: '/api/rfq/rfq' },
  ];

  test.each(cases)('$name loads without throwing and registers real routes', ({ path }) => {
    expect(() => require(path)).not.toThrow();
    const router = require(path);
    const routeCount = router.stack.filter((l) => l.route).length;
    expect(routeCount).toBeGreaterThan(0);
  });

  test.each(cases)('$name rejects an unauthenticated $method $url with 401, not 404', async ({ path, mount, method, url }) => {
    const { app } = mountedApp(path, mount);
    const res = await request(app)[method](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });

  test.each(cases)('$name accepts a valid token past auth (no longer dead code)', async ({ path, mount, method, url }) => {
    const { app } = mountedApp(path, mount);
    const res = await request(app)[method](url).set('Authorization', token());
    // Past authMiddleware now - whatever the handler does next (DB lookups
    // fail cleanly since Postgres is mocked to null above), it must not be
    // a 401 (auth rejected) or 404 (route never registered).
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(404);
  });
});
