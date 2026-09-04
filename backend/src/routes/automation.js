const router = require('express').Router();
const automationService = require('../services/automationService');
const auth = require('../middleware/auth');

router.post('/automation/trigger/:workflowId', auth, async (req, res) => {
  try {
    const result = await automationService.triggerWorkflow(req.params.workflowId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
