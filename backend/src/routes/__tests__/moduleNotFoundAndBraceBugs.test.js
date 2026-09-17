'use strict';

// Second sweep of the 65 previously-unmounted _merged.js route files this
// backlog hadn't checked yet. Most were still scaffold-sized (skipped, same
// heuristic as every earlier pass); a few substantial ones threw real
// errors at load time - each is a genuinely different bug shape, not a
// repeat of the earlier "protectLivestockRouter" pattern:
//
// - agriculture/agriculturalIntelligenceRoutes_merged.js's dependency,
//   services/agriculture/agriculturalIntelligenceService.js, required
//   '../ai/aiGatewayService' - no such directory exists. Fixed to
//   '../legacy/aiGatewayService', the file whose predict()/analyze()/
//   recommend()/optimize()/healthCheck() API this service actually calls
//   (the non-legacy services/aiGatewayService.js exports a completely
//   different {run, buildGovernedPrompt, ...} shape and has none of those
//   methods). This route file turned out to be an exact duplicate of the
//   already-mounted routes/agriculturalIntelligenceRoutes.js though (same
//   endpoints, same handlers) - not mounted a second time, but the service
//   fix is real and correct regardless of which route file calls it.
// - platform/civilDisruptionRoutes_merged.js required
//   '../../services/platform/civilDisruptionService' - no such path (no
//   services/platform/ prefix on this one). Fixed to
//   '../../services/civilDisruptionService', matching the file's own
//   header comment. Also an exact duplicate of an already-mounted flat
//   route file - not mounted a second time.
// - platform/experienceRoutes_merged.js had a second, unused
//   `authenticate` import at the wrong relative depth
//   ('../middleware/auth' instead of '../../middleware/auth'). Removed
//   (dead code - authMiddleware, correctly imported one line above, is
//   what's actually used). Also an exact duplicate of an already-mounted
//   flat route file.
// - platform/governanceModule_merged.js imported `authRateLimit` from
//   middleware/rateLimiter.js, which has never exported anything by that
//   name (only authLimiter, a 5-req/15-min brute-force-login limiter with
//   the wrong semantics for these endpoints, and apiLimiter, the general
//   limiter used elsewhere). Threw "Route.post() requires a callback
//   function but got a [object Undefined]" the moment Express tried to
//   register a route with it. Fixed narrowly by aliasing apiLimiter to the
//   authRateLimit name inside this one file. This one was a real scaffold
//   swap (its flat sibling, routes/governanceModule.js, really was a
//   20-line placeholder) - mounted at /api/governancemodule.
// - trackDartRoutes_merged.js had the exact seedVaultRoutes_merged.js/
//   unifiedAIRoutes_merged.js bug shape: a lone CR instead of a real
//   newline+brace after trackOneKey()'s closing return, stranding its one
//   route inside that function's body. Fixed the same way. Also a real
//   scaffold swap - mounted at /api/trackdart.
//
// serverManagementRoutes_merged.js is a different kind of find: it loaded
// fine (no bug), but had zero auth middleware at all for real server
// provisioning/scaling/backup/deletion endpoints. Added authMiddleware +
// adminMiddleware before mounting - see that file's own header comment.

const express = require('express');
const request = require('supertest');

jest.mock('../../database/connection', () => ({
  getPostgreSQL: jest.fn(() => null),
}));

describe('module-not-found and missing-brace bugs found in the second _merged.js sweep', () => {
  test('agriculturalIntelligenceService.js no longer throws requiring aiGatewayService', () => {
    expect(() => require('../../services/agriculture/agriculturalIntelligenceService.js')).not.toThrow();
  });

  test('civilDisruptionRoutes_merged.js no longer throws requiring civilDisruptionService', () => {
    expect(() => require('../platform/civilDisruptionRoutes_merged.js')).not.toThrow();
  });

  test('experienceRoutes_merged.js no longer throws (dead wrong-path import removed)', () => {
    expect(() => require('../platform/experienceRoutes_merged.js')).not.toThrow();
  });

  const mountedCases = [
    { name: 'governanceModule_merged', path: '../platform/governanceModule_merged.js', mount: '/api/governancemodule', method: 'get', url: '/api/governancemodule/villages' },
    { name: 'trackDartRoutes_merged', path: '../trackDartRoutes_merged.js', mount: '/api/trackdart', method: 'get', url: '/api/trackdart?keys=abc' },
    { name: 'serverManagementRoutes_merged', path: '../serverManagementRoutes_merged.js', mount: '/api/servermanagement', method: 'get', url: '/api/servermanagement/servers' },
  ];

  test.each(mountedCases)('$name loads and registers real routes', ({ path }) => {
    const router = require(path);
    expect(router.stack.filter((l) => l.route).length).toBeGreaterThan(0);
  });

  test.each(mountedCases)('$name rejects an unauthenticated request with 401, not 404', async ({ path, mount, method, url }) => {
    const router = require(path);
    const app = express();
    app.use(express.json());
    app.use(mount, router);
    const res = await request(app)[method](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
