/**
 * Real backend routes for AIDashboard.jsx's e-commerce AI widgets, backed by
 * services/legacy/ecommerceAIService.js. Exact 1:1 name matches.
 *
 * getAIAlerts, getAIDecisions, executeAIDecision, which the page also
 * calls, have no implementation anywhere (same "AI decision" gap seen in
 * several other services this sweep) - not wired, flagged instead of faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/ecommerceAIService');

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

router.get('/ecommerce-ai/market-basket', wrap((req) => svc.analyzeMarketBasket(req.query.categoryId)));
router.get('/ecommerce-ai/predict-sales', wrap((req) => svc.predictSales(req.query.categoryId, req.query.periodDays)));
router.get('/ecommerce-ai/segment-customers/behavioral', wrap(() => svc.segmentCustomersBehavioral()));
router.get('/ecommerce-ai/segment-customers/rfm', wrap(() => svc.segmentCustomersRFM()));
router.get('/ecommerce-ai/forecast-demand/:productId', wrap((req) => svc.forecastProductDemand(req.params.productId, req.query.horizonDays)));
router.get('/ecommerce-ai/optimize-inventory/:productId', wrap((req) => svc.optimizeInventory(req.params.productId)));
router.get('/ecommerce-ai/customer-lifetime-value/:userId', wrap((req) => svc.calculateCustomerLifetimeValue(req.params.userId)));
router.get('/ecommerce-ai/recommendations/:userId', wrap((req) => svc.getPersonalizedRecommendations(req.params.userId, req.query.limit)));

module.exports = router;
