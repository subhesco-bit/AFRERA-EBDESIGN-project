/**
 * AFRERA E-Commerce Integration Routes
 * 
 * Cross-module integration endpoints between E-commerce and:
 * - Nutrition Intelligence
 * - Recipe Intelligence
 * - Consumer Health
 * - Nutrient Calculator
 * - Dietitian Services
 */

const express = require('express');
const router = express.Router();
const ecommerceIntegrationController = require('../controllers/ecommerceIntegrationController');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

// ============================================================================
// NUTRITION SCORING ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-integration/nutrition-score/:productId
 * @desc    Calculate nutrition score for a product
 * @access  Private (Admin/Seller)
 */
router.post('/nutrition-score/:productId', authRateLimit, authMiddleware, ecommerceIntegrationController.calculateNutritionScore);

/**
 * @route   GET /api/ecommerce-integration/nutrition-price/:productId
 * @desc    Get nutrition-based price premium
 * @access  Public
 */
router.get('/nutrition-price/:productId', ecommerceIntegrationController.getNutritionPricePremium);

// ============================================================================
// RECIPE INTEGRATION ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-integration/recipes/:productId
 * @desc    Get recipe suggestions for a product
 * @access  Public
 */
router.get('/recipes/:productId', ecommerceIntegrationController.getRecipeSuggestions);

/**
 * @route   GET /api/ecommerce-integration/recipe-products/:recipeId
 * @desc    Get marketplace products for a recipe
 * @access  Public
 */
router.get('/recipe-products/:recipeId', ecommerceIntegrationController.getRecipeProducts);

// ============================================================================
// HEALTH-BASED RECOMMENDATIONS ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-integration/health-recommendations
 * @desc    Get health-based product recommendations for user
 * @access  Private
 */
router.get('/health-recommendations', authMiddleware, ecommerceIntegrationController.getHealthRecommendations);

/**
 * @route   GET /api/ecommerce-integration/compatibility/:productId
 * @desc    Check product compatibility with user's health profile
 * @access  Private
 */
router.get('/compatibility/:productId', authMiddleware, ecommerceIntegrationController.checkCompatibility);

// ============================================================================
// SHOPPING CART NUTRITION ROUTES
// ============================================================================

/**
 * @route   POST /api/ecommerce-integration/cart-nutrition
 * @desc    Calculate nutrition for shopping cart
 * @access  Private
 */
router.post('/cart-nutrition', authRateLimit, authMiddleware, ecommerceIntegrationController.calculateCartNutrition);

/**
 * @route   POST /api/ecommerce-integration/cart-rda
 * @desc    Calculate RDA percentage for cart
 * @access  Private
 */
router.post('/cart-rda', authRateLimit, authMiddleware, ecommerceIntegrationController.calculateCartRDA);

// ============================================================================
// DIETITIAN INTEGRATION ROUTES
// ============================================================================

/**
 * @route   GET /api/ecommerce-integration/dietitian-collections
 * @desc    Get dietitian-curated product collections
 * @access  Public
 */
router.get('/dietitian-collections', ecommerceIntegrationController.getDietitianCollections);

/**
 * @route   GET /api/ecommerce-integration/dietitian-recommendation
 * @desc    Get personalized dietitian recommendation
 * @access  Private
 */
router.get('/dietitian-recommendation', authMiddleware, ecommerceIntegrationController.getDietitianRecommendation);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
