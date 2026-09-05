/**
 * Routes for the Identity-domain resources - see
 * backend/src/services/identityManagementService.js. Mounted at flat
 * prefixes in index.js matching frontend/src/services/api.js exactly.
 * Gated with PLATFORM_STAFF_ROLES (admin-only), not FARM_OPERATIONS_ROLES:
 * roles/permissions/SSO/MFA/digital-identity/consent/sessions are platform
 * security configuration, not agronomic records.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../middleware/roleGroups');
const {
  permissionManagement, ssoManagement, mfaManagement, digitalIdentity,
  consentManagement, sessionManagement,
} = require('../services/legacy/identityManagementService');

function crudRouter(service) {
  const router = express.Router();
  router.get('/', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
    try { res.json({ success: true, data: (await service.list(req.query)).items }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  router.get('/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  router.post('/', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
    try { res.status(201).json({ success: true, data: await service.create(req.body) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.put('/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
    try {
      let item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.delete('/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  return router;
}

// Sessions are created by login, not an admin form - list/get/terminate/delete only.
const sessionRouter = express.Router();
sessionRouter.get('/', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try { res.json({ success: true, data: await sessionManagement.list(req.query) }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
sessionRouter.get('/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    let item = await sessionManagement.get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
sessionRouter.put('/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    let item = await sessionManagement.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
sessionRouter.delete('/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    let ok = await sessionManagement.remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = {
  permissionManagementRoutes: crudRouter(permissionManagement),
  ssoRoutes: crudRouter(ssoManagement),
  mfaManagementRoutes: crudRouter(mfaManagement),
  digitalIdentityRoutes: crudRouter(digitalIdentity),
  consentManagementRoutes: crudRouter(consentManagement),
  sessionManagementRoutes: sessionRouter,
};
