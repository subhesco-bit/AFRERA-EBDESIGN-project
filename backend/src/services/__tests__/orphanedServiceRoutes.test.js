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
// complete. subsidyService, governmentSchemeService and several others
// have this duplication; for subsidy the winning file
// (services/finance/subsidyService.js) happens to have the same
// endpoints as services/legacy/subsidyService.js, so it works. For
// governmentSchemeService, aiAdvisoryService, buyingClubService,
// procurementSubscriptionService, renewableEnergyService and
// ruralEnterpriseService, the winning file is missing endpoints (or, for
// buyingClubService, is a re-export shim the loader's text-scan doesn't
// recognize as having setupRoutes at all) that only exist in their
// services/legacy/*.js counterpart - those specific endpoints are
// genuinely unreachable right now. See
// .ai/tasks/2026-09-15-nextgen-vision-todo.md's thirty-second update for
// the full writeup; not fixed here (a real architectural fix - keying
// discovery by full path, or renaming/removing the losing duplicates -
// is out of scope for a wiring pass).

const express = require('express');
const request = require('supertest');
const path = require('path');
const DynamicServiceLoader = require('../../core/dynamicServiceLoader');

async function mountAllServices() {
  const app = express();
  app.use(express.json());
  const loader = new DynamicServiceLoader(null);
  await loader.discoverServicesFromDirectory(path.join(__dirname, '..', '..', 'services'));
  await loader.mountServiceRoutes(app);
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
  ])('%s %s reaches a real handler (never 404)', async (method, url) => {
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
  });

  test.each([
    ['GET', '/api/v1/government/schemes/registry'],
    ['GET', '/api/v1/government/schemes/registry/expiring'],
  ])('%s %s is a confirmed duplicate-filename shadowing gap (404, not fabricated as working)', async (method, url) => {
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).toBe(404);
  });
});
