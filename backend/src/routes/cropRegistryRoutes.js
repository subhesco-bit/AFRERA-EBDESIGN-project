/**
 * Crop Registry Routes — REST wrapper for the 6 createCrudService(...)
 * objects in services/legacy/cropManagementService.js that had real,
 * working DB-backed CRUD logic but no Express router at all - see that
 * file's header comment: these back 6 separate dedicated pages
 * (CropRegistrationPage.jsx, CropVarietyPage.jsx, SeedPlanningPage.jsx,
 * NurseryManagementPage.jsx, SowingManagementPage.jsx,
 * CropMonitoringPage.jsx), not one consolidated tab page.
 */

'use strict';

const express = require('express');
const {
  cropRegistration,
  cropVariety,
  seedPlanning,
  nurseryManagement,
  sowingManagement,
  cropMonitoring,
} = require('../services/legacy/cropManagementService');
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
      logger.error(`cropRegistryRoutes:${label}:list`, { error: error.message });
      next(error);
    }
  });

  router.post(`/${basePath}`, async (req, res, next) => {
    try {
      const record = await crudService.create(req.body);
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`cropRegistryRoutes:${label}:create`, { error: error.message });
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
      logger.error(`cropRegistryRoutes:${label}:get`, { error: error.message });
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
      logger.error(`cropRegistryRoutes:${label}:update`, { error: error.message });
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
      logger.error(`cropRegistryRoutes:${label}:remove`, { error: error.message });
      next(error);
    }
  });
}

mountCrud('registrations', cropRegistration, 'cropRegistration');
mountCrud('varieties', cropVariety, 'cropVariety');
mountCrud('seed-plans', seedPlanning, 'seedPlanning');
mountCrud('nurseries', nurseryManagement, 'nurseryManagement');
mountCrud('sowing-records', sowingManagement, 'sowingManagement');
mountCrud('monitoring-observations', cropMonitoring, 'cropMonitoring');

module.exports = router;
