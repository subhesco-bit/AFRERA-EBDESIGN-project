const router = require('express').Router();
const farmCostingService = require('../services/farmCostingService');
const auth = require('../middleware/auth');

router.post('/farms/:farmId/cost', auth, async (req, res) => {
  try {
    const result = await farmCostingService.calculateFarmCost(req.params.farmId, req.body.crops);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
