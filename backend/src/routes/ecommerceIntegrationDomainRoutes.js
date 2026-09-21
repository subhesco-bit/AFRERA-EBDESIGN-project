/**
 * Real backend routes for EcommerceIntegrationPage.jsx's nutrition/dietitian
 * integration widgets, backed by services/legacy/ecommerceIntegrationService.js.
 *
 * Several page method names differ from the real ones (calculateNutritionScore
 * -> calculateProductNutritionScore, checkCompatibility ->
 * checkProductCompatibility, getHealthRecommendations ->
 * getHealthBasedRecommendations, getNutritionPricePremium ->
 * calculateNutritionPricePremium, getRecipeProducts -> getProductsForRecipe,
 * getRecipeSuggestions -> getRecipeSuggestionsForProduct). Some real
 * functions take a userId the page doesn't pass - filled from the
 * authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/ecommerceIntegrationService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/ecommerce-integration/dietitian-recommendation', wrap((req) => svc.getDietitianRecommendation(req.user?.id)));
router.post('/ecommerce-integration/cart-nutrition', wrap((req) => svc.calculateCartNutrition(Array.isArray(req.body) ? req.body : [])));
router.get('/ecommerce-integration/nutrition-score/:productId', wrap((req) => svc.calculateProductNutritionScore(req.params.productId)));
router.get('/ecommerce-integration/compatibility/:productId', wrap((req) => svc.checkProductCompatibility(req.params.productId, req.user?.id)));
router.get('/ecommerce-integration/dietitian-collections', wrap((req) => svc.getDietitianCollections(req.query.dietitianId)));
router.get('/ecommerce-integration/health-recommendations', wrap((req) => svc.getHealthBasedRecommendations(req.user?.id, req.query.limit)));
router.get('/ecommerce-integration/nutrition-price-premium/:productId', wrap((req) => svc.calculateNutritionPricePremium(req.params.productId, req.query.basePrice)));
router.get('/ecommerce-integration/recipe-products/:recipeId', wrap((req) => svc.getProductsForRecipe(req.params.recipeId)));
router.get('/ecommerce-integration/recipe-suggestions/:productId', wrap((req) => svc.getRecipeSuggestionsForProduct(req.params.productId, req.query.limit)));

module.exports = router;
