const router = require('express').Router();
const marketAnalyticsService = require('../services/marketAnalyticsService');

router.post('/market/analyze/:productId', async (req, res) => {
  try {
    const result = await marketAnalyticsService.analyzeMarket(req.params.productId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
