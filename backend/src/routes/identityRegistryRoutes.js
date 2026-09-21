/**
 * Identity Registry Routes — REST wrapper for the 6 resources in
 * services/legacy/identityManagementService.js that had real, working
 * DB-backed logic but no Express router at all - see that file's header
 * comment for why M014 Role Management (already has a real backend at
 * roleManagementService.js/roleManagementRoutes.js) isn't part of this
 * batch, and why sessionManagement is a hand-written admin view over the
 * real `sessions` table (M012) rather than a generic createCrudService
 * table of its own.
 */

'use strict';

const express = require('express');
const {
  permissionManagement,
  ssoManagement,
  mfaManagement,
  digitalIdentity,
  consentManagement,
  sessionManagement,
} = require('../services/legacy/identityManagementService');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

function mountCrud(basePath, crudService, label, { allowCreate = true } = {}) {
  router.get(`/${basePath}`, async (req, res, next) => {
    try {
      const result = await crudService.list(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`identityRegistryRoutes:${label}:list`, { error: error.message });
      next(error);
    }
  });

  if (allowCreate) {
    router.post(`/${basePath}`, async (req, res, next) => {
      try {
        const record = await crudService.create(req.body);
        res.json({ success: true, data: record });
      } catch (error) {
        logger.error(`identityRegistryRoutes:${label}:create`, { error: error.message });
        next(error);
      }
    });
  }

  router.get(`/${basePath}/:id`, async (req, res, next) => {
    try {
      const record = await crudService.get(req.params.id);
      if (!record) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error(`identityRegistryRoutes:${label}:get`, { error: error.message });
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
      logger.error(`identityRegistryRoutes:${label}:update`, { error: error.message });
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
      logger.error(`identityRegistryRoutes:${label}:remove`, { error: error.message });
      next(error);
    }
  });
}

mountCrud('permissions', permissionManagement, 'permissionManagement');
mountCrud('sso-providers', ssoManagement, 'ssoManagement');
mountCrud('mfa-devices', mfaManagement, 'mfaManagement');
mountCrud('digital-identities', digitalIdentity, 'digitalIdentity');
mountCrud('consent-records', consentManagement, 'consentManagement');
mountCrud('sessions', sessionManagement, 'sessionManagement', { allowCreate: false });

module.exports = router;
