'use strict';

// platformConfigurationRoutes.js used to be a dead "Route operational"
// scaffold with no connection to services/legacy/platformConfigurationService.js
// at all, even though that service already had real, DB-backed
// (platform_configurations table) getOptimizedRecommendations/
// applyOptimizedConfiguration methods matching
// PlatformFoundationPage.jsx's platformConfigurationAPI.getRecommendations()/
// .applyConfiguration() calls exactly (allowing for the naming
// difference - mapped at the route layer). Rewritten (2026-09-16) to
// actually route to it.

const express = require('express');
const request = require('supertest');

describe('platformConfigurationRoutes.js - wired to the previously-orphaned service', () => {
  test('loads without throwing and registers 2 real routes', () => {
    const router = require('../platformConfigurationRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(2);
  });

  test.each([
    ['GET', '/api/platformconfiguration/recommendations'],
    ['POST', '/api/platformconfiguration/apply'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../platformConfigurationRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/platformconfiguration', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
