/**
 * AFRERA E-Commerce Marketing Routes
 * 
 * Marketing and advertising endpoints:
 * - Campaign Management
 * - Sponsored Products
 * - Promotion Management
 * - Retargeting Campaigns
 * - Performance Analytics
 */

const express = require('express');
const router = express.Router();
const ecommerceMarketingController = require('../controllers/ecommerceMarketingController');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

// ============================================================================
// CAMPAIGN MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-marketing/create-campaign
 * @desc    Create marketing campaign
 * @access  Private (Admin/Marketing)
 */
router.post('/create-campaign', authRateLimit, authMiddleware, ecommerceMarketingController.createCampaign);

/**
 * @route   POST /api/ecommerce-marketing/launch-campaign/:campaignId
 * @desc    Launch marketing campaign
 * @access  Private (Admin/Marketing)
 */
router.post('/launch-campaign/:campaignId', authRateLimit, authMiddleware, ecommerceMarketingController.launchCampaign);

/**
 * @route   POST /api/ecommerce-marketing/update-campaign-metrics/:campaignId
 * @desc    Update campaign performance metrics
 * @access  Private (Admin/Marketing)
 */
router.post('/update-campaign-metrics/:campaignId', authRateLimit, authMiddleware, ecommerceMarketingController.updateCampaignMetrics);

// ============================================================================
// SPONSORED PRODUCTS ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-marketing/create-sponsored-product
 * @desc    Create sponsored product listing
 * @access  Private (Seller)
 */
router.post('/create-sponsored-product', authRateLimit, authMiddleware, ecommerceMarketingController.createSponsoredProduct);

/**
 * @route   GET /api/ecommerce-marketing/sponsored-products
 * @desc    Get sponsored products for display
 * @access  Public
 */
router.get('/sponsored-products', ecommerceMarketingController.getSponsoredProducts);

// ============================================================================
// PROMOTION MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-marketing/create-promotion
 * @desc    Create promotion/discount offer
 * @access  Private (Admin/Marketing)
 */
router.post('/create-promotion', authRateLimit, authMiddleware, ecommerceMarketingController.createPromotion);

/**
 * @route   POST /api/ecommerce-marketing/apply-promotion/:promoCode
 * @desc    Apply promotion to order
 * @access  Private
 */
router.post('/apply-promotion/:promoCode', authMiddleware, ecommerceMarketingController.applyPromotion);

// ============================================================================
// RETARGETING ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-marketing/retargeting-cart
 * @desc    Create cart abandonment retargeting campaign
 * @access  Private (System)
 */
router.post('/retargeting-cart', authRateLimit, ecommerceMarketingController.createCartRetargeting);

/**
 * @route   POST /api/ecommerce-marketing/retargeting-product-view
 * @desc    Create product view retargeting
 * @access  Private (System)
 */
router.post('/retargeting-product-view', authRateLimit, ecommerceMarketingController.createProductViewRetargeting);

// ============================================================================
// PERFORMANCE ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-marketing/analytics
 * @desc    Get marketing performance analytics
 * @access  Private (Admin/Marketing)
 */
router.get('/analytics', authMiddleware, ecommerceMarketingController.getMarketingAnalytics);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
