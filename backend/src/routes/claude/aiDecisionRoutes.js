/**
 * AI Decision Routes - Claude AI Integration
 * 
 * AI-Enhanced Endpoints:
 * - POST /ai-enhanced/predict-demand - AI-enhanced demand prediction
 * - POST /ai-enhanced/optimize-price - AI-enhanced price optimization
 * - POST /ai-enhanced/assess-credit-risk - AI-enhanced credit risk assessment
 * - POST /ai-enhanced/detect-fraud - AI-enhanced fraud detection
 * - POST /ai-enhanced/generate-recommendations - AI-enhanced recommendation generation
 * - GET /ai-context/* - Context retrieval for operations
 * - GET /ai-capability - AI capability status
 * 
 * Original Endpoints (Preserved):
 * - POST /predict/demand - Original demand prediction
 * - POST /optimize/price - Original price optimization
 * - POST /assess/credit-risk - Original credit risk assessment
 * - POST /detect/fraud - Original fraud detection
 * - POST /recommend - Original recommendation generation
 */

const express = require('express');
const router = express.Router();
const service = require('../../services/claude/aiDecisionService');
const originalService = require('../../services/legacy/aiService');
const { authMiddleware } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware);

// ============================================================================
// AI-ENHANCED ENDPOINTS
// ============================================================================

/**
 * AI-enhanced demand prediction
 */
router.post('/ai-enhanced/predict-demand', async (req, res) => {
  try {
    const { productId, timeHorizon, options } = req.body;
    const result = await service.predictDemandAI(productId, timeHorizon, options);
    
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

/**
 * AI-enhanced price optimization
 */
router.post('/ai-enhanced/optimize-price', async (req, res) => {
  try {
    const { productId, marketConditions, options } = req.body;
    let result = await service.optimizePriceAI(productId, marketConditions, options);
    
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

/**
 * AI-enhanced credit risk assessment
 */
router.post('/ai-enhanced/assess-credit-risk', async (req, res) => {
  try {
    const { farmerId, loanApplication, options } = req.body;
    let result = await service.assessCreditRiskAI(farmerId, loanApplication, options);
    
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

/**
 * AI-enhanced fraud detection
 */
router.post('/ai-enhanced/detect-fraud', async (req, res) => {
  try {
    const { transactionData, options } = req.body;
    let result = await service.detectFraudAI(transactionData, options);
    
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

/**
 * AI-enhanced recommendation generation
 */
router.post('/ai-enhanced/generate-recommendations', async (req, res) => {
  try {
    const { userId, context, options } = req.body;
    let result = await service.generateRecommendationsAI(userId, context, options);
    
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

// ============================================================================
// CONTEXT RETRIEVAL ENDPOINTS
// ============================================================================

/**
 * Get AI context for demand prediction
 */
router.get('/ai-context/predict-demand', async (req, res) => {
  try {
    const { productId, timeHorizon } = req.query;
    const context = await service.getAIContext('predictDemand', { productId, timeHorizon });
    
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

/**
 * Get AI context for price optimization
 */
router.get('/ai-context/optimize-price', async (req, res) => {
  try {
    const { productId } = req.query;
    let context = await service.getAIContext('optimizePrice', { productId });
    
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

/**
 * Get AI context for credit risk assessment
 */
router.get('/ai-context/assess-credit-risk', async (req, res) => {
  try {
    const { farmerId } = req.query;
    let context = await service.getAIContext('assessCreditRisk', { farmerId });
    
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

/**
 * Get AI context for fraud detection
 */
router.get('/ai-context/detect-fraud', async (req, res) => {
  try {
    const { transactionId } = req.query;
    let context = await service.getAIContext('detectFraud', { transactionId });
    
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

/**
 * Get AI context for recommendation generation
 */
router.get('/ai-context/generate-recommendations', async (req, res) => {
  try {
    const { userId } = req.query;
    let context = await service.getAIContext('generateRecommendations', { userId });
    
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

// ============================================================================
// AI CAPABILITY STATUS ENDPOINT
// ============================================================================

/**
 * Get AI capability status
 */
router.get('/ai-capability', (req, res) => {
  const status = service.getAICapabilityStatus();
  res.json({
    success: true,
    status: status
  });
});

// ============================================================================
// ORIGINAL ENDPOINTS (PRESERVED FOR BACKWARD COMPATIBILITY)
// ============================================================================

/**
 * Original demand prediction endpoint
 */
router.post('/predict/demand', async (req, res) => {
  try {
    const { productId, timeHorizon } = req.body;
    let result = await originalService.predictDemand(productId, timeHorizon);
    
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

/**
 * Original price optimization endpoint
 */
router.post('/optimize/price', async (req, res) => {
  try {
    const { productId, marketConditions, options } = req.body;
    let result = await originalService.optimizePrice(productId, marketConditions, options);
    
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

/**
 * Original credit risk assessment endpoint
 */
router.post('/assess/credit-risk', async (req, res) => {
  try {
    const { farmerId, loanApplication } = req.body;
    let result = await originalService.assessCreditRisk(farmerId, loanApplication);
    
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

/**
 * Original fraud detection endpoint
 */
router.post('/detect/fraud', async (req, res) => {
  try {
    const { transactionData, options } = req.body;
    let result = await originalService.detectFraud(transactionData, options);
    
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

/**
 * Original recommendation generation endpoint
 */
router.post('/recommend', async (req, res) => {
  try {
    const { userId, context, options } = req.body;
    let result = await originalService.generateRecommendations(userId, context, options);
    
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