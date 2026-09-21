/**
 * Real backend routes for CommunityManagementPage.jsx's producer group,
 * community asset, and rural development sub-modules, backed by
 * services/legacy/communityManagementService.js. Exact 1:1 CRUD match.
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  producerGroup, communityAsset, ruralDevelopment, blockManagement, districtManagement, stateManagement,
} = require('../services/legacy/communityManagementService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

function mountCrud(basePath, singularPath, resource) {
  router.get(`/${basePath}`, async (req, res) => {
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

mountCrud('producer-groups', 'producer-group', producerGroup);
mountCrud('community-assets', 'community-asset', communityAsset);
mountCrud('rural-development-projects', 'rural-development-project', ruralDevelopment);
mountCrud('blocks', 'block', blockManagement);
mountCrud('districts', 'district', districtManagement);
mountCrud('states', 'state', stateManagement);

module.exports = router;
