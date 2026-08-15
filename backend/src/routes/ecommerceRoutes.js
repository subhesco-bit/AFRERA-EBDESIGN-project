/**
 * AFRERA E-Commerce Routes
 * 
 * Comprehensive marketplace API routes with authentication and rate limiting.
 */

const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');
const { adminMiddleware } = require('../middleware/admin');

// ============================================================================
// PRODUCT LISTING ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce/listings
 * @desc    Create a new product listing with AI optimization
 * @access  Private (Seller)
 */
router.post('/listings', authRateLimit, authMiddleware, ecommerceController.createListing);

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
router.put('/listings/:id', authRateLimit, authMiddleware, ecommerceController.updateListing);

/**
 * @route   DELETE /api/ecommerce/listings/:id
 * @desc    Delete listing
 * @access  Private (Seller only)
 */
router.delete('/listings/:id', authRateLimit, authMiddleware, ecommerceController.deleteListing);

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
router.post('/price-recommendation', authRateLimit, authMiddleware, ecommerceController.getPriceRecommendation);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
