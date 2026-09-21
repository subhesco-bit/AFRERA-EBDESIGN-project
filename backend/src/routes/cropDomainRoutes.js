/**
 * Real backend routes for the 6 crop-domain frontend pages (CropRegistrationPage,
 * CropVarietyPage, SeedPlanningPage, NurseryManagementPage, SowingManagementPage,
 * CropMonitoringPage), backed by services/legacy/cropManagementService.js.
 *
 * Paths match each page's existing frontend/src/services/api.js client exactly
 * (verified against actual page usage, not invented) - these pages already
 * shipped with real forms/validation pointed at routes that were never built.
 */
'use strict';

const express = require('express');
const router = express.Router();
const { mountCrudResource } = require('../utils/mountCrudResource');
const {
  cropRegistration, cropVariety, seedPlanning, nurseryManagement, sowingManagement, cropMonitoring,
} = require('../services/legacy/cropManagementService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

// cropRegistrationAPI: GET /crop-registrations, POST /crop-registrations
mountCrudResource(router, '/crop-registrations', cropRegistration);

// cropVarietyAPI: GET /crop-varieties, POST /crop-varieties
mountCrudResource(router, '/crop-varieties', cropVariety);

// cropMonitoringAPI: GET /crop-monitoring
router.get('/crop-monitoring', async (req, res) => {
  try {
    const result = await cropMonitoring.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/crop-monitoring/monitor', async (req, res) => {
  try {
    const item = await cropMonitoring.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// cropMonitoringAPI (CropMonitoringPage.jsx full CRUD): /crop-monitoring/observations
mountCrudResource(router, '/crop-monitoring/observations', cropMonitoring);

// seedPlanningAPI: GET/POST/PUT/DELETE /seed-planning/plan(s)
router.get('/seed-planning/plans', async (req, res) => {
  try {
    const result = await seedPlanning.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/seed-planning/plan', async (req, res) => {
  try {
    const item = await seedPlanning.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/seed-planning/plan/:id', async (req, res) => {
  try {
    const item = await seedPlanning.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/seed-planning/plan/:id', async (req, res) => {
  try {
    const removed = await seedPlanning.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// nurseryAPI: GET /nursery/nurseries, POST/PUT/DELETE /nursery/nursery(/:id)
router.get('/nursery/nurseries', async (req, res) => {
  try {
    const result = await nurseryManagement.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/nursery/nursery', async (req, res) => {
  try {
    const item = await nurseryManagement.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/nursery/nursery/:id', async (req, res) => {
  try {
    const item = await nurseryManagement.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/nursery/nursery/:id', async (req, res) => {
  try {
    const removed = await nurseryManagement.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// sowingAPI: GET /sowing/records, POST/PUT/DELETE /sowing/record(/:id)
router.get('/sowing/records', async (req, res) => {
  try {
    const result = await sowingManagement.list(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/sowing/record', async (req, res) => {
  try {
    const item = await sowingManagement.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/sowing/record/:id', async (req, res) => {
  try {
    const item = await sowingManagement.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/sowing/record/:id', async (req, res) => {
  try {
    const removed = await sowingManagement.remove(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
