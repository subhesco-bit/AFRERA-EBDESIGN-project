/**
 * Real backend routes for LivestockManagementPage.jsx's cattle registry,
 * feed management, and livestock analytics sections, backed by
 * services/legacy/livestockManagementService.js.
 *
 * Paths match frontend/src/services/api.js's cattleRegistryAPI,
 * feedManagementAPI, and livestockAnalyticsAPI exactly (verified against
 * actual page usage, not invented).
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  cattleRegistry, feedManagement, livestockAnalytics,
} = require('../services/legacy/livestockManagementService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

// cattleRegistryAPI: /cattle-registry/animal(s)
router.get('/cattle-registry/animals', async (req, res) => {
  try {
    const result = await cattleRegistry.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/cattle-registry/animal', async (req, res) => {
  try {
    const item = await cattleRegistry.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/cattle-registry/animal/:id', async (req, res) => {
  try {
    const item = await cattleRegistry.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/cattle-registry/animal/:id', async (req, res) => {
  try {
    const removed = await cattleRegistry.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// feedManagementAPI: /feed-management/record(s)
router.get('/feed-management/records', async (req, res) => {
  try {
    const result = await feedManagement.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/feed-management/record', async (req, res) => {
  try {
    const item = await feedManagement.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/feed-management/record/:id', async (req, res) => {
  try {
    const item = await feedManagement.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/feed-management/record/:id', async (req, res) => {
  try {
    const removed = await feedManagement.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// livestockAnalyticsAPI: /livestock-analytics/record(s)
router.get('/livestock-analytics/records', async (req, res) => {
  try {
    const result = await livestockAnalytics.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/livestock-analytics/record', async (req, res) => {
  try {
    const item = await livestockAnalytics.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/livestock-analytics/record/:id', async (req, res) => {
  try {
    const item = await livestockAnalytics.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/livestock-analytics/record/:id', async (req, res) => {
  try {
    const removed = await livestockAnalytics.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
