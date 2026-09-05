const router = require('express').Router();
const climateService = require('../services/climateAdvisoryService');

router.get('/farms/:farmId/climate-advisory', async (req, res) => {
  try {
    const result = await climateService.getClimateAdvisory(req.params.farmId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
