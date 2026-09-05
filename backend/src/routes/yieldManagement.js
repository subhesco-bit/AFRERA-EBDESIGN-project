const router = require('express').Router();
const yieldService = require('../services/yieldManagementService');
const auth = require('../middleware/auth');

router.post('/farms/:farmId/yield', auth, async (req, res) => {
  try {
    const result = await yieldService.recordYield(req.params.farmId, req.body.crop_id, req.body.quantity, req.body.unit);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/farms/:farmId/yield-trends', async (req, res) => {
  try {
    let result = await yieldService.getYieldTrends(req.params.farmId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
