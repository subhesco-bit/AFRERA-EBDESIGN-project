const router = require('express').Router();
const soilHealthService = require('../services/soilHealthService');
const auth = require('../middleware/auth');

router.post('/farms/:farmId/soil-test', auth, async (req, res) => {
  try {
    const result = await soilHealthService.recordSoilTest(req.params.farmId, req.body.ph, req.body.nitrogen, req.body.phosphorus, req.body.potassium);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
