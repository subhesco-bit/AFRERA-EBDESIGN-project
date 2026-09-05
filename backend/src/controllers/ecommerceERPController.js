/**
 * AFRERA E-Commerce ERP Controller
 * 
 * Handles all ERP integration endpoints:
 * - Financial ERP (GL posting, GST invoicing)
 * - Supply Chain ERP (inventory sync, purchase orders)
 * - Production ERP (production orders)
 * - Customer ERP (CRM synchronization)
 */

const ecommerceERPService = require('../services/legacy/ecommerceERPService');
const { logger } = require('../utils/logger');

// ============================================================================
// FINANCIAL ERP ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-erp/post-gl
 * Post transaction to general ledger
 */
async function postToGeneralLedger(req, res) {
  try {
    const result = await ecommerceERPService.postToGeneralLedger(req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in postToGeneralLedger controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to post to general ledger'
    });
  }
}

/**
 * POST /api/ecommerce-erp/generate-gst-invoice/:orderId
 * Generate GST invoice for order
 */
async function generateGSTInvoice(req, res) {
  try {
    const { orderId } = req.params;
    
    let result = await ecommerceERPService.generateGSTInvoice(orderId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in generateGSTInvoice controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate GST invoice'
    });
  }
}

// ============================================================================
// SUPPLY CHAIN ERP ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-erp/sync-inventory/:productId
 * Sync marketplace inventory with ERP warehouse
 */
async function syncInventoryWithERP(req, res) {
  try {
    const { productId } = req.params;
    
    let result = await ecommerceERPService.syncInventoryWithERP(productId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in syncInventoryWithERP controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync inventory with ERP'
    });
  }
}

/**
 * POST /api/ecommerce-erp/create-purchase-order
 * Create purchase order for marketplace listing
 */
async function createPurchaseOrder(req, res) {
  try {
    const { listingId, quantity } = req.body;
    
    let result = await ecommerceERPService.createPurchaseOrder(listingId, quantity);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createPurchaseOrder controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create purchase order'
    });
  }
}

// ============================================================================
// CUSTOMER ERP (CRM) ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-erp/sync-customer/:userId
 * Sync marketplace customer with CRM
 */
async function syncCustomerWithCRM(req, res) {
  try {
    const { userId } = req.params;
    
    let result = await ecommerceERPService.syncCustomerWithCRM(userId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in syncCustomerWithCRM controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync customer with CRM'
    });
  }
}

// ============================================================================
// PRODUCTION ERP ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-erp/create-production-order
 * Create production order based on marketplace demand
 */
async function createProductionOrder(req, res) {
  try {
    const { productId, demandQuantity } = req.body;
    
    let result = await ecommerceERPService.createProductionOrder(productId, demandQuantity);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createProductionOrder controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create production order'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Financial ERP
  postToGeneralLedger,
  generateGSTInvoice,
  
  // Supply Chain ERP
  syncInventoryWithERP,
  createPurchaseOrder,
  
  // Customer ERP (CRM)
  syncCustomerWithCRM,
  
  // Production ERP
  createProductionOrder
};
