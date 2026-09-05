const router = require('express').Router();
const livestockService = require('../services/livestockService');
const auth = require('../middleware/auth');

router.post('/farms/:farmId/livestock', auth, async (req, res) => {
  try {
    const result = await livestockService.registerLivestock(req.params.farmId, req.body.type, req.body.count, req.body.breed);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
