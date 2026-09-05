/**
 * Marketplace Enhancement Routes
 * API endpoints for GST, Product Reviews, and Bulk Orders
 */

const express = require('express');
const router = express.Router();
const apiResponseHandler = require('../middleware/apiResponseHandler');
const gstService = require('../services/legacy/gstService');
const productReviewService = require('../services/legacy/productReviewService');
const bulkOrderService = require('../services/legacy/bulkOrderService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { authLimiter } = require('../middleware/rateLimiter');

// GST Routes
router.post('/gst/calculate/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const gstCalculation = await gstService.calculateOrderGST(orderId);
    return apiResponseHandler.sendSuccess(res, gstCalculation, 'GST calculated successfully');
  } catch (error) {
    return apiResponseHandler.sendError(res, 'Failed to calculate GST', 500, 'SERVER_ERROR', error.message);
  }
});

router.post('/gst/calculate/product', authMiddleware, async (req, res) => {
  try {
    let gstCalculation = await gstService.calculateProductGST(req.body);
    return apiResponseHandler.sendSuccess(res, gstCalculation, 'Product GST calculated successfully');
  } catch (error) {
    return apiResponseHandler.sendError(res, 'Failed to calculate product GST', 500, 'SERVER_ERROR', error.message);
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
router.post('/reviews', authLimiter, authMiddleware, async (req, res) => {
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

router.post('/reviews/:reviewId/helpful', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const result = await productReviewService.markReviewHelpful(reviewId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/reviews/:reviewId', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    let review = await productReviewService.updateReview(reviewId, req.user.id, req.body);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/reviews/:reviewId', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    let result = await productReviewService.deleteReview(reviewId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/reviews/:reviewId/moderate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    let review = await productReviewService.moderateReview(reviewId, status, req.user.id);
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reviews/user', authMiddleware, async (req, res) => {
  try {
    let reviews = await productReviewService.getUserReviews(req.user.id, req.query);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reviews/:reviewId/report', authLimiter, authMiddleware, async (req, res) => {
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
router.post('/bulk-orders', authLimiter, authMiddleware, async (req, res) => {
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
    let bulkOrder = await bulkOrderService.getBulkOrder(orderId, req.user.id, req.user.role === 'admin');
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
      let bulkOrders = await bulkOrderService.getUserBulkOrders(req.user.id, req.query);
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
    let bulkOrder = await bulkOrderService.updateBulkOrderStatus(orderId, status, req.user.id, notes);
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
    let quotation = await bulkOrderService.acceptQuotation(quotationId, req.user.id);
    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/quotations/:quotationId/reject', authMiddleware, async (req, res) => {
  try {
    const { quotationId } = req.params;
    const { reason } = req.body;
    let quotation = await bulkOrderService.rejectQuotation(quotationId, req.user.id, reason);
    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bulk-orders/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let stats = await bulkOrderService.getBulkOrderStats(req.query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/bulk-orders/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    let result = await bulkOrderService.cancelBulkOrder(orderId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

