/**
 * Real backend routes for CADashboardPage.jsx / CompliancePage.jsx's TDS/GST
 * compliance widgets, backed by services/legacy/complianceService.js.
 * tdsRates serves the real exported TDS_RATES constant directly (not a
 * function in the service, but real configured data, not invented).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/complianceService');

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

router.get('/compliance/tds-summary', wrap((req) => svc.tdsSummary(req.query)));
router.get('/compliance/tds-rates', wrap(() => svc.TDS_RATES));
router.get('/compliance/rcm-outstanding', wrap((req) => svc.rcmOutstanding(req.query.period)));

module.exports = router;
