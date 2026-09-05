const router = require('express').Router();
const complianceService = require('../services/complianceTrackingService');
const auth = require('../middleware/auth');

router.post('/compliance/track/:entityId/:regulationId', auth, async (req, res) => {
  try {
    const result = await complianceService.trackCompliance(req.params.entityId, req.params.regulationId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
