/**
 * Product Media AI Controller — thin HTTP layer over productMediaAIService.
 * See that file's header for the honest not_configured provider discipline.
 */

const productMediaAIService = require('../services/legacy/productMediaAIService');
const { logger } = require('../utils/logger');

const productMediaAIController = {
  getProviderStatus: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          imageProviders: productMediaAIService.listImageProviders(),
          videoProviders: productMediaAIService.listVideoProviders(),
        },
      });
    } catch (error) {
      logger.error('Error getting product media AI provider status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateProductImage: async (req, res) => {
    try {
      const { productId } = req.params;
      const { prompt } = req.body;
      const result = await productMediaAIService.requestProductImageGeneration(productId, prompt);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error requesting product image generation', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  buildNutrientVideoScript: async (req, res) => {
    try {
      const { productId } = req.params;
      const script = await productMediaAIService.buildNutrientComparisonScript(productId);
      res.json({ success: true, data: script });
    } catch (error) {
      logger.error('Error building nutrient comparison script', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateProductVideo: async (req, res) => {
    try {
      const { productId } = req.params;
      const result = await productMediaAIService.requestProductVideoGeneration(productId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error requesting product video generation', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = productMediaAIController;
