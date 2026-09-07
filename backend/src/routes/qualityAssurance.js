const router = require('express').Router();
const qaService = require('../services/qualityAssuranceService');
const auth = require('../middleware/auth');

router.post('/qa/inspect/:productId', auth, async (req, res) => {
  try {
    const result = await qaService.inspectProduct(req.params.productId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
