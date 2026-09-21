/**
 * Real backend routes for EnterpriseIntegrationPage.jsx, backed by
 * services/enterpriseIntegrationService.js. getCurrentOrganizationIntegrations
 * -> getOrganizationIntegrations(organizationId), organizationId filled
 * from the authenticated user. getSystemStatus, which the page also
 * calls, has no implementation anywhere - not wired.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/enterpriseIntegrationService');

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

router.get('/enterprise-integration/current', wrap((req) => svc.getOrganizationIntegrations(req.user?.organizationId)));
router.get('/enterprise-integration/health/:integrationId', wrap((req) => svc.getIntegrationHealth(req.params.integrationId)));

module.exports = router;
