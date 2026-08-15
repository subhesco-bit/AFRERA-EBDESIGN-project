/**
 * Bulk Order Routes
 * Handles bulk/wholesale orders for AFRERA marketplace
 */

const express = require('express');
const router = express.Router();
const bulkOrderController = require('../controllers/bulkOrderController');

/**
 * Create bulk order request
 * POST /api/v1/bulk-orders
 */
router.post('/', bulkOrderController.createBulkOrderRequest);

/**
 * Get bulk order analytics
 * GET /api/v1/bulk-orders/analytics
 */
router.get('/analytics', bulkOrderController.getBulkOrderAnalytics);

/**
 * Get user's bulk orders
 * GET /api/v1/bulk-orders/user/:userId
 */
router.get('/user/:userId', bulkOrderController.getUserBulkOrders);

/**
 * Get bulk order by ID
 * GET /api/v1/bulk-orders/:orderId
 */
router.get('/:orderId', bulkOrderController.getBulkOrder);

/**
 * Update bulk order status
 * PATCH /api/v1/bulk-orders/:orderId/status
 */
router.patch('/:orderId/status', bulkOrderController.updateBulkOrderStatus);

/**
 * Get bulk order quotations
 * GET /api/v1/bulk-orders/:orderId/quotations
 */
router.get('/:orderId/quotations', bulkOrderController.getBulkOrderQuotations);

/**
 * Submit quotation for bulk order
 * POST /api/v1/bulk-orders/:orderId/quotations
 */
router.post('/:orderId/quotations', bulkOrderController.submitQuotation);

/**
 * Accept quotation
 * POST /api/v1/bulk-orders/quotations/:quotationId/accept
 */
router.post('/quotations/:quotationId/accept', bulkOrderController.acceptQuotation);

/**
 * Cancel bulk order
 * POST /api/v1/bulk-orders/:orderId/cancel
 */
router.post('/:orderId/cancel', bulkOrderController.cancelBulkOrder);

module.exports = router;
