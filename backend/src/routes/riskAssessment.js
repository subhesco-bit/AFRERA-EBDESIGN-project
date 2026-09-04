const router = require('express').Router();
const riskService = require('../services/riskAssessmentService');
const auth = require('../middleware/auth');

router.post('/risk/assess/:entityId', auth, async (req, res) => {
  try {
    const result = await riskService.assessRisk(req.params.entityId, req.body.risk_factors);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
