/**
 * AFRERA E-Commerce ERP Routes
 * 
 * ERP integration endpoints:
 * - Financial ERP (GL posting, GST invoicing)
 * - Supply Chain ERP (inventory sync, purchase orders)
 * - Production ERP (production orders)
 * - Customer ERP (CRM synchronization)
 */

const express = require('express');
const router = express.Router();
const ecommerceERPController = require('../controllers/ecommerceERPController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// ============================================================================
// FINANCIAL ERP ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-erp/post-gl
 * @desc    Post transaction to general ledger
 * @access  Private (Admin/Finance)
 */
router.post('/post-gl', authLimiter, authMiddleware, ecommerceERPController.postToGeneralLedger);

/**
 * @route   POST /api/ecommerce-erp/generate-gst-invoice/:orderId
 * @desc    Generate GST invoice for order
 * @access  Private (Admin/Finance)
 */
router.post('/generate-gst-invoice/:orderId', authLimiter, authMiddleware, ecommerceERPController.generateGSTInvoice);

// ============================================================================
// SUPPLY CHAIN ERP ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-erp/sync-inventory/:productId
 * @desc    Sync marketplace inventory with ERP warehouse
 * @access  Private (Admin/Supply Chain)
 */
router.post('/sync-inventory/:productId', authLimiter, authMiddleware, ecommerceERPController.syncInventoryWithERP);

/**
 * @route   POST /api/ecommerce-erp/create-purchase-order
 * @desc    Create purchase order for marketplace listing
 * @access  Private (Admin/Supply Chain)
 */
router.post('/create-purchase-order', authLimiter, authMiddleware, ecommerceERPController.createPurchaseOrder);

// ============================================================================
// CUSTOMER ERP (CRM) ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-erp/sync-customer/:userId
 * @desc    Sync marketplace customer with CRM
 * @access  Private (Admin/CRM)
 */
router.post('/sync-customer/:userId', authLimiter, authMiddleware, ecommerceERPController.syncCustomerWithCRM);

// ============================================================================
// PRODUCTION ERP ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-erp/create-production-order
 * @desc    Create production order based on marketplace demand
 * @access  Private (Admin/Production)
 */
router.post('/create-production-order', authLimiter, authMiddleware, ecommerceERPController.createProductionOrder);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;

