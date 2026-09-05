const express = require('express');
const router = express.Router();
const priceForecastingService = require('../services/priceForecastingService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

router.get('/products/:id/price-forecast', async (req, res, next) => {
  try {
    const result = await priceForecastingService.forecastProductPrice(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/products/:id/price-history', async (req, res, next) => {
  try {
    let result = await priceForecastingService.getHistoricalPrices(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

module.exports = router;
