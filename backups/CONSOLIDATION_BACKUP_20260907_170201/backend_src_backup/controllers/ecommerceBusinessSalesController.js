/**
 * AFRERA E-Commerce Business Sales Controller
 * 
 * Handles all B2B and business sales endpoints:
 * - Bulk Order Management
 * - Contract Farming
 * - Quotation Management
 * - Sales Analytics
 * - Commission Management
 */

const ecommerceBusinessSalesService = require('../services/legacy/ecommerceBusinessSalesService');
const { logger } = require('../utils/logger');

// ============================================================================
// B2B BULK ORDER ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-business/create-bulk-order
 * Create B2B bulk order request
 */
async function createBulkOrder(req, res) {
  try {
    const buyerId = req.user.id;
    const result = await ecommerceBusinessSalesService.createBulkOrder(buyerId, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createBulkOrder controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create bulk order'
    });
  }
}

/**
 * POST /api/ecommerce-business/submit-quotation
 * Submit quotation for bulk order
 */
async function submitQuotation(req, res) {
  try {
    const { bulkOrderId, sellerId, quotationData } = req.body;
    
    const result = await ecommerceBusinessSalesService.submitQuotation(bulkOrderId, sellerId, quotationData);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in submitQuotation controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit quotation'
    });
  }
}

/**
 * POST /api/ecommerce-business/accept-quotation/:quotationId
 * Accept quotation and create order
 */
async function acceptQuotation(req, res) {
  try {
    const { quotationId } = req.params;
    const buyerId = req.user.id;
    
    const result = await ecommerceBusinessSalesService.acceptQuotation(quotationId, buyerId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in acceptQuotation controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to accept quotation'
    });
  }
}

// ============================================================================
// CONTRACT FARMING ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-business/create-contract-farming
 * Create contract farming agreement
 */
async function createContractFarming(req, res) {
  try {
    const buyerId = req.user.id;
    const result = await ecommerceBusinessSalesService.createContractFarming(buyerId, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createContractFarming controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create contract farming agreement'
    });
  }
}

/**
 * POST /api/ecommerce-business/record-milestone
 * Record contract farming milestone
 */
async function recordContractMilestone(req, res) {
  try {
    const { contractId, milestoneData } = req.body;
    
    const result = await ecommerceBusinessSalesService.recordContractMilestone(contractId, milestoneData);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in recordContractMilestone controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record contract milestone'
    });
  }
}

// ============================================================================
// SALES ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-business/sales-analytics
 * Get comprehensive sales analytics
 */
async function getSalesAnalytics(req, res) {
  try {
    const filters = req.query;
    
    const result = await ecommerceBusinessSalesService.getSalesAnalytics(filters);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getSalesAnalytics controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sales analytics'
    });
  }
}

/**
 * GET /api/ecommerce-business/b2b-conversion-metrics
 * Get B2B conversion metrics
 */
async function getB2BConversionMetrics(req, res) {
  try {
    const { periodDays } = req.query;
    
    const result = await ecommerceBusinessSalesService.getB2BConversionMetrics(parseInt(periodDays) || 30);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getB2BConversionMetrics controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get B2B conversion metrics'
    });
  }
}

// ============================================================================
// COMMISSION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-business/calculate-commission/:orderId
 * Calculate platform commission for order
 */
async function calculateCommission(req, res) {
  try {
    const { orderId } = req.params;
    
    const result = await ecommerceBusinessSalesService.calculateCommission(orderId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in calculateCommission controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate commission'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // B2B Bulk Orders
  createBulkOrder,
  submitQuotation,
  acceptQuotation,
  
  // Contract Farming
  createContractFarming,
  recordContractMilestone,
  
  // Sales Analytics
  getSalesAnalytics,
  getB2BConversionMetrics,
  
  // Commission Management
  calculateCommission
};
