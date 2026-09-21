/**
 * Real backend routes for FisheriesManagementPage.jsx's 9 sub-modules,
 * backed by services/legacy/fisheriesManagementService.js.
 *
 * Note: this is a DIFFERENT service from services/legacy/fisheriesService.js
 * (the M103_FISHERIES_MANAGEMENT module's delegate target, which has no
 * frontend caller at all and covers a different, more general fisheries
 * concept - getAllFisheries/createFishery/etc). This page's 9 specific
 * sub-features (biofloc farm, hatchery, feed, water quality, health,
 * harvest, processing, cold chain, analytics) map to fisheriesManagementService.js
 * instead, verified against actual page usage.
 *
 * Paths match frontend/src/services/api.js's per-resource API clients
 * (verified against page usage; getBatches/createBatch/... etc. for
 * hatchery/fishFeed/waterQuality/harvest didn't exist on the exported
 * clients until this change).
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  biofloccFarm, hatcheryManagement, fishFeed, fisheriesWaterQuality, fishHealth,
  fisheriesHarvest, fishProcessing, coldFishChain, aquacultureAnalytics,
} = require('../services/legacy/fisheriesManagementService');

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

mountPluralGetSingularWrite('bioflocc-farm/tanks', 'bioflocc-farm/tank', biofloccFarm);
mountPluralGetSingularWrite('hatchery-management/batches', 'hatchery-management/batch', hatcheryManagement);
mountPluralGetSingularWrite('fish-feed/logs', 'fish-feed/log', fishFeed);
mountPluralGetSingularWrite('fisheries-water-quality/readings', 'fisheries-water-quality/reading', fisheriesWaterQuality);
mountPluralGetSingularWrite('fish-health/records', 'fish-health/record', fishHealth);
mountPluralGetSingularWrite('fisheries-harvest/harvests', 'fisheries-harvest/harvest', fisheriesHarvest);
mountPluralGetSingularWrite('fish-processing/batches', 'fish-processing/batch', fishProcessing);
mountPluralGetSingularWrite('cold-fish-chain/shipments', 'cold-fish-chain/shipment', coldFishChain);
mountPluralGetSingularWrite('aquaculture-analytics/metrics', 'aquaculture-analytics/metric', aquacultureAnalytics);

module.exports = router;
