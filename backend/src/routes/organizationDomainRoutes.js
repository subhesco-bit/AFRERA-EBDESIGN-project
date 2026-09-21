/**
 * Real backend routes for OrganizationTenantManagementPage.jsx's
 * organization directory tab, backed by
 * services/legacy/organizationManagementService.js.
 *
 * Paths match frontend/src/services/api.js's organizationManagementAPI
 * exactly (verified against actual page usage). getAllOrganizations and
 * deleteOrganization did not exist on the service until this change - added
 * there, plain listing/delete, distinct from createOrganization/getOrganization's
 * AI-enriched single-record flow.
 */
'use strict';

const express = require('express');
const router = express.Router();
const organizationManagementService = require('../services/legacy/organizationManagementService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

router.get('/organization-management/all-organizations', async (req, res) => {
  try {
    const result = await organizationManagementService.getAllOrganizations(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/organization-management/organization', async (req, res) => {
  try {
    const result = await organizationManagementService.createOrganization(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/organization-management/organization/:id', async (req, res) => {
  try {
    const result = await organizationManagementService.deleteOrganization(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
