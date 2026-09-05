/**
 * AFRERA E-Commerce Integration Controller
 * 
 * Handles all cross-module integration endpoints between E-commerce and:
 * - Nutrition Intelligence
 * - Recipe Intelligence  
 * - Consumer Health
 * - Nutrient Calculator
 * - Dietitian Services
 */

const ecommerceIntegrationService = require('../services/legacy/ecommerceIntegrationService');
const { logger } = require('../utils/logger');

// ============================================================================
// NUTRITION SCORING ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-integration/nutrition-score/:productId
 * Calculate nutrition score for a product
 */
async function calculateNutritionScore(req, res) {
  try {
    const { productId } = req.params;
    
    const result = await ecommerceIntegrationService.calculateProductNutritionScore(productId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in calculateNutritionScore controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate nutrition score'
    });
  }
}

/**
 * GET /api/ecommerce-integration/nutrition-price/:productId
 * Get nutrition-based price premium
 */
async function getNutritionPricePremium(req, res) {
  try {
    const { productId } = req.params;
    const { basePrice } = req.query;
    
    let result = await ecommerceIntegrationService.calculateNutritionPricePremium(
      productId, 
      parseFloat(basePrice)
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in getNutritionPricePremium controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate nutrition price premium'
    });
  }
}

// ============================================================================
// RECIPE INTEGRATION ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-integration/recipes/:productId
 * Get recipe suggestions for a product
 */
async function getRecipeSuggestions(req, res) {
  try {
    const { productId } = req.params;
    const { limit } = req.query;
    
    let result = await ecommerceIntegrationService.getRecipeSuggestionsForProduct(
      productId, 
      parseInt(limit) || 5
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getRecipeSuggestions controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recipe suggestions'
    });
  }
}

/**
 * GET /api/ecommerce-integration/recipe-products/:recipeId
 * Get marketplace products for a recipe
 */
async function getRecipeProducts(req, res) {
  try {
    const { recipeId } = req.params;
    
    let result = await ecommerceIntegrationService.getProductsForRecipe(recipeId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getRecipeProducts controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recipe products'
    });
  }
}

// ============================================================================
// HEALTH-BASED RECOMMENDATIONS ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-integration/health-recommendations
 * Get health-based product recommendations for user
 */
async function getHealthRecommendations(req, res) {
  try {
    const userId = req.user.id;
    const { limit } = req.query;
    
    let result = await ecommerceIntegrationService.getHealthBasedRecommendations(
      userId, 
      parseInt(limit) || 10
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getHealthRecommendations controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get health recommendations'
    });
  }
}

/**
 * GET /api/ecommerce-integration/compatibility/:productId
 * Check product compatibility with user's health profile
 */
async function checkCompatibility(req, res) {
  try {
    const { productId } = req.params;
    let userId = req.user.id;
    
    let result = await ecommerceIntegrationService.checkProductCompatibility(productId, userId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error in checkCompatibility controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check product compatibility'
    });
  }
}

// ============================================================================
// SHOPPING CART NUTRITION ENDPOINTS
// ============================================================================

/**
 * POST /api/ecommerce-integration/cart-nutrition
 * Calculate nutrition for shopping cart
 */
async function calculateCartNutrition(req, res) {
  try {
    const { cartItems } = req.body;
    
    let result = await ecommerceIntegrationService.calculateCartNutrition(cartItems);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in calculateCartNutrition controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate cart nutrition'
    });
  }
}

/**
 * POST /api/ecommerce-integration/cart-rda
 * Calculate RDA percentage for cart
 */
async function calculateCartRDA(req, res) {
  try {
    const { cartNutrition } = req.body;
    let userId = req.user.id;
    
    let result = await ecommerceIntegrationService.calculateCartRDAPercentage(cartNutrition, userId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in calculateCartRDA controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate cart RDA'
    });
  }
}

// ============================================================================
// DIETITIAN INTEGRATION ENDPOINTS
// ============================================================================

/**
 * GET /api/ecommerce-integration/dietitian-collections
 * Get dietitian-curated product collections
 */
async function getDietitianCollections(req, res) {
  try {
    const { dietitianId } = req.query;
    
    let result = await ecommerceIntegrationService.getDietitianCollections(dietitianId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getDietitianCollections controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dietitian collections'
    });
  }
}

/**
 * GET /api/ecommerce-integration/dietitian-recommendation
 * Get personalized dietitian recommendation
 */
async function getDietitianRecommendation(req, res) {
  try {
    let userId = req.user.id;
    
    let result = await ecommerceIntegrationService.getDietitianRecommendation(userId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getDietitianRecommendation controller', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get dietitian recommendation'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Nutrition Scoring
  calculateNutritionScore,
  getNutritionPricePremium,
  
  // Recipe Integration
  getRecipeSuggestions,
  getRecipeProducts,
  
  // Health-Based Recommendations
  getHealthRecommendations,
  checkCompatibility,
  
  // Shopping Cart Nutrition
  calculateCartNutrition,
  calculateCartRDA,
  
  // Dietitian Integration
  getDietitianCollections,
  getDietitianRecommendation
};
