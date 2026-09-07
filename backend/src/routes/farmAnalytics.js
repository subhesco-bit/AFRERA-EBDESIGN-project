const router = require('express').Router();
const farmAnalyticsService = require('../services/farmAnalyticsService');
const auth = require('../middleware/auth');

router.post('/farms/:farmId/analytics/report', auth, async (req, res) => {
  try {
    const result = await farmAnalyticsService.generateFarmReport(req.params.farmId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/farms/:farmId/analytics/dashboard', async (req, res) => {
  try {
    const result = await farmAnalyticsService.getDashboard(req.params.farmId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
