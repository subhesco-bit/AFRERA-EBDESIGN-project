/**
 * AI Coordination Routes - Claude AI Integration
 */

const express = require('express.js');
const router = express.Router();
const service = require('../../services/claude/aiCoordinationService.js');
const originalService = require('../../services/legacy/aiOrchestrationService.js');
const { authMiddleware } = require('../../middleware/auth.js');

router.use(authMiddleware);

router.post('/ai-enhanced/coordinate-ai', async (req, res) => {
  try {
    const { requestType, query, context, options } = req.body;
    const result = await service.coordinateAIRequestAI(requestType, query, context, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({ success: true, status });
});

router.post('/coordinate-ai', async (req, res) => {
  try {
    let result = await originalService.coordinateAIRequest(req.body.requestType, req.body.query, req.body.context);
    res.json({ success: true, ai_enhanced: false, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

module.exports = router;