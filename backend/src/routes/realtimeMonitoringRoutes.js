/**
 * realtime Monitoring Routes
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
    module: 'realtimeMonitoringRoutes',
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
    module: 'realtimeMonitoringRoutes'
  });
});

// 2026-09-17: found while auditing RealtimeMonitoringPage.jsx's
// realtimeMonitoringAPI (startMonitoring/getAllMonitors/getMonitoringStatus/
// stopMonitoring/healthCheck) against api.js - the page's own comment
// claimed "All 5 methods verified to exist (2026-08-29)", true of
// services/legacy/realtimeMonitoringService.js (a real in-memory monitor
// registry - collectMetric was already honestly fixed 2026-08-15 to return
// null instead of a fabricated Math.random() reading, so nothing fabricated
// here), but api.js itself was never actually updated, so every call threw
// "is not a function". This file (already mounted at /api/realtimemonitoring)
// was the "Route operational" scaffold in front of it. startMonitoring
// exposed as monitor/start below since the api.js key `startMonitoring` was
// already taken by an older, dead placeholder method.
const realtimeMonitoringService = require('../services/legacy/realtimeMonitoringService.js');

router.post('/monitor/start', async (req, res) => {
  try {
    const { resourceId, ...config } = req.body || {};
    const monitor = await realtimeMonitoringService.startMonitoring(resourceId, config);
    res.json({ success: true, data: monitor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/monitor', async (req, res) => {
  try {
    const monitors = await realtimeMonitoringService.getAllMonitors();
    res.json({ success: true, data: monitors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/monitor/:id', async (req, res) => {
  try {
    const status = await realtimeMonitoringService.getMonitoringStatus(req.params.id);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, error: error.message });
  }
});

router.delete('/monitor/:id', async (req, res) => {
  try {
    const result = await realtimeMonitoringService.stopMonitoring(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, error: error.message });
  }
});

router.get('/engine-health', async (req, res) => {
  try {
    const health = await realtimeMonitoringService.healthCheck();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
