/**
 * Crop Planning Routes
 *
 * (2026-08-29) cropPlanningService.js (533 lines, real, table-backed against
 * crop_plans/land_records - migration 011_farmer_portal_enhancements.sql)
 * was never required anywhere in index.js - a genuinely orphaned service,
 * not a stub. This wires it up. No frontend page yet; that's the natural
 * next step once this route is verified live.
 */

'use strict';

const express = require('express');
const router = express.Router();
const cropPlanningService = require('../services/legacy/cropPlanningService');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const result = await cropPlanningService.createCropPlan(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    let result = await cropPlanningService.getFarmerCropPlans(req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/recommend/:landRecordId', authMiddleware, async (req, res) => {
  try {
    let result = await cropPlanningService.getRecommendedCropPlan(req.user.id, req.params.landRecordId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/suitable-crops', async (req, res) => {
  try {
    const { soilType, state, district, season } = req.query;
    let result = await cropPlanningService.getSuitableCrops(soilType, state, district, season);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/market-demand', async (req, res) => {
  try {
    let result = await cropPlanningService.getMarketDemand(req.query.season);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/weather-forecast', async (req, res) => {
  try {
    const { district, season } = req.query;
    let result = await cropPlanningService.getWeatherForecast(district, season);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:planId/status', authMiddleware, async (req, res) => {
  try {
    const { status, ...updateData } = req.body;
    let result = await cropPlanningService.updateCropPlanStatus(req.params.planId, req.user.id, status, updateData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    let result = await cropPlanningService.getCropPlanningAnalytics(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
