const router = require('express').Router();
const supplyChainService = require('../services/supplyChainTrackingService');
const auth = require('../middleware/auth');

router.post('/shipments', auth, async (req, res) => {
  try {
    const result = await supplyChainService.createShipment(req.body.product_id, req.body.origin, req.body.destination);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/shipments/:shipmentId', async (req, res) => {
  try {
    let result = await supplyChainService.trackShipment(req.params.shipmentId);
    res.json(result);
  } catch (error) { res.status(404).json({ error: error.message }); }
});

router.post('/shipments/:shipmentId/tracking', auth, async (req, res) => {
  try {
    let result = await supplyChainService.updateTrackingEvent(req.params.shipmentId, req.body.location, req.body.status);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
