/**
 * Routes for 9 of the 10 Fisheries-domain CRUD resources - see
 * backend/src/services/fisheriesManagementService.js for why Pond
 * Management (M132) is excluded. Mounted at flat prefixes in index.js
 * matching frontend/src/services/api.js exactly (e.g. /api/v1/biofloc-farms),
 * so no frontend change is needed.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { protectLivestockRouter } = require('./livestockRouteSupport');
const { SIGNAL } = require('../core/signalBus');
const {
  biofloccFarm, hatcheryManagement, fishFeed, fisheriesWaterQuality, fishHealth,
  fisheriesHarvest, fishProcessing, coldFishChain, aquacultureAnalytics,
} = require('../services/legacy/fisheriesManagementService');

function crudRouter(service) {
  const router = express.Router();
  protectLivestockRouter(router, { requireWriteRole: true, signal: SIGNAL.FISHERIES_RECORD_CHANGED });
  router.get('/', async (req, res) => {
    try { res.json({ success: true, data: (await service.list(req.query)).items }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  router.get('/:id', async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  router.post('/', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try { res.status(201).json({ success: true, data: await service.create(req.body) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.put('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try {
      let item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.delete('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  return router;
}

module.exports = {
  biofloccFarmRoutes: crudRouter(biofloccFarm),
  hatcheryManagementRoutes: crudRouter(hatcheryManagement),
  fishFeedRoutes: crudRouter(fishFeed),
  fisheriesWaterQualityRoutes: crudRouter(fisheriesWaterQuality),
  fishHealthRoutes: crudRouter(fishHealth),
  fisheriesHarvestRoutes: crudRouter(fisheriesHarvest),
  fishProcessingRoutes: crudRouter(fishProcessing),
  coldFishChainRoutes: crudRouter(coldFishChain),
  aquacultureAnalyticsRoutes: crudRouter(aquacultureAnalytics),
};
