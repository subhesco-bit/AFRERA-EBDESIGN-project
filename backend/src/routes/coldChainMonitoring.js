const router = require('express').Router();
const coldChainService = require('../services/coldChainMonitoringService');
const auth = require('../middleware/auth');

router.post('/cold-storage/:unitId/temperature', auth, async (req, res) => {
  try {
    const result = await coldChainService.monitorTemperature(req.params.unitId, req.body.temperature);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/cold-storage/:unitId/history', async (req, res) => {
  try {
    let result = await coldChainService.getTemperatureHistory(req.params.unitId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
