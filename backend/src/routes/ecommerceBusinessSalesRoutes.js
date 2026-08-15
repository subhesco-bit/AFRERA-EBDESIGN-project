/**
 * AFRERA E-Commerce Business Sales Routes
 * 
 * B2B and business sales endpoints:
 * - Bulk Order Management
 * - Contract Farming
 * - Quotation Management
 * - Sales Analytics
 * - Commission Management
 */

const express = require('express');
const router = express.Router();
const ecommerceBusinessSalesController = require('../controllers/ecommerceBusinessSalesController');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

// ============================================================================
// B2B BULK ORDER ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-business/create-bulk-order
 * @desc    Create B2B bulk order request
 * @access  Private (Buyer)
 */
router.post('/create-bulk-order', authRateLimit, authMiddleware, ecommerceBusinessSalesController.createBulkOrder);

/**
 * @route   POST /api/ecommerce-business/submit-quotation
 * @desc    Submit quotation for bulk order
 * @access  Private (Seller)
 */
router.post('/submit-quotation', authRateLimit, authMiddleware, ecommerceBusinessSalesController.submitQuotation);

/**
 * @route   POST /api/ecommerce-business/accept-quotation/:quotationId
 * @desc    Accept quotation and create order
 * @access  Private (Buyer)
 */
router.post('/accept-quotation/:quotationId', authRateLimit, authMiddleware, ecommerceBusinessSalesController.acceptQuotation);

// ============================================================================
// CONTRACT FARMING ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-business/create-contract-farming
 * @desc    Create contract farming agreement
 * @access  Private (Buyer)
 */
router.post('/create-contract-farming', authRateLimit, authMiddleware, ecommerceBusinessSalesController.createContractFarming);

/**
 * @route   POST /api/ecommerce-business/record-milestone
 * @desc    Record contract farming milestone
 * @access  Private (Admin/Buyer/Farmer)
 */
router.post('/record-milestone', authRateLimit, authMiddleware, ecommerceBusinessSalesController.recordContractMilestone);

// ============================================================================
// SALES ANALYTICS ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-business/sales-analytics
 * @desc    Get comprehensive sales analytics
 * @access  Private (Admin/Seller)
 */
router.get('/sales-analytics', authMiddleware, ecommerceBusinessSalesController.getSalesAnalytics);

/**
 * @route   GET /api/ecommerce-business/b2b-conversion-metrics
 * @desc    Get B2B conversion metrics
 * @access  Private (Admin)
 */
router.get('/b2b-conversion-metrics', authMiddleware, ecommerceBusinessSalesController.getB2BConversionMetrics);

// ============================================================================
// COMMISSION MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-business/calculate-commission/:orderId
 * @desc    Calculate platform commission for order
 * @access  Private (Admin)
 */
router.post('/calculate-commission/:orderId', authRateLimit, authMiddleware, ecommerceBusinessSalesController.calculateCommission);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
