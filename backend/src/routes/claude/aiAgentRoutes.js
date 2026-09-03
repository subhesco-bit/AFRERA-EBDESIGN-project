/**
 * AI Agent Routes - Claude AI Integration
 */

const express = require('express');
const router = express.Router();
const service = require('../../services/claude/aiAgentService');
const originalService = require('../../services/legacy/aiAgenticCompanionService');
const { authMiddleware } = require('../../middleware/auth');

router.use(authMiddleware);

router.post('/ai-enhanced/process-task', async (req, res) => {
  try {
    const { agentType, task, context, options } = req.body;
    const result = await service.processAgentTaskAI(agentType, task, context, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({ success: true, status });
});

router.post('/process-task', async (req, res) => {
  try {
    const result = await originalService.processAgentTask(req.body.agentType, req.body.task, req.body.context);
    res.json({ success: true, ai_enhanced: false, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

module.exports = router;