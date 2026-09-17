/**
 * Water Records Registry Routes — REST wrapper for the 5
 * createCrudService(...) objects in
 * services/legacy/waterManagementService.js that had real, working
 * DB-backed CRUD logic but no Express router at all - see that file's
 * header comment for why rainwater_harvesting_structures here is
 * deliberately distinct from modules/M078's rainwater_harvesting_systems
 * (a different, unrelated design with no frontend caller).
 *
 * This is a confirmed regression, not a fresh gap: git history shows
 * routes/waterManagementRoutes.js used to require() this exact service
 * and was overwritten with a generic "Route operational" stub by a later
 * batch-fix commit (a2beb556, 2026-09-10). Rather than resurrect that
 * file (whose mount path /api/watermanagement may be relied on elsewhere
 * for its current stub behavior), this is a new file/path, matching the
 * pattern used for the other *RegistryRoutes.js files this session.
 */

'use strict';

const express = require('express');
const {
  waterBudgeting,
  waterQuality,
  rainwaterHarvesting,
  watershedManagement,
  waterAnalytics,
} = require('../services/legacy/waterManagementService');
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
      logger.error(`waterRecordsRegistryRoutes:${label}:list`, { error: error.message });
      next(error);
    }
  });

  router.post(`/${basePath}`, async (req, res, next) => {
    try {
      const record = await crudService.create(req.body);
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`waterRecordsRegistryRoutes:${label}:create`, { error: error.message });
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
      logger.error(`waterRecordsRegistryRoutes:${label}:get`, { error: error.message });
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
      logger.error(`waterRecordsRegistryRoutes:${label}:update`, { error: error.message });
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
      logger.error(`waterRecordsRegistryRoutes:${label}:remove`, { error: error.message });
      next(error);
    }
  });
}

mountCrud('budgets', waterBudgeting, 'waterBudgeting');
mountCrud('quality-readings', waterQuality, 'waterQuality');
mountCrud('rainwater-structures', rainwaterHarvesting, 'rainwaterHarvesting');
mountCrud('watersheds', watershedManagement, 'watershedManagement');
mountCrud('analytics', waterAnalytics, 'waterAnalytics');

module.exports = router;
