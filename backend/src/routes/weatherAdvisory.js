const express = require('express');
const router = express.Router();
const weatherAdvisoryService = require('../services/weatherAdvisoryService');
const logger = require('../utils/logger');

router.get('/weather/:lat/:lng/advisory', async (req, res, next) => {
  try {
    const result = await weatherAdvisoryService.getWeatherAdvisory(parseFloat(req.params.lat), parseFloat(req.params.lng));
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/weather/:lat/:lng/crop-advisory', async (req, res, next) => {
  try {
    const { crop } = req.query;
    let result = await weatherAdvisoryService.generateCropAdvisory({}, crop);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/weather/:lat/:lng/alerts', async (req, res, next) => {
  try {
    const forecast = { rainfall: Math.random() * 50, temperature: 25 + Math.random() * 15 };
    let result = await weatherAdvisoryService.checkAlerts(forecast);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

module.exports = router;
