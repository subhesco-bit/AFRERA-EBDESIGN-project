const router = require('express').Router();
const bulkOrderService = require('../services/bulkOrderService');
const auth = require('../middleware/auth');

router.post('/bulk-orders', auth, async (req, res) => {
  try {
    const result = await bulkOrderService.createBulkOrder(req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/bulk-orders/:orderId/quotations', async (req, res) => {
  try {
    const result = await bulkOrderService.getQuotations(req.params.orderId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
