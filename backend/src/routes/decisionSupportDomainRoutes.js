/**
 * Real backend routes for DecisionSupportPage.jsx, backed directly by
 * services/legacy/decisionSupportService.js's real methods (NOT its
 * setupRoutes()-mounted decisionSupportRoutes.js, which is itself just the
 * generic "Route operational" stub pattern).
 *
 * A couple of page calls wrap their payload in an extra object where the
 * real method takes a flatter shape - unwrapped below.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/decisionSupportService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => (req, res) => {
  try {
    res.json({ success: true, data: fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/decision-support/scheme-expiry-status', wrap(() => svc.schemeExpiryStatus()));
router.post('/decision-support/alloc-score', wrap((req) => svc.allocScore(req.body.lot ?? req.body, req.body.dest, req.body.regionDist)));
router.post('/decision-support/compliance-gaps', wrap((req) => svc.complianceGaps(req.body.complianceRecord ?? req.body)));
router.post('/decision-support/eco-logistics-miles', wrap((req) => svc.ecoLogisticsMiles(req.body, req.body.lanes)));
router.post('/decision-support/harvest-points', wrap((req) => svc.harvestPoints(req.body)));
router.post('/decision-support/corp-credit-eligible', wrap((req) => svc.corpCreditEligible(req.body.turnoverCr, req.body.vintageYrs)));
router.post('/decision-support/compost-plan', wrap((req) => svc.compostPlan(req.body.crop, req.body.acres, req.body.soilCond)));
router.post('/decision-support/floor-benchmark', wrap((req) => svc.floorBenchmark(req.body.categoryOrName, req.body.catalog)));

module.exports = router;
