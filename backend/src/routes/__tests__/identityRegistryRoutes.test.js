'use strict';

// services/legacy/identityManagementService.js (a pre-existing file from
// before this session, "Phase 2 Auto-Implementation", 2026-09-04) has 6
// real, DB-backed resources (permissions, SSO providers, MFA devices,
// digital identities, consent records, and a hand-written admin view
// over the real `sessions` table) that had zero Express router wrapping
// them. identityRegistryRoutes.js wraps all 6 in a plain REST router
// (mounted at /api/identity-registry, 2026-09-16), same pattern as the
// other *RegistryRoutes.js files added this session. sessionManagement
// has no POST (sessions come from login, not manual creation - matching
// IdentityManagementPage.jsx's own backendNote and the absence of a
// "create" call in that tab).

const express = require('express');
const request = require('supertest');

describe('identityRegistryRoutes.js - new REST wrapper for 6 identity resources', () => {
  test('loads without throwing and registers the expected route count (5x5 CRUD + 4 for sessions = 29)', () => {
    const router = require('../identityRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(29);
  });

  test.each([
    ['GET', '/api/identity-registry/permissions'],
    ['POST', '/api/identity-registry/permissions'],
    ['GET', '/api/identity-registry/sso-providers'],
    ['POST', '/api/identity-registry/sso-providers'],
    ['GET', '/api/identity-registry/mfa-devices'],
    ['POST', '/api/identity-registry/mfa-devices'],
    ['GET', '/api/identity-registry/digital-identities'],
    ['POST', '/api/identity-registry/digital-identities'],
    ['GET', '/api/identity-registry/consent-records'],
    ['POST', '/api/identity-registry/consent-records'],
    ['GET', '/api/identity-registry/sessions'],
    ['PUT', '/api/identity-registry/sessions/some-id'],
    ['DELETE', '/api/identity-registry/sessions/some-id'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../identityRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/identity-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });

  test('sessions resource has no POST (create) route - sessions come from login, not manual creation', () => {
    const router = require('../identityRegistryRoutes.js');
    const sessionPostRoutes = router.stack.filter(
      (l) => l.route && l.route.path === '/sessions' && l.route.methods.post,
    );
    expect(sessionPostRoutes.length).toBe(0);
  });
});
