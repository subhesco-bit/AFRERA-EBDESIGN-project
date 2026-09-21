/**
 * Climate Registry Routes — REST wrapper for the 5 createCrudService(...)
 * objects in services/legacy/climateMonitoringService.js that had real,
 * working DB-backed CRUD logic but no Express router at all - see that
 * file's header comment for why M087 Pest Forecasting is deliberately
 * NOT covered here (not in this file at all - a genuine gap, not
 * fabricated around).
 */

'use strict';

const express = require('express');
const {
  droughtMonitoring,
  floodMonitoring,
  diseaseForecasting,
  climateRisk,
  agroMeteorology,
} = require('../services/legacy/climateMonitoringService');
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
      logger.error(`climateRegistryRoutes:${label}:list`, { error: error.message });
      next(error);
    }
  });

  router.post(`/${basePath}`, async (req, res, next) => {
    try {
      const record = await crudService.create(req.body);
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`climateRegistryRoutes:${label}:create`, { error: error.message });
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
      logger.error(`climateRegistryRoutes:${label}:get`, { error: error.message });
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
      logger.error(`climateRegistryRoutes:${label}:update`, { error: error.message });
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
      logger.error(`climateRegistryRoutes:${label}:remove`, { error: error.message });
      next(error);
    }
  });
}

mountCrud('drought', droughtMonitoring, 'droughtMonitoring');
mountCrud('flood', floodMonitoring, 'floodMonitoring');
mountCrud('disease-forecasts', diseaseForecasting, 'diseaseForecasting');
mountCrud('climate-risk', climateRisk, 'climateRisk');
mountCrud('agro-meteorology', agroMeteorology, 'agroMeteorology');

module.exports = router;
