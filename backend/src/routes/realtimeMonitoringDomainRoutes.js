/**
 * Real backend routes for RealtimeMonitoringPage.jsx, backed by
 * services/legacy/realtimeMonitoringService.js. Exact 1:1 name matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/realtimeMonitoringService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/realtime-monitoring/monitors', wrap(() => svc.getAllMonitors()));
router.get('/realtime-monitoring/health', wrap(() => svc.healthCheck()));
router.get('/realtime-monitoring/monitor/:id/status', wrap((req) => svc.getMonitoringStatus(req.params.id)));
router.post('/realtime-monitoring/monitor/:id/stop', wrap((req) => svc.stopMonitoring(req.params.id)));
router.post('/realtime-monitoring/resource/:resourceId/start', wrap((req) => svc.startMonitoring(req.params.resourceId, req.body)));

module.exports = router;
