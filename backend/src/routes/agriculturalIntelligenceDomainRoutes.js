/**
 * Real backend routes for AgriculturalIntelligencePage.jsx, backed by
 * services/legacy/agriculturalIntelligenceService.js. Exact 1:1 name
 * matches throughout (verified against actual page usage).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/agriculturalIntelligenceService');

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

router.get('/agricultural-intelligence/health', wrap(() => svc.healthCheck()));
router.post('/agricultural-intelligence/analyze-soil', wrap((req) => svc.analyzeSoil(req.body)));
router.post('/agricultural-intelligence/optimize-irrigation', wrap((req) => svc.optimizeIrrigation(req.body)));
router.post('/agricultural-intelligence/predict-crop-yield', wrap((req) => svc.predictCropYield(req.body)));
router.post('/agricultural-intelligence/predict-pest-outbreak', wrap((req) => svc.predictPestOutbreak(req.body)));
router.post('/agricultural-intelligence/recommend-crops', wrap((req) => svc.recommendCrops(req.body)));
router.post('/agricultural-intelligence/recommend-fertilizer', wrap((req) => svc.recommendFertilizer(req.body)));
router.get('/agricultural-intelligence/analytics', wrap((req) => svc.getAgriculturalAnalytics(req.query)));
router.get('/agricultural-intelligence/weather', wrap((req) => svc.getWeatherIntelligence(req.query.location, req.query.timeframe)));

module.exports = router;
