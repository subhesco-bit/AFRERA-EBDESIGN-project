/**
 * Fisheries Registry Routes — REST wrapper for the 9 createCrudService(...)
 * objects in services/legacy/fisheriesManagementService.js that had real,
 * working DB-backed CRUD logic but no Express router at all - see that
 * file's header comment for why M132 Pond Management is deliberately not
 * included here (a different, incompatible real backend already exists
 * for it under modules/M132, needs its own reconciliation pass).
 */

'use strict';

const express = require('express');
const {
  biofloccFarm,
  hatcheryManagement,
  fishFeed,
  fisheriesWaterQuality,
  fishHealth,
  fisheriesHarvest,
  fishProcessing,
  coldFishChain,
  aquacultureAnalytics,
} = require('../services/legacy/fisheriesManagementService');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

function mountCrud(basePath, crudService, label) {
  router.get(`/${basePath}`, async (req, res, next) => {
    try {
      const result = await crudService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`fisheriesRegistryRoutes:${label}:list`, { error: error.message });
      next(error);
    }
  });

  router.post(`/${basePath}`, async (req, res, next) => {
    try {
      const record = await crudService.create(req.body);
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`fisheriesRegistryRoutes:${label}:create`, { error: error.message });
      next(error);
    }
  });

  router.get(`/${basePath}/:id`, async (req, res, next) => {
    try {
      const record = await crudService.get(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`fisheriesRegistryRoutes:${label}:get`, { error: error.message });
      next(error);
    }
  });

  router.put(`/${basePath}/:id`, async (req, res, next) => {
    try {
      const record = await crudService.update(req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`fisheriesRegistryRoutes:${label}:update`, { error: error.message });
      next(error);
    }
  });

  router.delete(`/${basePath}/:id`, async (req, res, next) => {
    try {
      const deleted = await crudService.remove(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      res.json({ success: true, message: 'Record deleted' });
    } catch (error) {
      logger.error(`fisheriesRegistryRoutes:${label}:remove`, { error: error.message });
      next(error);
    }
  });
}

mountCrud('biofloc-tanks', biofloccFarm, 'biofloccFarm');
mountCrud('hatcheries', hatcheryManagement, 'hatcheryManagement');
mountCrud('feed-logs', fishFeed, 'fishFeed');
mountCrud('water-quality', fisheriesWaterQuality, 'fisheriesWaterQuality');
mountCrud('health-records', fishHealth, 'fishHealth');
mountCrud('harvests', fisheriesHarvest, 'fisheriesHarvest');
mountCrud('processing-batches', fishProcessing, 'fishProcessing');
mountCrud('cold-chain-shipments', coldFishChain, 'coldFishChain');
mountCrud('analytics', aquacultureAnalytics, 'aquacultureAnalytics');

module.exports = router;
