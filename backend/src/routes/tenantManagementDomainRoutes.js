/**
 * Real backend routes for OrganizationTenantManagementPage.jsx's tenant
 * tab, backed by services/legacy/tenantManagementService.js. Exact 1:1
 * name matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/tenantManagementService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/tenant-management/tenants', wrap((req) => svc.getAllTenants(req.query)));
router.post('/tenant-management/tenant', wrap((req) => svc.createTenant(req.body)));
router.delete('/tenant-management/tenant/:id', wrap((req) => svc.deleteTenant(req.params.id)));

module.exports = router;
