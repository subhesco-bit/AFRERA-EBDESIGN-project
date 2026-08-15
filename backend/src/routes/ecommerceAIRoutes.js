/**
 * AFRERA E-Commerce AI Routes
 * 
 * AI-powered marketplace endpoints:
 * - Customer Segmentation
 * - Demand Forecasting
 * - Inventory Optimization
 * - Product Recommendations
 * - Sales Prediction
 * - Customer Lifetime Value
 * - Market Basket Analysis
 */

const express = require('express');
const router = express.Router();
const ecommerceAIController = require('../controllers/ecommerceAIController');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

// ============================================================================
// CUSTOMER SEGMENTATION ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-ai/segment-customers-rfm
 * @desc    Segment all customers using RFM analysis
 * @access  Private (Admin)
 */
router.post('/segment-customers-rfm', authRateLimit, authMiddleware, ecommerceAIController.segmentCustomersRFM);

/**
 * @route   POST /api/ecommerce-ai/segment-customers-behavioral
 * @desc    Segment all customers using behavioral analysis
 * @access  Private (Admin)
 */
router.post('/segment-customers-behavioral', authRateLimit, authMiddleware, ecommerceAIController.segmentCustomersBehavioral);

// ============================================================================
// DEMAND FORECASTING ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-ai/forecast-demand/:productId
 * @desc    Forecast demand for a specific product
 * @access  Private (Admin/Seller)
 */
router.post('/forecast-demand/:productId', authRateLimit, authMiddleware, ecommerceAIController.forecastProductDemand);

// ============================================================================
// INVENTORY OPTIMIZATION ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-ai/optimize-inventory/:productId
 * @desc    Optimize inventory levels for a product
 * @access  Private (Admin/Seller)
 */
router.post('/optimize-inventory/:productId', authRateLimit, authMiddleware, ecommerceAIController.optimizeInventory);

// ============================================================================
// PRODUCT RECOMMENDATIONS ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-ai/recommendations/:userId
 * @desc    Get personalized product recommendations for user
 * @access  Private
 */
router.get('/recommendations/:userId', authMiddleware, ecommerceAIController.getPersonalizedRecommendations);

// ============================================================================
// SALES PREDICTION ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-ai/predict-sales
 * @desc    Predict sales for category or overall
 * @access  Private (Admin)
 */
router.post('/predict-sales', authRateLimit, authMiddleware, ecommerceAIController.predictSales);

// ============================================================================
// CUSTOMER LIFETIME VALUE ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-ai/clv/:userId
 * @desc    Calculate customer lifetime value
 * @access  Private (Admin)
 */
router.get('/clv/:userId', authMiddleware, ecommerceAIController.calculateCustomerLifetimeValue);

// ============================================================================
// MARKET BASKET ANALYSIS ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-ai/market-basket
 * @desc    Analyze market basket for cross-sell opportunities
 * @access  Private (Admin)
 */
router.get('/market-basket', authMiddleware, ecommerceAIController.analyzeMarketBasket);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
