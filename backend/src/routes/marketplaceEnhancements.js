/**
 * Marketplace Enhancement Routes
 * API endpoints for GST, Product Reviews, and Bulk Orders
 */

const express = require('express');
const router = express.Router();
const gstService = require('../services/legacy/gstService');
const productReviewService = require('../services/legacy/productReviewService');
const bulkOrderService = require('../services/legacy/bulkOrderService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { authRateLimit } = require('../middleware/rateLimiter');

// GST Routes
router.post('/gst/calculate/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const gstCalculation = await gstService.calculateOrderGST(orderId);
    res.json({ success: true, data: gstCalculation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/gst/calculate/product', authMiddleware, async (req, res) => {
  try {
    const gstCalculation = await gstService.calculateProductGST(req.body);
    res.json({ success: true, data: gstCalculation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/gst/summary', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await gstService.getGSTSummary(startDate, endDate);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/gst/invoice/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const invoice = await gstService.generateGSTInvoice(orderId);
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/gst/validate', async (req, res) => {
  try {
    const { gstNumber } = req.body;
    const isValid = gstService.validateGSTNumber(gstNumber);
    res.json({ success: true, data: { isValid, gstNumber } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Product Review Routes
router.post('/reviews', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const review = await productReviewService.createReview(req.user.id, req.body.productId, req.body);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reviews/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await productReviewService.getProductReviews(productId, req.query);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reviews/product/:productId/stats', async (req, res) => {
  try {
    const { productId } = req.params;
    const stats = await productReviewService.getProductReviewStats(productId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reviews/:reviewId/helpful', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const result = await productReviewService.markReviewHelpful(reviewId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/reviews/:reviewId', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await productReviewService.updateReview(reviewId, req.user.id, req.body);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/reviews/:reviewId', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const result = await productReviewService.deleteReview(reviewId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/reviews/:reviewId/moderate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    const review = await productReviewService.moderateReview(reviewId, status, req.user.id);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reviews/user', authMiddleware, async (req, res) => {
  try {
    const reviews = await productReviewService.getUserReviews(req.user.id, req.query);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reviews/:reviewId/report', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const report = await productReviewService.reportReview(reviewId, req.user.id, reason);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk Order Routes
router.post('/bulk-orders', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const bulkOrder = await bulkOrderService.createBulkOrderRequest(req.user.id, req.body);
    res.json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bulk-orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const bulkOrder = await bulkOrderService.getBulkOrder(orderId, req.user.id, req.user.role === 'admin');
    res.json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bulk-orders', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const bulkOrders = await bulkOrderService.getAllBulkOrders(req.query);
      res.json({ success: true, data: bulkOrders });
    } else {
      const bulkOrders = await bulkOrderService.getUserBulkOrders(req.user.id, req.query);
      res.json({ success: true, data: bulkOrders });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/bulk-orders/:orderId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const bulkOrder = await bulkOrderService.updateBulkOrderStatus(orderId, status, req.user.id, notes);
    res.json({ success: true, data: bulkOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bulk-orders/:orderId/quotation', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const quotation = await bulkOrderService.createQuotation(orderId, req.body);
    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/quotations/:quotationId/accept', authMiddleware, async (req, res) => {
  try {
    const { quotationId } = req.params;
    const quotation = await bulkOrderService.acceptQuotation(quotationId, req.user.id);
    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/quotations/:quotationId/reject', authMiddleware, async (req, res) => {
  try {
    const { quotationId } = req.params;
    const { reason } = req.body;
    const quotation = await bulkOrderService.rejectQuotation(quotationId, req.user.id, reason);
    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bulk-orders/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await bulkOrderService.getBulkOrderStats(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/bulk-orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await bulkOrderService.cancelBulkOrder(orderId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
