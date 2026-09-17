'use strict';

// aiGatewayRoutes_merged.js's own header comment says every route here is
// deliberately a 501 stub (this file was written against a multi-provider
// LLM router shape no real service implements - honest 501, not
// fabrication). The same stray-bare-CR masking bug already found and
// fixed twice elsewhere in this PR (platformCoreRoutes_merged.js,
// weatherRoutes_merged.js's dependency) meant none of the 7
// notImplemented()-wrapped router.X(...) calls ever actually ran - they
// were trapped inside notImplemented's own never-invoked function body,
// so this router had ZERO registered routes at all (worse than a 404:
// nothing here reached Express's router matching in the first place).
// Fixed (2026-09-16) by closing the function properly.

const express = require('express');
const request = require('supertest');

describe('aiGatewayRoutes_merged.js - notImplemented routes now actually register', () => {
  test('registers all 7 documented stub routes', () => {
    const router = require('../aiGatewayRoutes_merged.js');
    const routes = router.stack
      .filter((l) => l.route)
      .map((l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`);
    expect(routes).toHaveLength(7);
    expect(routes).toEqual(
      expect.arrayContaining([
        'POST /chat',
        'GET /statistics',
        'GET /providers',
        'GET /models/:provider',
        'PUT /providers/:provider/enable',
        'PUT /providers/:provider/disable',
        'POST /stream',
      ])
    );
  });

  test.each([
    ['POST', '/chat'],
    ['GET', '/statistics'],
    ['GET', '/providers'],
    ['GET', '/models/openai'],
    ['PUT', '/providers/openai/enable'],
    ['PUT', '/providers/openai/disable'],
    ['POST', '/stream'],
  ])('%s %s returns the honest 501 stub, not a 404', async (method, url) => {
    const router = require('../aiGatewayRoutes_merged.js');
    const app = express();
    app.use(express.json());
    app.use('/api/v1/ai-gateway', router);
    const res = await request(app)[method.toLowerCase()](`/api/v1/ai-gateway${url}`);
    expect(res.status).toBe(501);
    expect(res.body).toEqual(expect.objectContaining({ success: false, code: 'NOT_IMPLEMENTED' }));
  });
});
