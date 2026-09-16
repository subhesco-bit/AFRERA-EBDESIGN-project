'use strict';

// services/legacy/villageProfileService.js was never mounted anywhere,
// and separately had a real route-shadowing bug: GET /villages/search was
// registered after GET /villages/:villageId, so Express (which matches
// routes in registration order) would swallow every search request into
// the param route instead, with villageId literally set to the string
// "search" - the exact same bug shape already found and fixed in
// productService.js's GET /search earlier this session. Fixed by moving
// /villages/search's registration before /villages/:villageId, and
// mounted for the first time via its setupRoutes(app) pattern
// (2026-09-15).

const express = require('express');

describe('villageProfileService.setupRoutes() - route-shadowing bug fix', () => {
  test('mounts at /api/v1/village-profiles with /villages/search registered before /villages/:villageId', () => {
    const app = express();
    require('../../services/legacy/villageProfileService.js').setupRoutes(app);

    const layer = app._router.stack.find(
      (l) => l.name === 'router' && l.regexp.test('/api/v1/village-profiles/x'),
    );
    expect(layer).toBeDefined();

    const getRoutes = layer.handle.stack
      .filter((l) => l.route && l.route.methods.get)
      .map((l) => l.route.path);

    const searchIndex = getRoutes.indexOf('/villages/search');
    const paramIndex = getRoutes.indexOf('/villages/:villageId');

    expect(searchIndex).toBeGreaterThanOrEqual(0);
    expect(paramIndex).toBeGreaterThanOrEqual(0);
    // This ordering is the whole fix - if it regresses, /villages/search
    // silently stops working again with no error, exactly like before.
    expect(searchIndex).toBeLessThan(paramIndex);
  });
});
