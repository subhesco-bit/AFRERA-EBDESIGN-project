'use strict';

// roleManagementRoutes.js was already mounted at /api/rolemanagement
// (index.js), but rolePermissionAPI.listRoles/createRole on
// RolePermissionPage.jsx pointed nowhere until wired against this real
// path in api.js (2026-09-16) - the page's own comment claiming
// "/api/v1/roles" was stale/wrong (verified: that path doesn't exist
// anywhere). This locks in that GET/POST reach the real handler, which
// requires both authMiddleware and requirePermission('read_roles' /
// 'create_roles') - so an unauthenticated request 401s before the
// permission check ever runs.

const express = require('express');
const request = require('supertest');

describe('roleManagementRoutes.js - real endpoint behind rolePermissionAPI.listRoles/createRole', () => {
  test.each([
    ['GET', '/api/rolemanagement'],
    ['POST', '/api/rolemanagement'],
  ])('rejects an unauthenticated %s %s with 401, not 404', async (method, url) => {
    const router = require('../roleManagementRoutes.js');
    const app = express();
    app.use(express.json());
    app.use('/api/rolemanagement', router);
    const res = await request(app)[method.toLowerCase()](url);
    expect(res.status).not.toBe(404);
    expect(res.status).toBe(401);
  });
});
