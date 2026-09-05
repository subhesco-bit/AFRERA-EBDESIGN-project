const router = require('express').Router();
const supplyChainAnalyticsService = require('../services/supplyChainAnalyticsService');

router.post('/supply-chain/analyze', async (req, res) => {
  try {
    const result = await supplyChainAnalyticsService.analyzeShipments(req.body.origin, req.body.destination);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
