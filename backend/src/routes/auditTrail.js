const router = require('express').Router();
const auditService = require('../services/auditTrailService');
const auth = require('../middleware/auth');

router.post('/audit/log/:userId/:action/:resourceId', auth, async (req, res) => {
  try {
    const result = await auditService.logAuditEvent(req.params.userId, req.params.action, req.params.resourceId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
