/**
 * AI Strategy Routes - Claude AI Integration
 * 
 * AI-Enhanced Endpoints:
 * - POST /ai-enhanced/generate-strategy - AI-enhanced strategy generation
 * - GET /ai-context/generate-strategy - Context retrieval
 * 
 * Original Endpoints (Preserved):
 * - Original strategy generation endpoints
 */

const express = require('express');
const router = express.Router();
const service = require('../../services/claude/aiStrategyService');
const originalService = require('../../services/legacy/aiBrainService');
const { authMiddleware } = require('../../middleware/auth');

router.use(authMiddleware);

// AI-enhanced endpoint
router.post('/ai-enhanced/generate-strategy', async (req, res) => {
  try {
    const { objectives, currentState, options } = req.body;
    const result = await service.generateStrategyAI(objectives, currentState, options);
    
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
router.get('/ai-context/generate-strategy', async (req, res) => {
  try {
    const { objectives } = req.query;
    const context = await service.getAIContext('generateStrategy', { objectives });
    
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
router.post('/generate-strategy', async (req, res) => {
  try {
    const { objectives, currentState, options } = req.body;
    let result = await originalService.generateStrategy(objectives, currentState, options);
    
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