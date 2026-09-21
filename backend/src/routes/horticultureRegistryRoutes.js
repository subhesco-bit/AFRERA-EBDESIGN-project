/**
 * Horticulture Registry Routes — REST wrapper for the 8 createCrudService(...)
 * objects in services/legacy/horticultureManagementService.js that had
 * real, working DB-backed CRUD logic but no Express router at all - see
 * that file's header comment for the 2 tabs (Greenhouse Management,
 * Orchard Management) deliberately not part of this batch (they have
 * their own real backends/pages).
 */

'use strict';

const express = require('express');
const {
  vegetableProduction,
  floriculture,
  polyhouseManagement,
  hydroponics,
  aeroponics,
  precisionHorticulture,
  protectedCultivation,
  horticultureAnalytics,
} = require('../services/legacy/horticultureManagementService');
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
      logger.error(`horticultureRegistryRoutes:${label}:list`, { error: error.message });
      next(error);
    }
  });

  router.post(`/${basePath}`, async (req, res, next) => {
    try {
      const record = await crudService.create(req.body);
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`horticultureRegistryRoutes:${label}:create`, { error: error.message });
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
      logger.error(`horticultureRegistryRoutes:${label}:get`, { error: error.message });
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
      logger.error(`horticultureRegistryRoutes:${label}:update`, { error: error.message });
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
      logger.error(`horticultureRegistryRoutes:${label}:remove`, { error: error.message });
      next(error);
    }
  });
}

mountCrud('vegetable-production', vegetableProduction, 'vegetableProduction');
mountCrud('floriculture', floriculture, 'floriculture');
mountCrud('polyhouses', polyhouseManagement, 'polyhouseManagement');
mountCrud('hydroponic-systems', hydroponics, 'hydroponics');
mountCrud('aeroponic-systems', aeroponics, 'aeroponics');
mountCrud('precision-readings', precisionHorticulture, 'precisionHorticulture');
mountCrud('protected-structures', protectedCultivation, 'protectedCultivation');
mountCrud('analytics', horticultureAnalytics, 'horticultureAnalytics');

module.exports = router;
