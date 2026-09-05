const router = require('express').Router();
const predictiveAnalyticsService = require('../services/predictiveAnalyticsService');

router.post('/predict/demand/:productId', async (req, res) => {
  try {
    const result = await predictiveAnalyticsService.predictDemand(req.params.productId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
