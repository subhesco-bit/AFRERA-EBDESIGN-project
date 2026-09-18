/**
 * Real backend routes for SoilManagementPage.jsx's soil health, nutrient
 * management, and fertility management sections, backed by
 * services/legacy/soilManagementService.js.
 *
 * Paths match frontend/src/services/api.js's soilHealthAPI, nutrientManagementAPI,
 * and fertilityManagementAPI exactly (verified against actual page usage: GET
 * uses the plural path, POST/PUT/DELETE use the singular path - not the same
 * base path for both, so the generic mountCrudResource helper doesn't fit
 * here). The soilHealthAPI/nutrientManagementAPI CRUD methods the page
 * actually calls (getCards/createCard/... and getPlans/createPlan/...) were
 * missing from api.js until this change - added there to match what the page
 * already expects.
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  soilHealth, nutrientManagement, fertilityManagement,
} = require('../services/legacy/soilManagementService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

function mountPluralGetSingularWrite(basePath, singularPath, resource) {
  router.get(`/${basePath}`, async (req, res) => {
    try {
      const result = await resource.list(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  router.post(`/${singularPath}`, async (req, res) => {
    try {
      const item = await resource.create(req.body);
      res.status(201).json({ success: true, item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  router.put(`/${singularPath}/:id`, async (req, res) => {
    try {
      const item = await resource.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  router.delete(`/${singularPath}/:id`, async (req, res) => {
    try {
      const removed = await resource.remove(req.params.id);
      if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
}

mountPluralGetSingularWrite('soil-health/cards', 'soil-health/card', soilHealth);
mountPluralGetSingularWrite('nutrient-management/plans', 'nutrient-management/plan', nutrientManagement);
mountPluralGetSingularWrite('fertility-management/records', 'fertility-management/record', fertilityManagement);

module.exports = router;
