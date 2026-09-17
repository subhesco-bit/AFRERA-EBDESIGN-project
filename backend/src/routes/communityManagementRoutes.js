/**
 * community Management Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'communityManagementRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'communityManagementRoutes'
  });
});

// 2026-09-17: found while auditing CommunityManagementPage.jsx's 6 CRUD
// tabs (block/district/state/producer-group/community-asset/rural-development
// management) against api.js - the page's ResourceManager list/create/update/
// remove calls had no matching methods. Traced the real backend:
// services/legacy/communityManagementService.js already exists, built
// specifically for these 6 tabs (comment header names this exact page),
// backed by real tables from
// database/migrations/9999_zzzzzzzzzzzzzzzzzzzzz_community_management_schema.sql
// via a genuine parameterized-SQL CRUD factory (resourceCrudFactory.js) - it
// just had no route file. This file (already mounted at
// /api/communitymanagement) was the "Route operational" scaffold sitting in
// front of it. Added real routes calling straight into the real service, no
// fabricated logic.
const {
  blockManagement,
  districtManagement,
  stateManagement,
  producerGroup,
  communityAsset,
  ruralDevelopment,
} = require('../services/legacy/communityManagementService.js');

function crudRoutes(path, service) {
  router.get(`/${path}`, async (req, res) => {
    try {
      const result = await service.list(req.query);
      res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get(`/${path}/:id`, async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post(`/${path}`, async (req, res) => {
    try {
      const item = await service.create(req.body);
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(/required/i.test(error.message) ? 400 : 500).json({ success: false, error: error.message });
    }
  });

  router.put(`/${path}/:id`, async (req, res) => {
    try {
      const item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.delete(`/${path}/:id`, async (req, res) => {
    try {
      const removed = await service.remove(req.params.id);
      res.json({ success: true, data: { removed } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

crudRoutes('blocks', blockManagement);
crudRoutes('districts', districtManagement);
crudRoutes('states', stateManagement);
crudRoutes('producer-groups', producerGroup);
crudRoutes('community-assets', communityAsset);
crudRoutes('rural-development-projects', ruralDevelopment);

module.exports = router;
