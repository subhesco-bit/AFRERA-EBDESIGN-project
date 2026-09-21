/**
 * Real backend routes for RfqPage.jsx / CostControlPage.jsx's RFQ widgets,
 * backed by services/legacy/rfqService.js. Exact 1:1 name matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/rfqService');

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

router.get('/rfq/active-holds', wrap(() => svc.activeHolds()));
router.get('/rfq/loss-analysis', wrap((req) => svc.lossAnalysis(req.query)));
router.get('/rfq/centre-pnl/:fpoId', wrap((req) => svc.centrePnl(req.params.fpoId)));
router.post('/rfq/qc-hold/release', wrap((req) => svc.releaseQcHold(req.body)));

module.exports = router;
