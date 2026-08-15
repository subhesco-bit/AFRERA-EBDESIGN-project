/**
 * AI Gateway API Routes
 * 
 * RESTful API endpoints for the AI Gateway Service
 * Provides unified access to multiple AI providers (Claude, ChatGPT, Gemini, Copilot)
 */

const express = require('express');
const router = express.Router();
const aiGatewayService = require('../services/aiGatewayService');

/**
 * POST /api/ai-gateway/chat
 * Send chat request to AI gateway
 */
router.post('/chat', async (req, res) => {
  try {
    const { model, messages, options } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const result = await aiGatewayService.routeRequest(model, messages, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI Gateway chat error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/ai-gateway/statistics
 * Get gateway statistics
 */
router.get('/statistics', (req, res) => {
  try {
    const stats = aiGatewayService.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('AI Gateway statistics error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/ai-gateway/providers
 * Get available providers
 */
router.get('/providers', (req, res) => {
  try {
    const providers = Object.keys(aiGatewayService.providers).map(key => ({
      key,
      name: aiGatewayService.providers[key].name,
      enabled: aiGatewayService.providers[key].enabled,
      health: aiGatewayService.providers[key].health,
      lastCheck: aiGatewayService.providers[key].lastCheck
    }));
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('AI Gateway providers error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/ai-gateway/models/:provider
 * Get available models for a provider
 */
router.get('/models/:provider', (req, res) => {
  try {
    const { provider } = req.params;
    const models = aiGatewayService.getAvailableModels(provider);
    
    res.json({
      success: true,
      data: {
        provider,
        models
      }
    });
  } catch (error) {
    console.error('AI Gateway models error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * PUT /api/ai-gateway/providers/:provider/enable
 * Enable a provider
 */
router.put('/providers/:provider/enable', (req, res) => {
  try {
    const { provider } = req.params;
    const success = aiGatewayService.setProviderEnabled(provider, true);
    
    if (success) {
      res.json({
        success: true,
        message: `Provider ${provider} enabled`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Provider ${provider} not found`
      });
    }
  } catch (error) {
    console.error('AI Gateway enable error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * PUT /api/ai-gateway/providers/:provider/disable
 * Disable a provider
 */
router.put('/providers/:provider/disable', (req, res) => {
  try {
    const { provider } = req.params;
    const success = aiGatewayService.setProviderEnabled(provider, false);
    
    if (success) {
      res.json({
        success: true,
        message: `Provider ${provider} disabled`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Provider ${provider} not found`
      });
    }
  } catch (error) {
    console.error('AI Gateway disable error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/ai-gateway/stream
 * Stream chat response
 */
router.post('/stream', async (req, res) => {
  try {
    const { model, messages, options } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamOptions = { ...options, stream: true };
    const result = await aiGatewayService.routeRequest(model, messages, streamOptions);
    
    // Send streaming response
    res.write(`data: ${JSON.stringify({ success: true, data: result })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI Gateway stream error:', error);
    res.write(`data: ${JSON.stringify({ success: false, error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
