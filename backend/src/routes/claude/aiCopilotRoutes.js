/**
 * AI Copilot Routes - Claude AI Integration
 * 
 * AI-Enhanced Endpoints:
 * - POST /ai-enhanced/generate-copilot-response - AI-enhanced copilot response
 * - GET /ai-context/copilot - Context retrieval
 * 
 * Original Endpoints (Preserved):
 * - Original copilot endpoints
 */

const express = require('express');
const router = express.Router();
const service = require('../../services/claude/aiCopilotService');
const originalService = require('../../services/legacy/aiCopilotService');
const { authMiddleware } = require('../../middleware/auth');

router.use(authMiddleware);

// AI-enhanced endpoint
router.post('/ai-enhanced/generate-copilot-response', async (req, res) => {
  try {
    const { copilotType, message, context, session } = req.body;
    const result = await service.generateCopilotResponseAI(copilotType, message, context, session);
    
    res.json({
      success: true,
      ai_enhanced: true,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      ai_enhanced: false
    });
  }
});

// Context retrieval endpoint
router.get('/ai-context/copilot', async (req, res) => {
  try {
    const { copilotType } = req.query;
    const context = await service.getAIContext('generateCopilotResponse', { copilotType });
    
    res.json({
      success: true,
      context: context
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI capability endpoint
router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({
    success: true,
    status: status
  });
});

// Original endpoints (preserved)
router.post('/generate-copilot-response', async (req, res) => {
  try {
    const { copilotType, message, context, session } = req.body;
    let result = await originalService.generateCopilotResponse(copilotType, message, context, session);
    
    res.json({
      success: true,
      ai_enhanced: false,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      ai_enhanced: false
    });
  }
});

module.exports = router;