/**
 * Real backend routes for HorticultureManagementPage.jsx's 8 sub-modules,
 * backed by services/legacy/horticultureManagementService.js. Exact 1:1
 * CRUD match for all 8 (greenhouseAPI's registry CRUD is separately
 * confirmed unbuilt - the page's own note explains the real
 * greenhouseService exposes per-ID design/monitor actions instead).
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  vegetableProduction, floriculture, polyhouseManagement, hydroponics, aeroponics,
  precisionHorticulture, protectedCultivation, horticultureAnalytics,
} = require('../services/legacy/horticultureManagementService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

function mountPluralGetSingularWrite(pluralPath, singularPath, resource) {
  router.get(`/${pluralPath}`, async (req, res) => {
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

mountPluralGetSingularWrite('vegetable-production/records', 'vegetable-production/record', vegetableProduction);
mountPluralGetSingularWrite('floriculture/records', 'floriculture/record', floriculture);
mountPluralGetSingularWrite('polyhouse/records', 'polyhouse/record', polyhouseManagement);
mountPluralGetSingularWrite('hydroponics/systems', 'hydroponics/system', hydroponics);
mountPluralGetSingularWrite('aeroponics/systems', 'aeroponics/system', aeroponics);
mountPluralGetSingularWrite('precision-horticulture/readings', 'precision-horticulture/reading', precisionHorticulture);
mountPluralGetSingularWrite('protected-cultivation/structures', 'protected-cultivation/structure', protectedCultivation);
mountPluralGetSingularWrite('horticulture-analytics/metrics', 'horticulture-analytics/metric', horticultureAnalytics);

module.exports = router;
