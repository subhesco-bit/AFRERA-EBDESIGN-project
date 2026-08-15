/**
 * AFRERA E-Commerce AI Controller
 * 
 * Handles all AI-powered endpoints for E-commerce marketplace:
 * - Customer Segmentation (RFM, behavioral)
 * - Demand Forecasting
 * - Inventory Optimization
 * - Product Recommendations
 * - Sales Prediction
 * - Customer Lifetime Value
 * - Market Basket Analysis
 */

const ecommerceAIService = require('../services/ecommerceAIService');
const { logger } = require('../utils/logger');

// ============================================================================
// CUSTOMER SEGMENTATION ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-ai/segment-customers-rfm
 * Segment all customers using RFM analysis
 */
async function segmentCustomersRFM(req, res) {
  try {
    const result = await ecommerceAIService.segmentCustomersRFM();
    
    res.json(result);
  } catch (error) {
    logger.error('Error in segmentCustomersRFM controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to segment customers by RFM'
    });
  }
}

/**
 * POST /api/ecommerce-ai/segment-customers-behavioral
 * Segment all customers using behavioral analysis
 */
async function segmentCustomersBehavioral(req, res) {
  try {
    const result = await ecommerceAIService.segmentCustomersBehavioral();
    
    res.json(result);
  } catch (error) {
    logger.error('Error in segmentCustomersBehavioral controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to segment customers by behavior'
    });
  }
}

// ============================================================================
// DEMAND FORECASTING ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-ai/forecast-demand/:productId
 * Forecast demand for a specific product
 */
async function forecastProductDemand(req, res) {
  try {
    const { productId } = req.params;
    const { horizonDays } = req.body;
    
    const result = await ecommerceAIService.forecastProductDemand(productId, horizonDays || 30);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in forecastProductDemand controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to forecast product demand'
    });
  }
}

// ============================================================================
// INVENTORY OPTIMIZATION ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-ai/optimize-inventory/:productId
 * Optimize inventory levels for a product
 */
async function optimizeInventory(req, res) {
  try {
    const { productId } = req.params;
    
    const result = await ecommerceAIService.optimizeInventory(productId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in optimizeInventory controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to optimize inventory'
    });
  }
}

// ============================================================================
// PRODUCT RECOMMENDATIONS ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-ai/recommendations/:userId
 * Get personalized product recommendations for user
 */
async function getPersonalizedRecommendations(req, res) {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    
    const result = await ecommerceAIService.getPersonalizedRecommendations(userId, parseInt(limit) || 10);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getPersonalizedRecommendations controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get personalized recommendations'
    });
  }
}

// ============================================================================
// SALES PREDICTION ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-ai/predict-sales
 * Predict sales for category or overall
 */
async function predictSales(req, res) {
  try {
    const { categoryId, periodDays } = req.body;
    
    const result = await ecommerceAIService.predictSales(categoryId, periodDays || 30);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in predictSales controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to predict sales'
    });
  }
}

// ============================================================================
// CUSTOMER LIFETIME VALUE ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-ai/clv/:userId
 * Calculate customer lifetime value
 */
async function calculateCustomerLifetimeValue(req, res) {
  try {
    const { userId } = req.params;
    
    const result = await ecommerceAIService.calculateCustomerLifetimeValue(userId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in calculateCustomerLifetimeValue controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate customer lifetime value'
    });
  }
}

// ============================================================================
// MARKET BASKET ANALYSIS ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-ai/market-basket
 * Analyze market basket for cross-sell opportunities
 */
async function analyzeMarketBasket(req, res) {
  try {
    const { categoryId } = req.query;
    
    const result = await ecommerceAIService.analyzeMarketBasket(categoryId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in analyzeMarketBasket controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze market basket'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Customer Segmentation
  segmentCustomersRFM,
  segmentCustomersBehavioral,
  
  // Demand Forecasting
  forecastProductDemand,
  
  // Inventory Optimization
  optimizeInventory,
  
  // Product Recommendations
  getPersonalizedRecommendations,
  
  // Sales Prediction
  predictSales,
  
  // Customer Lifetime Value
  calculateCustomerLifetimeValue,
  
  // Market Basket Analysis
  analyzeMarketBasket
};
