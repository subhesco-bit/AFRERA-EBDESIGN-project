/**
 * AI Backbone Controller - Real AI Integration
 * 
 * REST API controller for AI backbone with real AI provider integrations
 * Handles HTTP requests and responses for AI operations
 */

const aiBackboneService = require('../services/aiBackboneService');
const { logger } = require('../utils/logger');

const aiBackboneController = {
  /**
   * Call AI with prompt
   */
  callAI: async (req, res) => {
    try {
      const { prompt, provider, options } = req.body;
      const result = await aiBackboneService.callAI(prompt, { provider, ...options });
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error calling AI', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get AI provider status
   */
  getAIProviderStatus: async (req, res) => {
    try {
      const status = aiBackboneService.getAIProviderStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Error getting AI provider status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Switch AI provider
   */
  switchProvider: async (req, res) => {
    try {
      const { provider } = req.body;
      const result = aiBackboneService.switchProvider(provider);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error switching AI provider', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * Reset AI statistics
   */
  resetAIStatistics: async (req, res) => {
    try {
      const result = aiBackboneService.resetAIStatistics();
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error resetting AI statistics', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Agricultural decision support
   */
  supportAgriculturalDecision: async (req, res) => {
    try {
      const result = await aiBackboneService.supportAgriculturalDecision(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in agricultural decision support', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Livestock optimization
   */
  optimizeLivestock: async (req, res) => {
    try {
      const result = await aiBackboneService.optimizeLivestock(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error in livestock optimization', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = aiBackboneController;
