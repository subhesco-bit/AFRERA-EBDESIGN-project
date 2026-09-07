/**
 * Express router for the advanced AI service. Split out of the former
 * monolithic services/advancedAIService.js (M11).
 */

const express = require('express');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { ADVANCED_AI_MODELS } = require('./models');
const { advancedPredictDemand } = require('./demandForecasting');
const { advancedOptimizePrice } = require('./priceOptimization');
const { advancedAssessCreditRisk } = require('./creditScoring');
const { advancedDetectFraud } = require('./fraudDetection');
const { advancedGenerateRecommendations } = require('./recommendations');
const { detectCropDisease } = require('./cropDisease');

const router = express.Router();

/**
 * POST /api/v1/advanced-ai/predict-demand
 * Advanced demand forecasting
 */
router.post('/predict-demand', authMiddleware, async (req, res) => {
  try {
    const { product_id, time_horizon, include_explanations } = req.body;
    const result = await advancedPredictDemand(product_id, time_horizon, include_explanations);
    res.json(result);
  } catch (error) {
    logger.error('Advanced demand prediction API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to predict demand' });
  }
});

/**
 * POST /api/v1/advanced-ai/optimize-price
 * Advanced price optimization
 */
router.post('/optimize-price', authMiddleware, async (req, res) => {
  try {
    const { product_id, current_price, context } = req.body;
    const result = await advancedOptimizePrice(product_id, current_price, context);
    res.json(result);
  } catch (error) {
    logger.error('Advanced price optimization API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to optimize price' });
  }
});

/**
 * POST /api/v1/advanced-ai/assess-credit-risk
 * Advanced credit risk assessment
 */
router.post('/assess-credit-risk', authMiddleware, async (req, res) => {
  try {
    const { farmer_id, include_explanations } = req.body;
    const result = await advancedAssessCreditRisk(farmer_id, include_explanations);
    res.json(result);
  } catch (error) {
    logger.error('Advanced credit risk assessment API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to assess credit risk' });
  }
});

/**
 * POST /api/v1/advanced-ai/detect-fraud
 * Advanced fraud detection
 */
router.post('/detect-fraud', authMiddleware, async (req, res) => {
  try {
    const { transaction_data, user_id } = req.body;
    const result = await advancedDetectFraud(transaction_data, user_id);
    res.json(result);
  } catch (error) {
    logger.error('Advanced fraud detection API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to detect fraud' });
  }
});

/**
 * POST /api/v1/advanced-ai/recommendations
 * Advanced recommendations
 */
router.post('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { user_id, context } = req.body;
    const result = await advancedGenerateRecommendations(user_id, context);
    res.json(result);
  } catch (error) {
    logger.error('Advanced recommendations API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * POST /api/v1/advanced-ai/detect-crop-disease
 * Crop disease detection
 */
router.post('/detect-crop-disease', authMiddleware, async (req, res) => {
  try {
    const { image_data, additional_data } = req.body;
    const result = await detectCropDisease(image_data, additional_data);
    res.json(result);
  } catch (error) {
    logger.error('Crop disease detection API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to detect crop disease' });
  }
});

/**
 * GET /api/v1/advanced-ai/models
 * Get available AI models
 */
router.get('/models', (req, res) => {
  res.json({
    models: ADVANCED_AI_MODELS,
    total_models: Object.keys(ADVANCED_AI_MODELS).length
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'advanced-ai',
    models_available: Object.keys(ADVANCED_AI_MODELS).length,
    capabilities: [
      'demand_forecasting',
      'price_optimization',
      'credit_scoring',
      'fraud_detection',
      'recommendations',
      'crop_disease_detection',
      'yield_prediction',
      'supply_chain_optimization'
    ]
  });
});

module.exports = router;
