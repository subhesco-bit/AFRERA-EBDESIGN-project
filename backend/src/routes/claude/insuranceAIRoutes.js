/**
 * Insurance AI Routes - Claude AI Integration
 */

const express = require('express');
const router = express.Router();
const service = require('../../services/claude/insuranceAIService');
const originalService = require('../../services/legacy/insuranceService');
const { authMiddleware } = require('../../middleware/auth');

router.use(authMiddleware);

router.post('/ai-enhanced/assess-risk', async (req, res) => {
  try {
    const { insuranceData, options } = req.body;
    const result = await service.assessRiskAI(insuranceData, options);
    res.json({ success: true, ai_enhanced: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({ success: true, status });
});

router.post('/assess-risk', async (req, res) => {
  try {
    const result = await originalService.assessRisk(req.body);
    res.json({ success: true, ai_enhanced: false, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, ai_enhanced: false });
  }
});

module.exports = router;