/**
 * AFRERA E-Commerce Marketing Controller
 * 
 * Handles all marketing and advertising endpoints:
 * - Campaign Management
 * - Sponsored Products
 * - Promotion Management
 * - Retargeting Campaigns
 * - Performance Analytics
 */

const ecommerceMarketingService = require('../services/legacy/ecommerceMarketingService');
const { logger } = require('../utils/logger');

// ============================================================================
// CAMPAIGN MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-marketing/create-campaign
 * Create marketing campaign
 */
async function createCampaign(req, res) {
  try {
    const userId = req.user.id;
    const result = await ecommerceMarketingService.createCampaign(userId, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createCampaign controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create marketing campaign'
    });
  }
}

/**
 * POST /api/ecommerce-marketing/launch-campaign/:campaignId
 * Launch marketing campaign
 */
async function launchCampaign(req, res) {
  try {
    const { campaignId } = req.params;
    
    const result = await ecommerceMarketingService.launchCampaign(campaignId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in launchCampaign controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to launch campaign'
    });
  }
}

/**
 * POST /api/ecommerce-marketing/update-campaign-metrics/:campaignId
 * Update campaign performance metrics
 */
async function updateCampaignMetrics(req, res) {
  try {
    const { campaignId } = req.params;
    
    const result = await ecommerceMarketingService.updateCampaignMetrics(campaignId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in updateCampaignMetrics controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update campaign metrics'
    });
  }
}

// ============================================================================
// SPONSORED PRODUCTS ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-marketing/create-sponsored-product
 * Create sponsored product listing
 */
async function createSponsoredProduct(req, res) {
  try {
    const sellerId = req.user.id;
    const result = await ecommerceMarketingService.createSponsoredProduct(sellerId, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createSponsoredProduct controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create sponsored product'
    });
  }
}

/**
 * GET /api/ecommerce-marketing/sponsored-products
 * Get sponsored products for display
 */
async function getSponsoredProducts(req, res) {
  try {
    const filters = req.query;
    
    const result = await ecommerceMarketingService.getSponsoredProducts(filters);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getSponsoredProducts controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sponsored products'
    });
  }
}

// ============================================================================
// PROMOTION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-marketing/create-promotion
 * Create promotion/discount offer
 */
async function createPromotion(req, res) {
  try {
    const creatorId = req.user.id;
    const result = await ecommerceMarketingService.createPromotion(creatorId, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createPromotion controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create promotion'
    });
  }
}

/**
 * POST /api/ecommerce-marketing/apply-promotion/:promoCode
 * Apply promotion to order
 */
async function applyPromotion(req, res) {
  try {
    const { promoCode } = req.params;
    const { orderId } = req.body;
    const userId = req.user.id;
    
    const result = await ecommerceMarketingService.applyPromotion(promoCode, orderId, userId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in applyPromotion controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply promotion'
    });
  }
}

// ============================================================================
// RETARGETING ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-marketing/retargeting-cart
 * Create cart abandonment retargeting campaign
 */
async function createCartRetargeting(req, res) {
  try {
    const userId = req.user.id;
    const { cartItems } = req.body;
    
    const result = await ecommerceMarketingService.createCartRetargeting(userId, cartItems);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createCartRetargeting controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create cart retargeting'
    });
  }
}

/**
 * POST /api/ecommerce-marketing/retargeting-product-view
 * Create product view retargeting
 */
async function createProductViewRetargeting(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    const result = await ecommerceMarketingService.createProductViewRetargeting(userId, productId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createProductViewRetargeting controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create product view retargeting'
    });
  }
}

// ============================================================================
// PERFORMANCE ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-marketing/analytics
 * Get marketing performance analytics
 */
async function getMarketingAnalytics(req, res) {
  try {
    const filters = req.query;
    
    const result = await ecommerceMarketingService.getMarketingAnalytics(filters);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getMarketingAnalytics controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get marketing analytics'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Campaign Management
  createCampaign,
  launchCampaign,
  updateCampaignMetrics,
  
  // Sponsored Products
  createSponsoredProduct,
  getSponsoredProducts,
  
  // Promotion Management
  createPromotion,
  applyPromotion,
  
  // Retargeting
  createCartRetargeting,
  createProductViewRetargeting,
  
  // Analytics
  getMarketingAnalytics
};
