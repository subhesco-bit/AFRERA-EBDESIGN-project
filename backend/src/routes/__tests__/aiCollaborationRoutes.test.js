'use strict';

// aiCollaborationRoutes.js is already mounted live at /api/aicollaboration
// (index.js) - this is the Devin-Claude handoff API (shared context,
// work logging, handoff create/accept, pending handoffs, stats, report)
// the .ai/AGENT_PROTOCOL.md collaboration protocol is built around. A
// missing `};` after `ensureClaudeConfigured`'s `next();` left every
// statement after it - the handoffLimiter definition, both
// `router.use(...)` calls, and all 10 route registrations - trapped
// inside that middleware function's own never-invoked body. The router
// had ZERO registered routes and ZERO registered middleware at all
// (confirmed via a direct `router.stack` check before this fix: length
// 0). Fixed (2026-09-16) by closing the function properly.

const express = require('express');
const request = require('supertest');

describe('aiCollaborationRoutes.js - was silently registering nothing at all', () => {
  test('registers all 10 documented routes plus 2 middleware (auth + Claude-config check)', () => {
    const router = require('../aiCollaborationRoutes.js');
    const routeEntries = router.stack.filter((l) => l.route);
    const middlewareEntries = router.stack.filter((l) => !l.route);
    const routes = routeEntries.map((l) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`);

    expect(middlewareEntries).toHaveLength(2);
    expect(routes).toHaveLength(10);
    expect(routes).toEqual(
      expect.arrayContaining([
        'GET /context',
        'PUT /context',
        'POST /log-work',
        'GET /work-history/:aiSource',
        'GET /continuable/:currentAI',
        'POST /handoff',
        'POST /handoff/:handoffId/accept',
        'GET /handoffs/pending/:forAI',
        'GET /stats',
        'GET /report',
      ])
    );
  });

  test.each([
    ['GET', '/context'],
    ['PUT', '/context'],
    ['POST', '/log-work'],
    ['GET', '/work-history/claude'],
    ['GET', '/continuable/claude'],
    ['POST', '/handoff'],
    ['POST', '/handoff/1/accept'],
    ['GET', '/handoffs/pending/claude'],
    ['GET', '/stats'],
    ['GET', '/report'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../aiCollaborationRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/aicollaboration', router);
    const res = await request(app)[method.toLowerCase()](`/api/aicollaboration${url}`);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
