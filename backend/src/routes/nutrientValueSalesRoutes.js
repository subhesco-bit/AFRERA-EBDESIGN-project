/**
 * AFRERA Nutrient Value Sales Routes
 * 
 * Nutrient-value-based sales endpoints:
 * - Nutrient-Value Pricing
 * - Nutrient Content Verification
 * - Nutrient-Value Listings
 * - Nutrient Quality Tiers
 * - Nutrient-Based Comparison
 * - Nutrient Certification
 * - Nutrient-Based Commission
 * - Nutrient-Value Search
 */

const express = require('express');
const router = express.Router();
const nutrientValueSalesController = require('../controllers/nutrientValueSalesController');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

// ============================================================================
// NUTRIENT-VALUE PRICING ROUTES
// ============================================================================

/**
 * @route   POST /api/nutrient-value/calculate-price/:productId
 * @desc    Calculate nutrient-value-based price for product
 * @access  Private (Admin/Seller)
 */
router.post('/calculate-price/:productId', authRateLimit, authMiddleware, nutrientValueSalesController.calculateNutrientValuePrice);

// ============================================================================
// NUTRIENT CONTENT VERIFICATION ROUTES
// ============================================================================

/**
 * @route   POST /api/nutrient-value/submit-verification
 * @desc    Submit nutrient content for lab verification
 * @access  Private (Seller)
 */
router.post('/submit-verification', authRateLimit, authMiddleware, nutrientValueSalesController.submitNutrientContent);

/**
 * @route   POST /api/nutrient-value/approve-verification/:verificationId
 * @desc    Approve nutrient content verification
 * @access  Private (Admin/Lab)
 */
router.post('/approve-verification/:verificationId', authRateLimit, authMiddleware, nutrientValueSalesController.approveNutrientVerification);

// ============================================================================
// NUTRIENT-VALUE LISTINGS ROUTES
// ============================================================================

/**
 * @route   POST /api/nutrient-value/create-listing
 * @desc    Create nutrient-value-based product listing
 * @access  Private (Seller)
 */
router.post('/create-listing', authRateLimit, authMiddleware, nutrientValueSalesController.createNutrientValueListing);

// ============================================================================
// NUTRIENT QUALITY TIERS ROUTES
// ============================================================================

/**
 * @route   POST /api/nutrient-value/assign-tier/:productId
 * @desc    Assign nutrient quality tier to product
 * @access  Private (Admin)
 */
router.post('/assign-tier/:productId', authRateLimit, authMiddleware, nutrientValueSalesController.assignNutrientTier);

// ============================================================================
// NUTRIENT-BASED COMPARISON ROUTES
// ============================================================================

/**
 * @route   POST /api/nutrient-value/compare-products
 * @desc    Compare products by nutrient value
 * @access  Public
 */
router.post('/compare-products', nutrientValueSalesController.compareProductsByNutrient);

// ============================================================================
// NUTRIENT CERTIFICATION ROUTES
// ============================================================================

/**
 * @route   POST /api/nutrient-value/issue-certificate
 * @desc    Issue nutrient quality certificate
 * @access  Private (Admin/Certifying Body)
 */
router.post('/issue-certificate', authRateLimit, authMiddleware, nutrientValueSalesController.issueNutrientCertificate);

// ============================================================================
// NUTRIENT-BASED COMMISSION ROUTES
// ============================================================================

/**
 * @route   POST /api/nutrient-value/calculate-commission/:orderId
 * @desc    Calculate commission based on nutrient quality
 * @access  Private (Admin)
 */
router.post('/calculate-commission/:orderId', authRateLimit, authMiddleware, nutrientValueSalesController.calculateNutrientBasedCommission);

// ============================================================================
// NUTRIENT-VALUE SEARCH ROUTES
// ============================================================================

/**
 * @route   GET /api/nutrient-value/search
 * @desc    Search products by nutrient criteria
 * @access  Public
 */
router.get('/search', nutrientValueSalesController.searchByNutrientCriteria);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
