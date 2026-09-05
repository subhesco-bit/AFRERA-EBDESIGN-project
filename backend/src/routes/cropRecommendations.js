const express = require('express');
const router = express.Router();
const cropRecommendationService = require('../services/cropRecommendationService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

router.post('/recommendations/crops', authenticateToken, async (req, res, next) => {
  try {
    const { location, season } = req.body;
    const result = await cropRecommendationService.recommendCrops(req.user.id, location, season);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/crops/:type/guidance', async (req, res, next) => {
  try {
    const { phase } = req.query;
    let result = await cropRecommendationService.getCropGuidance(req.params.type, phase);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/crops/:type/market-outlook', async (req, res, next) => {
  try {
    let result = await cropRecommendationService.getMarketOutlook(req.params.type);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

module.exports = router;
