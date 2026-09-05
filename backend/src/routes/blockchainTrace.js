const router = require('express').Router();
const blockchainService = require('../services/blockchainTraceService');
const auth = require('../middleware/auth');

router.post('/blockchain/record/:productId', auth, async (req, res) => {
  try {
    const result = await blockchainService.recordTransaction(req.params.productId, req.body.from_address, req.body.to_address);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
