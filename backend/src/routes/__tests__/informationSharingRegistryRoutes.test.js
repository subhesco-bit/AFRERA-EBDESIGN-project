'use strict';

// services/legacy/informationSharingService.js is a real, complete
// in-memory service (documents, folders, permissions, sharing links,
// collaboration sessions, AI recommendations, activity logs, analytics,
// health) matching InformationSharingPage.jsx's ~20 ActionCard calls
// almost exactly, but had zero Express router - neither the dead
// routes/informationSharingRoutes.js stub nor the much thinner generic
// routes/platform/informationSharingRoutes_merged.js CRUD scaffold
// connect to it. informationSharingRegistryRoutes.js wraps every real
// method (mounted at /api/information-sharing-registry, 2026-09-16).

const express = require('express');
const request = require('supertest');

describe('informationSharingRegistryRoutes.js - new wrapper for the real in-memory service', () => {
  test('loads without throwing and registers 22 routes', () => {
    const router = require('../informationSharingRegistryRoutes.js');
    expect(router.stack.filter((l) => l.route).length).toBe(22);
  });

  test.each([
    ['GET', '/api/information-sharing-registry/documents'],
    ['GET', '/api/information-sharing-registry/documents/search'],
    ['GET', '/api/information-sharing-registry/documents/doc-001'],
    ['POST', '/api/information-sharing-registry/documents'],
    ['PUT', '/api/information-sharing-registry/documents/doc-001'],
    ['DELETE', '/api/information-sharing-registry/documents/doc-001'],
    ['GET', '/api/information-sharing-registry/folders'],
    ['GET', '/api/information-sharing-registry/folders/tree'],
    ['POST', '/api/information-sharing-registry/folders'],
    ['GET', '/api/information-sharing-registry/permissions'],
    ['GET', '/api/information-sharing-registry/permissions/check'],
    ['POST', '/api/information-sharing-registry/permissions'],
    ['POST', '/api/information-sharing-registry/sharing-links'],
    ['GET', '/api/information-sharing-registry/sharing-links/access'],
    ['GET', '/api/information-sharing-registry/collaboration-sessions'],
    ['POST', '/api/information-sharing-registry/collaboration-sessions'],
    ['POST', '/api/information-sharing-registry/collaboration-sessions/s1/join'],
    ['POST', '/api/information-sharing-registry/collaboration-sessions/s1/end'],
    ['POST', '/api/information-sharing-registry/ai-recommendations'],
    ['GET', '/api/information-sharing-registry/activity-logs'],
    ['GET', '/api/information-sharing-registry/analytics'],
    ['GET', '/api/information-sharing-registry/health-status'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../informationSharingRegistryRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/information-sharing-registry', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
