const router = require('express').Router();
const mlService = require('../services/mlOptimizationService');
const auth = require('../middleware/auth');
router.post('/ml/:modelId/train', auth, async (req, res) => {
  try { const result = await mlService.trainModel(req.params.modelId, req.body); res.json(result); }
  catch (error) { res.status(500).json({ error: error.message }); }
});
module.exports = router;
