/**
 * Nutrition Intelligence Routes
 * 
 * Routes for nutrition data, scoring, wellness practices, and value-based pricing
 * Connects frontend nutritionAPI to backend nutritionIntelligenceService
 */

const express = require('express');
const router = express.Router();
const nutritionIntelligenceService = require('../services/legacy/nutritionIntelligenceService');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Middleware
router.use(rateLimiter);

// ============================================================================
// NUTRIENT DATA ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/nutrition-intelligence/nutrients
 * @desc    Get all available nutrients with metadata
 * @access  Public
 */
router.get('/nutrients', (req, res) => {
  try {
    const nutrients = nutritionIntelligenceService.getNutrientMetadata();
    res.json({ success: true, data: nutrients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// FOOD PROFILES ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/nutrition-intelligence/food-profiles
 * @desc    Create or update food profile with nutrition data
 * @access  Private (Admin)
 */
router.post('/food-profiles', authMiddleware, async (req, res) => {
  try {
    const profile = await nutritionIntelligenceService.addFoodProfile(req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/nutrition-intelligence/food-profiles/search
 * @desc    Search food profiles by name or keywords
 * @access  Public
 */
router.get('/food-profiles/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await nutritionIntelligenceService.searchFoodProfiles(q || '');
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PRODUCT NUTRITION ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/nutrition-intelligence/product-nutrition
 * @desc    Add nutrition data to a product
 * @access  Private (Admin/Seller)
 */
router.post('/product-nutrition', authMiddleware, async (req, res) => {
  try {
    const result = await nutritionIntelligenceService.addProductNutrition(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/nutrition-intelligence/product-nutrition/:productId
 * @desc    Get nutrition data for a specific product
 * @access  Public
 */
router.get('/product-nutrition/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const nutrition = await nutritionIntelligenceService.getProductNutrition(productId);
    res.json({ success: true, data: nutrition });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/nutrition-intelligence/product-nutrition/:productId/score
 * @desc    Calculate nutrition score for a product
 * @access  Public
 */
router.post('/product-nutrition/:productId/score', async (req, res) => {
  try {
    const { productId } = req.params;
    const score = await nutritionIntelligenceService.calculateProductNutritionScore(productId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/nutrition-intelligence/product-nutrition/:productId/score
 * @desc    Get cached nutrition score for a product
 * @access  Public
 */
router.get('/product-nutrition/:productId/score', async (req, res) => {
  try {
    const { productId } = req.params;
    const score = await nutritionIntelligenceService.getProductNutritionScore(productId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/nutrition-intelligence/product-nutrition/:productId/pricing
 * @desc    Calculate value-based pricing based on nutrient density
 * @access  Private (Admin/Seller)
 */
router.post('/product-nutrition/:productId/pricing', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const pricing = await nutritionIntelligenceService.calculateValuePerNutrient(productId);
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/nutrition-intelligence/product-nutrition/:productId/value-per-nutrient
 * @desc    Get value-per-nutrient analysis for a product
 * @access  Public
 */
router.get('/product-nutrition/:productId/value-per-nutrient', async (req, res) => {
  try {
    const { productId } = req.params;
    const value = await nutritionIntelligenceService.calculateValuePerNutrient(productId);
    res.json({ success: true, data: value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// COMPARISON ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/nutrition-intelligence/compare
 * @desc    Compare nutrition data between multiple products
 * @access  Public
 */
router.post('/compare', async (req, res) => {
  try {
    const { productIds } = req.body;
    const comparison = await nutritionIntelligenceService.compareProductsNutrition(productIds[0], productIds[1]);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// DIETARY PROFILES ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/nutrition-intelligence/dietary-profiles
 * @desc    Get all available dietary profiles
 * @access  Public
 */
router.get('/dietary-profiles', async (req, res) => {
  try {
    const profiles = await nutritionIntelligenceService.getDietaryProfiles();
    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RECOMMENDATIONS ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/nutrition-intelligence/recommendations
 * @desc    Get general nutrition recommendations
 * @access  Public
 */
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await nutritionIntelligenceService.getGeneralRecommendations();
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/nutrition-intelligence/recommendations
 * @desc    Generate personalized nutrition recommendations
 * @access  Public
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { dietary_profile_id, target_calories, limit } = req.body;
    const recommendations = await nutritionIntelligenceService.generateRecommendations(
      dietary_profile_id, 
      target_calories, 
      limit
    );
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// WELLNESS PRACTICES ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/nutrition-intelligence/wellness-practices
 * @desc    Get wellness and natural therapy practices
 * @access  Public
 */
router.get('/wellness-practices', async (req, res) => {
  try {
    const { category, tag } = req.query;
    const practices = await nutritionIntelligenceService.getWellnessPractices({ category, tag });
    res.json({ success: true, data: practices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RECIPE GENERATION ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/nutrition-intelligence/recipes
 * @desc    Generate AI-powered recipes based on dietary profile
 * @access  Public
 */
router.post('/recipes', async (req, res) => {
  try {
    const { dietary_profile_id, target_calories, provider } = req.body;
    const recipe = await nutritionIntelligenceService.generateDietBasedRecipe(
      dietary_profile_id, 
      target_calories, 
      provider
    );
    res.json({ success: true, data: recipe });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;