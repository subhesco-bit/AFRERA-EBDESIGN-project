const router = require('express').Router();
const freightService = require('../services/freightPoolingService');
const auth = require('../middleware/auth');

router.post('/freight-pools', auth, async (req, res) => {
  try {
    const result = await freightService.createFreightPool(req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/freight-pools/:poolId/join', auth, async (req, res) => {
  try {
    const result = await freightService.joinFreightPool(req.params.poolId, req.body.shipment_id);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
