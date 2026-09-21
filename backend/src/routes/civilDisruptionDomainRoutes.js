/**
 * Real backend routes for DisruptionPage.jsx and MarketSignalsPage.jsx,
 * backed by services/legacy/civilDisruptionService.js. verify's
 * verifiedBy arg is filled from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/civilDisruptionService');

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

router.post('/civil-disruption/report', wrap((req) => svc.report(req.body)));
router.post('/civil-disruption/:id/verify', wrap((req) => svc.verify(req.params.id, req.user?.id)));
router.post('/civil-disruption/:id/resolve', wrap((req) => svc.resolve(req.params.id, req.body.endDate)));
router.get('/civil-disruption/active', wrap((req) => svc.listActive(req.query)));
router.get('/civil-disruption/shipment/:shipmentId/risk', wrap((req) => svc.checkShipmentRisk(req.params.shipmentId)));

module.exports = router;
