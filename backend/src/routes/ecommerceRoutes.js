/**
 * AFRERA E-Commerce Routes
 *
 * Comprehensive marketplace API routes with authentication and rate limiting.
 */

const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { adminMiddleware } = require('../middleware/admin');

// ============================================================================
// PRODUCT LISTING ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce/listings
 * @desc    Create a new product listing with AI optimization
 * @access  Private (Seller)
 */
router.post('/listings', authLimiter, authMiddleware, ecommerceController.createListing);

/**
 * @route   GET /api/ecommerce/listings
 * @desc    Get marketplace listings with AI-powered ranking
 * @access  Public
 */
router.get('/listings', ecommerceController.getListings);

/**
 * @route   GET /api/ecommerce/listings/:id
 * @desc    Get single listing details
 * @access  Public
 */
router.get('/listings/:id', ecommerceController.getListing);

/**
 * @route   PUT /api/ecommerce/listings/:id
 * @desc    Update listing
 * @access  Private (Seller only)
 */
router.put('/listings/:id', authLimiter, authMiddleware, ecommerceController.updateListing);

/**
 * @route   DELETE /api/ecommerce/listings/:id
 * @desc    Delete listing
 * @access  Private (Seller only)
 */
router.delete('/listings/:id', authLimiter, authMiddleware, ecommerceController.deleteListing);

// ============================================================================
// SELLER ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce/seller/analytics
 * @desc    Get seller dashboard analytics
 * @access  Private (Seller)
 */
router.get('/seller/analytics', authMiddleware, ecommerceController.getSellerAnalytics);

/**
 * @route   GET /api/ecommerce/seller/listings
 * @desc    Get seller's own listings
 * @access  Private (Seller)
 */
router.get('/seller/listings', authMiddleware, ecommerceController.getSellerListings);

// ============================================================================
// GI MARKETPLACE ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce/gi-listings
 * @desc    Get GI marketplace listings with premium pricing
 * @access  Public
 */
router.get('/gi-listings', ecommerceController.getGIListings);

// ============================================================================
// MARKET INTELLIGENCE ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce/market/price-trends/:categoryId
 * @desc    Get market price trends for category
 * @access  Public
 */
router.get('/market/price-trends/:categoryId', ecommerceController.getPriceTrends);

/**
 * @route   GET /api/ecommerce/market/demand/:categoryId
 * @desc    Get market demand analysis
 * @access  Public
 */
router.get('/market/demand/:categoryId', ecommerceController.getDemandAnalysis);

/**
 * @route   POST /api/ecommerce/price-recommendation
 * @desc    Get AI price recommendation for a product
 * @access  Private (Seller)
 */
router.post('/price-recommendation', authLimiter, authMiddleware, ecommerceController.getPriceRecommendation);

// ============================================================================
// SMART PRODUCT LISTING (NEW - Enhanced Integration)
// ============================================================================

/**
 * @route   POST /api/ecommerce/products/create-listing
 * @desc    Create complete product listing: Smart images + Nutrient pricing + Dynamic pricing
 * @access  Private (Farmer/Seller)
 * @fields  name, basePrice, quantity, state, nutrients, farmerId, description, isOrganic
 */
router.post('/products/create-listing', authLimiter, authMiddleware, ecommerceController.createSmartListing);

/**
 * @route   POST /api/ecommerce/products/batch/create
 * @desc    Create multiple listings with 99% token optimization
 * @access  Private (Farmer/Seller)
 */
router.post('/products/batch/create', authLimiter, authMiddleware, ecommerceController.createBatchListings);

// ============================================================================
// DYNAMIC PRICING (NEW - Real-time Market Data)
// ============================================================================

/**
 * @route   POST /api/ecommerce/pricing/dynamic
 * @desc    Calculate dynamic price based on nutrients + market data + location + demand
 * @access  Public
 */
router.post('/pricing/dynamic', ecommerceController.calculateDynamicPrice);

/**
 * @route   PUT /api/ecommerce/products/:productId/price
 * @desc    Update product price with latest market data
 * @access  Private (Seller)
 */
router.put('/products/:productId/price', authLimiter, authMiddleware, ecommerceController.updateProductPrice);

/**
 * @route   GET /api/ecommerce/pricing/recommendations
 * @desc    Get pricing strategy recommendations with profit analysis
 * @access  Private (Seller)
 */
router.get('/pricing/recommendations', authLimiter, authMiddleware, ecommerceController.getPricingRecommendations);

// ============================================================================
// NUTRIENT-BASED PRICING (NEW - Health & Medical Integration)
// ============================================================================

/**
 * @route   POST /api/ecommerce/pricing/nutrient-based
 * @desc    Calculate nutrient-based premium (high protein, fiber, organic, etc.)
 * @access  Public
 */
router.post('/pricing/nutrient-based', ecommerceController.calculateNutrientPrice);

/**
 * @route   POST /api/ecommerce/pricing/health-score
 * @desc    Get health score and medical benefits for product
 * @access  Public
 */
router.post('/pricing/health-score', ecommerceController.getHealthScore);

// ============================================================================
// SMART IMAGE MANAGEMENT (NEW - AI + Cache + Master Chef Integration)
// ============================================================================

/**
 * @route   GET /api/ecommerce/products/:productName/image
 * @desc    Get product image (smart: cached → Master Chef DB → AI generate)
 * @access  Public
 */
router.get('/products/:productName/image', ecommerceController.getProductImage);

/**
 * @route   POST /api/ecommerce/products/image/nutrient-highlight
 * @desc    Generate image with nutrient badges and health rating overlay
 * @access  Public
 */
router.post('/products/image/nutrient-highlight', ecommerceController.generateNutrientHighlight);

/**
 * @route   POST /api/ecommerce/products/batch/images
 * @desc    Batch process product images with 99% token optimization
 * @access  Private (Seller)
 */
router.post('/products/batch/images', authLimiter, authMiddleware, ecommerceController.processBatchImages);

// ============================================================================
// MARKET INTELLIGENCE (NEW - Real-time Price Extraction)
// ============================================================================

/**
 * @route   POST /api/ecommerce/market/prices
 * @desc    Extract real-time prices from Amazon, Flipkart, BigBasket, local market
 * @access  Public
 */
router.post('/market/prices', ecommerceController.getMarketPrices);

/**
 * @route   POST /api/ecommerce/market/competitors
 * @desc    Analyze competitor pricing and positioning
 * @access  Public
 */
router.post('/market/competitors', ecommerceController.analyzeCompetitors);

// ============================================================================
// FARMER ANALYTICS (NEW - Enhanced Dashboard)
// ============================================================================

/**
 * @route   GET /api/ecommerce/farmers/:farmerId/products
 * @desc    Get farmer's products with pricing and profit metrics
 * @access  Private (Farmer)
 */
router.get('/farmers/:farmerId/products', authMiddleware, ecommerceController.getFarmerProducts);

/**
 * @route   GET /api/ecommerce/farmers/:farmerId/insights
 * @desc    Get farmer insights: revenue, profit, margin, recommendations
 * @access  Private (Farmer)
 */
router.get('/farmers/:farmerId/insights', authMiddleware, ecommerceController.getFarmerInsights);

/**
 * @route   GET /api/ecommerce/farmers/:farmerId/market-position
 * @desc    Get farmer's market position vs competitors
 * @access  Private (Farmer)
 */
router.get('/farmers/:farmerId/market-position', authMiddleware, ecommerceController.getFarmerMarketPosition);

// ============================================================================
// PRODUCT ANALYTICS (NEW - Performance Metrics)
// ============================================================================

/**
 * @route   GET /api/ecommerce/analytics/product/:productId
 * @desc    Get product performance analytics (pricing, profit, demand, health score)
 * @access  Private (Seller)
 */
router.get('/analytics/product/:productId', authMiddleware, ecommerceController.getProductAnalytics);

/**
 * @route   GET /api/ecommerce/analytics/category/:categoryId
 * @desc    Get category-wide analytics and trends
 * @access  Public
 */
router.get('/analytics/category/:categoryId', ecommerceController.getCategoryAnalytics);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;

