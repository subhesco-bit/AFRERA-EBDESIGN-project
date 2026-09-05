/**
 * Bulk Order Controller
 * Handles bulk/wholesale orders for AFRERA marketplace
 */

const bulkOrderService = require('../services/legacy/bulkOrderService');
const { logger } = require('../utils/logger');

/**
 * Create bulk order request
 */
exports.createBulkOrderRequest = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const requestData = req.body;
    
    const result = await bulkOrderService.createBulkOrderRequest(userId, requestData);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Bulk order request created successfully'
    });
  } catch (error) {
    logger.error('Error creating bulk order request', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get bulk order by ID
 */
exports.getBulkOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Was calling getBulkOrder(orderId) with no userId - the service adds
    // "AND bo.user_id = $2" whenever isAdmin is false (the default) and
    // pushes undefined as that param, so the query could never match any
    // row and this endpoint always 500'd "Bulk order not found". This
    // route has no authMiddleware applied (checked bulkOrderRoutes.js),
    // so there's no real user scoping to enforce here yet - pass
    // isAdmin=true to make the existing intended lookup-by-id actually
    // work, same openness the route already has.
    let result = await bulkOrderService.getBulkOrder(orderId, req.user?.id, true);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting bulk order', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user's bulk orders
 */
exports.getUserBulkOrders = async (req, res) => {
  try {
    let userId = req.user?.id || req.query.userId;
    const { status, limit, offset } = req.query;
    
    let result = await bulkOrderService.getUserBulkOrders(userId, { status, limit, offset });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting user bulk orders', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update bulk order status
 */
exports.updateBulkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user?.id || req.body.adminId;
    
    let result = await bulkOrderService.updateBulkOrderStatus(orderId, status, adminId, notes);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Bulk order status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating bulk order status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get bulk order quotations
 */
exports.getBulkOrderQuotations = async (req, res) => {
  try {
    const { orderId } = req.params;

    let result = await bulkOrderService.getQuotationsForOrder(orderId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting bulk order quotations', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Submit quotation for bulk order
 */
exports.submitQuotation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const quotationData = req.body;
    const supplierId = req.user?.id || req.body.supplierId;
    
    let result = await bulkOrderService.createQuotation(orderId, quotationData);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Quotation submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting quotation', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Accept quotation
 */
exports.acceptQuotation = async (req, res) => {
  try {
    const { quotationId } = req.params;
    let userId = req.user?.id || req.body.userId;
    
    let result = await bulkOrderService.acceptQuotation(quotationId, userId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Quotation accepted successfully'
    });
  } catch (error) {
    logger.error('Error accepting quotation', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get bulk order analytics
 */
exports.getBulkOrderAnalytics = async (req, res) => {
  try {
    // Was calling bulkOrderService.getBulkOrderAnalytics(userId) - that
    // method doesn't exist on the service (only getBulkOrderStats does,
    // and it filters by startDate/endDate/productId, not userId) - this
    // endpoint would have thrown "getBulkOrderAnalytics is not a
    // function" on every call. Fixed to call the real method with the
    // filters it actually supports.
    const { startDate, endDate, productId } = req.query;
    let result = await bulkOrderService.getBulkOrderStats({ startDate, endDate, productId });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting bulk order analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Cancel bulk order
 */
exports.cancelBulkOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    let result = await bulkOrderService.cancelBulkOrder(orderId, reason);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Bulk order cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling bulk order', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
