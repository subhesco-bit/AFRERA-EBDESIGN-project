const express = require('express');
const router = express.Router();
const weatherAdvisoryService = require('../services/weatherAdvisoryService');
const { logger } = require('../utils/logger');

router.get('/weather/:lat/:lng/advisory', async (req, res, next) => {
  try {
    const result = await weatherAdvisoryService.getWeatherAdvisory(parseFloat(req.params.lat), parseFloat(req.params.lng));
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/weather/:lat/:lng/crop-advisory', async (req, res, next) => {
  try {
    const { crop } = req.query;
    const result = await weatherAdvisoryService.generateCropAdvisory({}, crop);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/weather/:lat/:lng/alerts', async (req, res, next) => {
  try {
    // Was fabricating its own random rainfall/temperature independently of
    // getWeatherAdvisory() - two separate random numbers for the same
    // location, neither real. Route through the real (or honestly
    // not-configured) advisory instead of inventing a second fake forecast.
    const forecast = await weatherAdvisoryService.getWeatherAdvisory(parseFloat(req.params.lat), parseFloat(req.params.lng));
    const result = await weatherAdvisoryService.checkAlerts(forecast);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

module.exports = router;
