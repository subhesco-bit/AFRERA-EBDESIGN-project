/**
 * Bulk Order Controller
 * Handles bulk/wholesale orders for AFRERA marketplace
 */

const bulkOrderService = require('../services/bulkOrderService');
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
    
    const result = await bulkOrderService.getBulkOrder(orderId);
    
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
    const userId = req.user?.id || req.query.userId;
    const { status, limit, offset } = req.query;
    
    const result = await bulkOrderService.getUserBulkOrders(userId, { status, limit, offset });
    
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
    
    const result = await bulkOrderService.updateBulkOrderStatus(orderId, status, adminId, notes);
    
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
    
    // This would need to be implemented in the service
    const result = { message: 'Quotations endpoint - service method to be implemented' };
    
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
    
    const result = await bulkOrderService.createQuotation(orderId, quotationData);
    
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
    const userId = req.user?.id || req.body.userId;
    
    const result = await bulkOrderService.acceptQuotation(quotationId, userId);
    
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
    const { userId } = req.query;
    
    const result = await bulkOrderService.getBulkOrderAnalytics(userId);
    
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
    
    const result = await bulkOrderService.cancelBulkOrder(orderId, reason);
    
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
