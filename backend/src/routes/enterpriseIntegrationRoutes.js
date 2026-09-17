/**
 * enterprise Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'enterpriseIntegrationRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'enterpriseIntegrationRoutes'
  });
});

// 2026-09-17: found while auditing EnterpriseIntegrationPage.jsx's
// enterpriseIntegrationAPI (getCurrentOrganizationIntegrations/
// getIntegrationHealth/getSystemStatus) against api.js - none of those
// methods existed. Traced the real backend: services/enterpriseIntegrationService.js
// is a genuine, 885-line, DB-backed (enterprise_integrations,
// integration_sync_logs tables, migration 072_tier1_m025_m030_schema.sql)
// service with getOrganizationIntegrations(organizationId) and
// getIntegrationHealth(integrationId) matching this page almost exactly -
// it just had no route file at all (this file, already mounted at
// /api/enterpriseintegration, was the "Route operational" scaffold in
// front of it). "Current organization" is resolved from
// req.user.organization_id, the same JWT claim authMiddleware already
// populates elsewhere (middleware/auth.js) - not invented.
//
// getSystemStatus is NOT added: the page reads systemHealth/
// supportedIntegrationTypes/activeIntegrations fields that have no real
// backend counterpart (the closest is getActiveIntegrationsCount(), an
// in-memory, per-process counter unrelated to "system health" or
// "supported types") - assembling a response for those would mean
// inventing a summary shape, not wiring a real one, so left as a
// documented gap.
const enterpriseIntegrationService = require('../services/enterpriseIntegrationService.js');

router.get('/organizations/current', async (req, res) => {
  try {
    if (!req.user?.organization_id) {
      return res.status(400).json({ success: false, error: 'No organization_id on the authenticated user' });
    }
    const result = await enterpriseIntegrationService.getOrganizationIntegrations(req.user.organization_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:integrationId/health', async (req, res) => {
  try {
    const result = await enterpriseIntegrationService.getIntegrationHealth(req.params.integrationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
