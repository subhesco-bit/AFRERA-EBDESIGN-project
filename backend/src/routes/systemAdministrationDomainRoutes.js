/**
 * Real backend routes for PlatformFoundationPage.jsx, backed by
 * services/legacy/systemAdministrationService.js. Exact 1:1 name matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/systemAdministrationService');

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

router.post('/system-administration/self-healing', wrap((req) => svc.triggerSelfHealing(req.body)));
router.get('/system-administration/capacity-forecast', wrap((req) => svc.forecastCapacity(req.query.timeframe)));
router.get('/system-administration/health-dashboard', wrap(() => svc.getSystemHealthDashboard()));

module.exports = router;
