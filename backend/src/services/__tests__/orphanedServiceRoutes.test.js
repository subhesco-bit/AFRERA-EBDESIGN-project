'use strict';

// Investigation trail: routes/ORPHANED_SERVICES_MOUNT.js exists to solve
// "services with a real setupRoutes(app) that never got called" - but
// passes a sub-router where the code expects the real app, so its routes
// end up double-prefixed and unreachable (verified: GET
// /api/v1/subsidy/schemes 404s but GET
// /api/orphaned_services_mount/api/v1/subsidy/schemes reaches a real
// handler). That looked like a live-blocking bug at first, but the real
// startup sequence (index.js) also runs
// core/dynamicServiceLoader.js's mountServiceRoutes(app), which discovers
// every services/**/*.js file and calls setupRoutes(app) correctly -
// making ORPHANED_SERVICES_MOUNT.js redundant dead weight, not an actual
// blocker. This test exercises that real mechanism directly (not the
// broken one) to lock in which services are genuinely reachable.
//
// Separately found: mountServiceRoutes discovers files by base filename
// in a Map, so multiple files sharing a name (there are dozens across
// this codebase - services/X.js, services/domain/X.js,
// services/legacy/X.js) silently overwrite each other depending on
// directory-walk order, independent of which one is "correct" or most
// complete (core/dynamicServiceLoader.js's _registerService() actually
// keeps the FIRST-discovered file and skips later duplicates - directory
// walk order is filesystem-dependent either way, so the winner can't be
// predicted from the file list alone). subsidyService and several others
// have this duplication; for subsidy the winning file
// (services/finance/subsidyService.js) happens to have the same
// endpoints as services/legacy/subsidyService.js, so it works.
//
// (2026-09-16) governmentSchemeService, aiAdvisoryService,
// buyingClubService, procurementSubscriptionService,
// renewableEnergyService and ruralEnterpriseService had this same
// problem - the winning file was missing endpoints (or, for
// buyingClubService, was a re-export shim whose own source text didn't
// literally contain "setupRoutes", so the loader's naive text-scan
// skipped it) that only existed in their services/legacy/*.js
// counterpart. Rather than re-key the whole loader's discovery (a much
// larger, riskier change touching all 313 discovered services), each
// case was fixed individually:
//  - buyingClubService.js (the flat re-export shim) got a comment added
//    that literally contains the word "setupRoutes", which is all the
//    naive text-scan needs to recognize it and correctly mount the
//    legacy module it already delegates to - not a behavior change.
//  - aiAdvisoryService/procurementSubscriptionService/
//    renewableEnergyService/ruralEnterpriseService/governmentSchemeService
//    each have their losing services/legacy/*.js counterpart's
//    setupRoutes(app) called directly in index.js (same pattern already
//    used for marketIntelligenceService.js/villageProfileService.js) -
//    verified none of these collide with what the Map-winning file
//    already serves (either a distinct URL prefix entirely, or the same
//    prefix with non-overlapping sub-paths).
// See .ai/tasks/AGENT_ASSIGNMENTS.md and
// .ai/tasks/2026-09-15-nextgen-vision-todo.md's thirty-second and
// thirty-fifth updates for the full writeup.

const express = require('express');
const request = require('supertest');
const path = require('path');
const DynamicServiceLoader = require('../../core/dynamicServiceLoader');

async function mountAllServices() {
  const app = express();
  app.use(express.json());
  const loader = new DynamicServiceLoader(null);
  const servicesDir = path.join(__dirname, '..', '..', 'services');
  await loader.discoverServicesFromDirectory(servicesDir);
  await loader.mountServiceRoutes(app);

  // Mirror the additive direct setupRoutes(app) calls in index.js for the
  // 5 duplicate-filename-shadowed legacy services (this loader-only path
  // can't reach them - they're wired independently of the Map).
  require(path.join(servicesDir, 'legacy', 'aiAdvisoryService.js')).setupRoutes(app);
  require(path.join(servicesDir, 'legacy', 'procurementSubscriptionService.js')).setupRoutes(app);
  require(path.join(servicesDir, 'legacy', 'renewableEnergyService.js')).setupRoutes(app);
  require(path.join(servicesDir, 'legacy', 'ruralEnterpriseService.js')).setupRoutes(app);
  require(path.join(servicesDir, 'legacy', 'governmentSchemeService.js')).setupRoutes(app);

  return app;
}

describe('orphaned setupRoutes() services - real mounting mechanism (dynamicServiceLoader), not ORPHANED_SERVICES_MOUNT.js', () => {
  let app;

  beforeAll(async () => {
    app = await mountAllServices();
  }, 30000);

  test.each([
    ['GET', '/api/v1/subsidy/schemes'],
    ['POST', '/api/v1/subsidy/apply'],
    ['GET', '/api/v1/government/weather/alerts'],
    ['GET', '/api/v1/government/announcements'],
    ['GET', '/api/v1/government/csr/opportunities'],
    ['GET', '/api/v1/pre-season/dashboard'],
    ['POST', '/api/v1/pre-season/orders'],
    ['GET', '/api/v1/shared-infra/assets/search'],
    ['POST', '/api/v1/shared-infra/assets/register'],
    // 2026-09-16: previously a confirmed duplicate-filename shadowing gap
    // (404) - now reachable via the direct legacy setupRoutes(app) calls
    // mirrored above.
    ['GET', '/api/v1/government/schemes/registry'],
    ['GET', '/api/v1/government/schemes/registry/expiring'],
    ['GET', '/api/v1/ai-advisories/advisories/statistics'],
    ['GET', '/api/v1/procurement-subscriptions/subscriptions/statistics'],
    ['GET', '/api/v1/renewable-energy/systems/statistics'],
    ['GET', '/api/v1/rural-enterprises/enterprises/statistics'],
    ['GET', '/api/v1/buying-clubs/clubs/statistics'],
  ])('%s %s reaches a real handler (never 404)', async (method, url) => {
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
  });

  test('the Map-winning renewable-energy route (GET /) still works alongside the additively-mounted legacy sub-paths', async () => {
    const res = await request(app).get('/api/v1/renewable-energy/');
    expect(res.status).not.toBe(404);
  });
});
