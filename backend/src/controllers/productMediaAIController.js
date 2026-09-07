/**
 * Product Media AI Controller — thin HTTP layer over productMediaaiBackboneService.
 * See that file's header for the honest not_configured provider discipline.
 */

const productMediaaiBackboneService = require('../services/legacy/productMediaaiBackboneService');
const { logger } = require('../utils/logger');

const productMediaAIController = {
  getProviderStatus: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          imageProviders: productMediaaiBackboneService.listImageProviders(),
          videoProviders: productMediaaiBackboneService.listVideoProviders(),
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
      const result = await productMediaaiBackboneService.requestProductImageGeneration(productId, prompt);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error requesting product image generation', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateProductCartoon: async (req, res) => {
    try {
      const result = await productMediaaiBackboneService.requestProductCartoonGeneration(req.params.productId, req.body?.prompt);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error requesting product cartoon generation', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  buildNutrientVideoScript: async (req, res) => {
    try {
      const { productId } = req.params;
      const script = await productMediaaiBackboneService.buildNutrientComparisonScript(productId);
      res.json({ success: true, data: script });
    } catch (error) {
      logger.error('Error building nutrient comparison script', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateProductVideo: async (req, res) => {
    try {
      const { productId } = req.params;
      const result = await productMediaaiBackboneService.requestProductVideoGeneration(productId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error requesting product video generation', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = productMediaAIController;

