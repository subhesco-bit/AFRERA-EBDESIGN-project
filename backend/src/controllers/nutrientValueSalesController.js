/**
 * AFRERA Nutrient Value Sales Controller
 * 
 * Handles all nutrient-value-based sales endpoints:
 * - Nutrient-Value Pricing
 * - Nutrient Content Verification
 * - Nutrient-Value Listings
 * - Nutrient Quality Tiers
 * - Nutrient-Based Comparison
 * - Nutrient Certification
 * - Nutrient-Based Commission
 * - Nutrient-Value Search
 */

const nutrientValueSalesService = require('../services/legacy/nutrientValueSalesService');
const { logger } = require('../utils/logger');

// ============================================================================
// NUTRIENT-VALUE PRICING ENDPOINTS
// ============================================================================

/**
 * POST /api/nutrient-value/calculate-price/:productId
 * Calculate nutrient-value-based price for product
 */
async function calculateNutrientValuePrice(req, res) {
  try {
    const { productId } = req.params;
    const { nutrientContent } = req.body;
    
    const result = await nutrientValueSalesService.calculateNutrientValuePrice(productId, nutrientContent);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in calculateNutrientValuePrice controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate nutrient value price'
    });
  }
}

// ============================================================================
// NUTRIENT CONTENT VERIFICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/nutrient-value/submit-verification
 * Submit nutrient content for lab verification
 */
async function submitNutrientContent(req, res) {
  try {
    const { productId, contentData, verificationData } = req.body;
    
    const result = await nutrientValueSalesService.submitNutrientContent(productId, contentData, verificationData);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in submitNutrientContent controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit nutrient content verification'
    });
  }
}

/**
 * POST /api/nutrient-value/approve-verification/:verificationId
 * Approve nutrient content verification
 */
async function approveNutrientVerification(req, res) {
  try {
    const { verificationId } = req.params;
    const { approvedBy, notes } = req.body;
    
    const result = await nutrientValueSalesService.approveNutrientVerification(verificationId, approvedBy, notes);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in approveNutrientVerification controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve nutrient verification'
    });
  }
}

// ============================================================================
// NUTRIENT-VALUE LISTINGS ENDPOINTS
// ============================================================================

/**
 * POST /api/nutrient-value/create-listing
 * Create nutrient-value-based product listing
 */
async function createNutrientValueListing(req, res) {
  try {
    const sellerId = req.user.id;
    const result = await nutrientValueSalesService.createNutrientValueListing(sellerId, req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in createNutrientValueListing controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create nutrient-value listing'
    });
  }
}

// ============================================================================
// NUTRIENT QUALITY TIERS ENDPOINTS
// ============================================================================

/**
 * POST /api/nutrient-value/assign-tier/:productId
 * Assign nutrient quality tier to product
 */
async function assignNutrientTier(req, res) {
  try {
    const { productId } = req.params;
    const { manualOverride } = req.body;
    
    const result = await nutrientValueSalesService.assignNutrientTier(productId, manualOverride);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in assignNutrientTier controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign nutrient tier'
    });
  }
}

// ============================================================================
// NUTRIENT-BASED COMPARISON ENDPOINTS
// ============================================================================

/**
 * POST /api/nutrient-value/compare-products
 * Compare products by nutrient value
 */
async function compareProductsByNutrient(req, res) {
  try {
    const { productIds } = req.body;
    
    const result = await nutrientValueSalesService.compareProductsByNutrient(productIds);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in compareProductsByNutrient controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare products by nutrient'
    });
  }
}

// ============================================================================
// NUTRIENT CERTIFICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/nutrient-value/issue-certificate
 * Issue nutrient quality certificate
 */
async function issueNutrientCertificate(req, res) {
  try {
    const { productId, certificationData } = req.body;
    
    const result = await nutrientValueSalesService.issueNutrientCertificate(productId, certificationData);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in issueNutrientCertificate controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to issue nutrient certificate'
    });
  }
}

// ============================================================================
// NUTRIENT-BASED COMMISSION ENDPOINTS
// ============================================================================

/**
 * POST /api/nutrient-value/calculate-commission/:orderId
 * Calculate commission based on nutrient quality
 */
async function calculateNutrientBasedCommission(req, res) {
  try {
    const { orderId } = req.params;
    
    const result = await nutrientValueSalesService.calculateNutrientBasedCommission(orderId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in calculateNutrientBasedCommission controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate nutrient-based commission'
    });
  }
}

// ============================================================================
// NUTRIENT-VALUE SEARCH ENDPOINTS
// ============================================================================

/**
 * GET /api/nutrient-value/search
 * Search products by nutrient criteria
 */
async function searchByNutrientCriteria(req, res) {
  try {
    const criteria = req.query;
    
    const result = await nutrientValueSalesService.searchByNutrientCriteria(criteria);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in searchByNutrientCriteria controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search by nutrient criteria'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Nutrient-Value Pricing
  calculateNutrientValuePrice,
  
  // Nutrient Content Verification
  submitNutrientContent,
  approveNutrientVerification,
  
  // Nutrient-Value Listings
  createNutrientValueListing,
  
  // Nutrient Quality Tiers
  assignNutrientTier,
  
  // Nutrient-Based Comparison
  compareProductsByNutrient,
  
  // Nutrient Certification
  issueNutrientCertificate,
  
  // Nutrient-Based Commission
  calculateNutrientBasedCommission,
  
  // Nutrient-Value Search
  searchByNutrientCriteria
};
