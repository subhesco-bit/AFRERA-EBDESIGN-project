const router = require('express').Router();
const horticultureService = require('../services/horticultureService');
const auth = require('../middleware/auth');

router.post('/farms/:farmId/fruit-orchard', auth, async (req, res) => {
  try {
    const result = await horticultureService.manageFruit(req.params.farmId, req.body.fruit_type, req.body.area, req.body.planting_date);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
