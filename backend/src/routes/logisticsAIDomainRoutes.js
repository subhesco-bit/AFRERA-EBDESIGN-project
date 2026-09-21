/**
 * Real backend routes for SupplyChainAnalyticsPage.jsx, backed by
 * services/claude/logisticsAIService.js (a thin real wrapper forwarding to
 * the original logisticsService).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/claude/logisticsAIService');

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

router.get('/logistics-ai/shipments', wrap((req) => svc.getShipments(req.query)));

module.exports = router;
