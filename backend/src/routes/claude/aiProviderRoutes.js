/**
 * AI Provider Routes - Claude AI Integration
 */

const express = require('express.js');
const router = express.Router();
const service = require('../../services/claude/aiProviderService.js');
const originalService = require('../../services/legacy/aiBackboneService.js');
const { authMiddleware } = require('../../middleware/auth.js');

router.use(authMiddleware);

router.post('/ai-enhanced/select-provider', async (req, res) => {
  try {
    const { task, context, options } = req.body;
    const result = await service.selectProviderAI(task, context, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({ success: true, status });
});

router.post('/select-provider', async (req, res) => {
  try {
    let result = await originalService.selectProvider(req.body.task, req.body.context);
    res.json({ success: true, ai_enhanced: false, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

module.exports = router;