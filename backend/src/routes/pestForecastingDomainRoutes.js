/**
 * Real backend route for ClimateMonitoringPage.jsx's
 * pestForecastingAPI.getForecasts(params), backed by
 * services/legacy/climateMonitoringService.js's diseaseForecasting CRUD
 * resource (createCrudService('disease_forecasts', ...)) — the closest
 * real match; there is no separate "pest forecasting" table, disease and
 * pest risk forecasts share the same disease_forecasts resource.
 */
'use strict';

const express = require('express');
const router = express.Router();
const { diseaseForecasting } = require('../services/legacy/climateMonitoringService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

router.get('/pest-forecasting', async (req, res) => {
  try {
    const data = await diseaseForecasting.list(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
