/**
 * Agricultural Intelligence Routes.
 * Exposes services/agriculturalIntelligenceService.js — found fully built
 * (8 real methods) but with zero HTTP route exposure anywhere in the repo.
 * Routes through aiGatewayService.predict()/analyze() underneath, which
 * honestly returns implemented:false where no real model is connected
 * (see aiGatewayService.js) rather than fabricated values.
 */

const express = require('express');
const router = express.Router();
const agriculturalIntelligenceService = require('../services/agriculturalIntelligenceService');
const { authMiddleware } = require('../middleware/auth');

router.post('/crop-yield/predict', authMiddleware, async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.predictCropYield(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/soil/analyze', authMiddleware, async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.analyzeSoil(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/weather-intelligence', authMiddleware, async (req, res) => {
  try {
    const { location, timeframe } = req.query;
    if (!location) return res.status(400).json({ success: false, error: 'location is required' });
    const result = await agriculturalIntelligenceService.getWeatherIntelligence(location, timeframe || '7d');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/pest-outbreak/predict', authMiddleware, async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.predictPestOutbreak(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/crops/recommend', authMiddleware, async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.recommendCrops(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/irrigation/optimize', authMiddleware, async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.optimizeIrrigation(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/fertilizer/recommend', authMiddleware, async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.recommendFertilizer(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.getAgriculturalAnalytics(req.query || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    const result = await agriculturalIntelligenceService.healthCheck();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
