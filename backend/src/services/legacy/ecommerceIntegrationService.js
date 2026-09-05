/**
 * AFRERA E-Commerce Integration Service
 * 
 * Deep integration between E-commerce marketplace and:
 * - Nutrition Intelligence (nutrition scoring, health-based pricing)
 * - Recipe Intelligence (recipe suggestions, ingredient matching)
 * - Consumer Health (health profiles, dietary recommendations)
 * - Nutrient Calculator (nutrition calculation for purchased products)
 * - Dietitian Services (professional dietary advice integration)
 * 
 * This service enables:
 * - Nutrition-scored product listings
 * - Health-based product recommendations
 * - Recipe suggestions for purchased products
 * - Nutrition calculation for shopping carts
 * - Dietitian-curated product collections
 * - Allergen-aware product filtering
 * - Dietary restriction compatibility
 */

const { logger } = require('..\/utils\/logger');
const { getPostgreSQL } = require('..\/database\/connection');
const { signalBus } = require('..\/core\/signalBus');

// Import integrated services
const nutritionIntelligenceService = require('./nutritionIntelligenceService');
const recipeIntelligenceService = require('./recipeIntelligenceService');
const consumerHealthService = require('./consumerHealthService');

// ============================================================================
// NUTRITION SCORING INTEGRATION
// ============================================================================

/**
 * Calculate nutrition score for a product listing
 * Integrates with Nutrition Intelligence Service
 */
async function calculateProductNutritionScore(productListingId) {
  const pg = getPostgreSQL();
  
  try {
    // Get product listing details
    const listing = await pg.query(
      'SELECT * FROM product_listings WHERE id = $1',
      [productListingId]
    );
    
    if (listing.rows.length === 0) {
      throw new Error('Product listing not found');
    }
    
    const product = listing.rows[0];
    
    // Get or create nutrition profile for this product
    let nutritionData;
    try {
      nutritionData = await nutritionIntelligenceService.getProductNutrition(product.product_name);
    } catch (error) {
      // If no nutrition data exists, create a basic profile
      nutritionData = await nutritionIntelligenceService.addProductNutrition({
        product_id: product.id,
        nutrition_data: estimateBasicNutrition(product.category_id),
        calories_per_serving: estimateCalories(product.category_id),
        serving_size_g: 100,
        verification_method: 'estimated',
        confidence_score: 0.6
      });
    }
    
    // Calculate nutrition score
    const scoreResult = await nutritionIntelligenceService.calculateProductNutritionScore(product.id);
    
    // Update product listing with nutrition score
    await pg.query(
      `UPDATE product_listings 
       SET nutrition_score = $1, nutrition_grade = $2, nutrition_data = $3, updated_at = NOW()
       WHERE id = $4`,
      [scoreResult.overall_score, scoreResult.grade, JSON.stringify(nutritionData.nutrition_data), product.id]
    );
    
    // Emit signal bus event
    await signalBus.emit('nutrition.score.calculated', {
      product_id: product.id,
      nutrition_score: scoreResult.overall_score,
      nutrition_grade: scoreResult.grade,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Nutrition score calculated for product', { 
      productId: product.id, 
      score: scoreResult.overall_score,
      grade: scoreResult.grade
    });
    
    return {
      success: true,
      product_id: product.id,
      nutrition_score: scoreResult.overall_score,
      nutrition_grade: scoreResult.grade,
      nutrition_data: nutritionData.nutrition_data
    };
  } catch (error) {
    logger.error('Error calculating product nutrition score', { error: error.message, productListingId });
    throw error;
  }
}

/**
 * Estimate basic nutrition based on category (fallback when no lab data)
 */
function estimateBasicNutrition(categoryId) {
  const categoryNutrition = {
    1: { PRO: 8, CARB: 75, FAT: 1, FIB: 3 }, // Grains
    2: { PRO: 15, CARB: 25, FAT: 10, FIB: 30 }, // Spices
    3: { PRO: 1, CARB: 15, FAT: 0.5, FIB: 2 }, // Fruits
    4: { PRO: 2, CARB: 8, FAT: 0.3, FIB: 2 }, // Vegetables
    5: { PRO: 0, CARB: 0, FAT: 0, FIB: 0 }, // Tea
    6: { PRO: 0, CARB: 80, FAT: 0, FIB: 0 }, // Honey
  };
  
  return categoryNutrition[categoryId] || { PRO: 5, CARB: 50, FAT: 2, FIB: 5 };
}

/**
 * Estimate calories based on category
 */
function estimateCalories(categoryId) {
  const categoryCalories = {
    1: 350, // Grains
    2: 250, // Spices
    3: 50,  // Fruits
    4: 25,  // Vegetables
    5: 2,   // Tea
    6: 320, // Honey
  };
  
  return categoryCalories[categoryId] || 200;
}

/**
 * Calculate nutrition-based price premium
 * Higher nutrition scores get price premiums
 */
async function calculateNutritionPricePremium(productListingId, basePrice) {
  let pg = getPostgreSQL();
  
  try {
    let listing = await pg.query(
      'SELECT nutrition_score, nutrition_grade FROM product_listings WHERE id = $1',
      [productListingId]
    );
    
    if (listing.rows.length === 0) {
      return { premium_percentage: 0, nutrition_price: basePrice };
    }
    
    const { nutrition_score, nutrition_grade } = listing.rows[0];
    
    // Calculate premium based on nutrition grade
    const gradePremiums = {
      'A+': 0.25,  // 25% premium
      'A': 0.20,   // 20% premium
      'A-': 0.15,  // 15% premium
      'B+': 0.10,  // 10% premium
      'B': 0.05,   // 5% premium
      'B-': 0.02,  // 2% premium
      'C': 0,      // No premium
      'D': -0.05,  // 5% discount
      'F': -0.10   // 10% discount
    };
    
    const premiumPercentage = gradePremiums[nutrition_grade] || 0;
    const nutritionPrice = basePrice * (1 + premiumPercentage);
    
    return {
      premium_percentage: premiumPercentage,
      nutrition_price: Math.round(nutritionPrice * 100) / 100,
      nutrition_score,
      nutrition_grade
    };
  } catch (error) {
    logger.error('Error calculating nutrition price premium', { error: error.message });
    return { premium_percentage: 0, nutrition_price: basePrice };
  }
}

// ============================================================================
// RECIPE INTEGRATION
// ============================================================================

/**
 * Get recipe suggestions for a product
 * Finds recipes that use this product as an ingredient
 */
async function getRecipeSuggestionsForProduct(productListingId, limit = 5) {
  let pg = getPostgreSQL();
  
  try {
    // Get product details
    let listing = await pg.query(
      'SELECT product_name, category_id FROM product_listings WHERE id = $1',
      [productListingId]
    );
    
    if (listing.rows.length === 0) {
      return { recipes: [] };
    }
    
    let product = listing.rows[0];
    
    // Search for recipes that might use this product
    // This would ideally use the recipe intelligence service
    const recipes = await pg.query(`
      SELECT 
        r.id,
        r.recipe_name,
        r.cuisine_type,
        r.meal_type,
        r.difficulty_level,
        r.preparation_time,
        r.cooking_time,
        r.servings,
        r.nutritional_info,
        r.media_files,
        r.rating
      FROM recipe_database r
      WHERE r.is_verified = true
        AND (
          r.ingredients::text ILIKE $1
          OR r.recipe_name ILIKE $1
        )
      ORDER BY r.rating DESC
      LIMIT $2
    `, [`%${product.product_name}%`, limit]);
    
    // Calculate nutrition for each recipe if not present
    const enrichedRecipes = await Promise.all(recipes.rows.map(async (recipe) => {
      if (!recipe.nutritional_info || Object.keys(recipe.nutritional_info).length === 0) {
        // Calculate recipe nutrition using nutrient calculator
        const recipeNutrition = await calculateRecipeNutrition(recipe.id);
        return { ...recipe, nutritional_info: recipeNutrition };
      }
      return recipe;
    }));
    
    return {
      success: true,
      product_id: productListingId,
      product_name: product.product_name,
      recipes: enrichedRecipes
    };
  } catch (error) {
    logger.error('Error getting recipe suggestions', { error: error.message, productListingId });
    return { recipes: [] };
  }
}

/**
 * Calculate nutrition for a recipe
 * Integrates with nutrient calculator
 */
async function calculateRecipeNutrition(recipeId) {
  let pg = getPostgreSQL();
  
  try {
    const recipe = await pg.query(
      'SELECT ingredients, servings FROM recipe_database WHERE id = $1',
      [recipeId]
    );
    
    if (recipe.rows.length === 0) {
      return {};
    }
    
    const ingredients = recipe.rows[0].ingredients;
    const servings = recipe.rows[0].servings || 1;
    
    // This would integrate with the nutrient calculator service
    // For now, return estimated nutrition
    let totalNutrition = { PRO: 0, CARB: 0, FAT: 0, FIB: 0, CAL: 0 };
    
    for (const ingredient of ingredients) {
      const ingredientNutrition = estimateBasicNutrition(ingredient.category_id || 1);
      const weight = ingredient.quantity || 100;
      
      totalNutrition.PRO += (ingredientNutrition.PRO * weight / 100);
      totalNutrition.CARB += (ingredientNutrition.CARB * weight / 100);
      totalNutrition.FAT += (ingredientNutrition.FAT * weight / 100);
      totalNutrition.FIB += (ingredientNutrition.FIB * weight / 100);
      totalNutrition.CAL += estimateCalories(ingredient.category_id || 1) * weight / 100;
    }
    
    // Per serving
    const perServing = {};
    for (const key in totalNutrition) {
      perServing[key] = Math.round((totalNutrition[key] / servings) * 10) / 10;
    }
    
    return perServing;
  } catch (error) {
    logger.error('Error calculating recipe nutrition', { error: error.message, recipeId });
    return {};
  }
}

/**
 * Get products needed for a recipe
 * Reverse lookup: recipe -> marketplace products
 */
async function getProductsForRecipe(recipeId) {
  let pg = getPostgreSQL();
  
  try {
    let recipe = await pg.query(
      'SELECT ingredients FROM recipe_database WHERE id = $1',
      [recipeId]
    );
    
    if (recipe.rows.length === 0) {
      return { products: [] };
    }
    
    let ingredients = recipe.rows[0].ingredients;
    const productIds = [];
    
    // Find matching products in marketplace
    for (const ingredient of ingredients) {
      const matches = await pg.query(`
        SELECT id, product_name, base_price, quantity, unit, seller_id
        FROM product_listings
        WHERE listing_status = 'active'
          AND quantity > 0
          AND (
            product_name ILIKE $1
            OR description ILIKE $1
          )
        LIMIT 3
      `, [`%${ingredient.name}%`]);
      
      productIds.push(...matches.rows);
    }
    
    return {
      success: true,
      recipe_id: recipeId,
      products: productIds
    };
  } catch (error) {
    logger.error('Error getting products for recipe', { error: error.message, recipeId });
    return { products: [] };
  }
}

// ============================================================================
// HEALTH-BASED RECOMMENDATIONS
// ============================================================================

/**
 * Get health-based product recommendations for a user
 * Integrates with Consumer Health Service
 */
async function getHealthBasedRecommendations(userId, limit = 10) {
  let pg = getPostgreSQL();
  
  try {
    // Get user's health profile
    const healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      // Return general recommendations if no health profile
      return await getGeneralRecommendations(limit);
    }
    
    const { dietary_restrictions, allergies, health_goals } = healthProfile;
    
    // Build query based on health profile
    let query = `
      SELECT 
        pl.*,
        pl.nutrition_score,
        pl.nutrition_grade
      FROM product_listings pl
      WHERE pl.listing_status = 'active'
        AND pl.quantity > 0
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Filter by dietary restrictions
    if (dietary_restrictions && dietary_restrictions.length > 0) {
      const restrictions = dietary_restrictions.map((_, i) => `$${paramCount + i + 1}`).join(', ');
      paramCount += dietary_restrictions.length;
      query += ` AND pl.dietary_compatibility @> ARRAY[${restrictions}]::text[]`;
      params.push(...dietary_restrictions);
    }
    
    // Filter out allergens
    if (allergies && allergies.length > 0) {
      paramCount++;
      query += ` AND NOT (pl.allergens && $${paramCount})`;
      params.push(allergies);
    }
    
    // Sort by nutrition score if health goals include nutrition
    if (health_goals && health_goals.includes('healthy_eating')) {
      query += ` ORDER BY pl.nutrition_score DESC, pl.visibility_score DESC`;
    } else {
      query += ` ORDER BY pl.visibility_score DESC`;
    }
    
    query += ` LIMIT $${paramCount + 1}`;
    params.push(limit);
    
    const result = await pg.query(query, params);
    
    // Emit recommendation event
    await signalBus.emit('health.recommendations.generated', {
      user_id: userId,
      dietary_restrictions,
      allergies,
      health_goals,
      recommendation_count: result.rows.length,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      user_id: userId,
      health_profile: {
        dietary_restrictions,
        allergies,
        health_goals
      },
      recommendations: result.rows
    };
  } catch (error) {
    logger.error('Error getting health-based recommendations', { error: error.message, userId });
    return await getGeneralRecommendations(limit);
  }
}

/**
 * Get general recommendations (fallback)
 */
async function getGeneralRecommendations(limit = 10) {
  let pg = getPostgreSQL();
  
  try {
    let result = await pg.query(`
      SELECT 
        pl.*,
        pl.nutrition_score,
        pl.nutrition_grade
      FROM product_listings pl
      WHERE pl.listing_status = 'active'
        AND pl.quantity > 0
      ORDER BY pl.visibility_score DESC, pl.nutrition_score DESC
      LIMIT $1
    `, [limit]);
    
    return {
      success: true,
      recommendations: result.rows,
      is_general: true
    };
  } catch (error) {
    logger.error('Error getting general recommendations', { error: error.message });
    return { recommendations: [] };
  }
}

/**
 * Check product compatibility with user's health profile
 */
async function checkProductCompatibility(productId, userId) {
  let pg = getPostgreSQL();
  
  try {
    // Get product allergens and dietary info
    let product = await pg.query(
      'SELECT allergens, dietary_compatibility FROM product_listings WHERE id = $1',
      [productId]
    );
    
    if (product.rows.length === 0) {
      return { compatible: true, warnings: [] };
    }
    
    const { allergens, dietary_compatibility } = product.rows[0];
    
    // Get user health profile
    let healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      return { compatible: true, warnings: [] };
    }
    
    const warnings = [];
    
    // Check allergens
    if (allergens && healthProfile.allergies) {
      const allergenConflict = allergens.filter(a => healthProfile.allergies.includes(a));
      if (allergenConflict.length > 0) {
        warnings.push({
          type: 'allergen',
          severity: 'high',
          message: `Contains allergens: ${allergenConflict.join(', ')}`,
          allergens: allergenConflict
        });
      }
    }
    
    // Check dietary restrictions
    if (dietary_compatibility && healthProfile.dietary_restrictions) {
      const incompatible = healthProfile.dietary_restrictions.filter(
        restriction => !dietary_compatibility.includes(restriction)
      );
      if (incompatible.length > 0) {
        warnings.push({
          type: 'dietary',
          severity: 'medium',
          message: `Not suitable for: ${incompatible.join(', ')}`,
          restrictions: incompatible
        });
      }
    }
    
    return {
      compatible: warnings.filter(w => w.severity === 'high').length === 0,
      warnings
    };
  } catch (error) {
    logger.error('Error checking product compatibility', { error: error.message, productId, userId });
    return { compatible: true, warnings: [] };
  }
}

// ============================================================================
// SHOPPING CART NUTRITION CALCULATION
// ============================================================================

/**
 * Calculate total nutrition for shopping cart
 * Integrates with nutrient calculator
 */
async function calculateCartNutrition(cartItems) {
  let pg = getPostgreSQL();
  
  try {
    let totalNutrition = { PRO: 0, CARB: 0, FAT: 0, FIB: 0, CAL: 0 };
    const itemNutrition = [];
    
    for (const item of cartItems) {
      let product = await pg.query(
        'SELECT nutrition_data, quantity, unit FROM product_listings WHERE id = $1',
        [item.product_id]
      );
      
      if (product.rows.length > 0) {
        const nutritionData = product.rows[0].nutrition_data || estimateBasicNutrition(1);
        const quantity = item.quantity || 1;
        let weight = product.rows[0].quantity || 100;
        
        const itemTotal = {};
        for (const nutrient in nutritionData) {
          const value = (nutritionData[nutrient] * weight / 100) * quantity;
          itemTotal[nutrient] = Math.round(value * 10) / 10;
          totalNutrition[nutrient] = (totalNutrition[nutrient] || 0) + value;
        }
        
        itemNutrition.push({
          product_id: item.product_id,
          quantity,
          nutrition: itemTotal
        });
      }
    }
    
    // Round totals
    for (const nutrient in totalNutrition) {
      totalNutrition[nutrient] = Math.round(totalNutrition[nutrient] * 10) / 10;
    }
    
    return {
      success: true,
      total_nutrition: totalNutrition,
      item_breakdown: itemNutrition,
      total_items: cartItems.length
    };
  } catch (error) {
    logger.error('Error calculating cart nutrition', { error: error.message });
    return { total_nutrition: {}, item_breakdown: [] };
  }
}

/**
 * Calculate RDA percentage for cart
 */
async function calculateCartRDAPercentage(cartNutrition, userId) {
  try {
    // Get user demographics from health profile
    let healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      return { rda_percentages: [], user_profile: null };
    }
    
    // Standard RDA values (simplified)
    const rdaTargets = {
      PRO: 50,  // 50g protein
      CARB: 300, // 300g carbs
      FAT: 65,   // 65g fat
      FIB: 25,   // 25g fiber
      CAL: 2000  // 2000 calories
    };
    
    const rdaPercentages = Object.entries(cartNutrition).map(([nutrient, value]) => ({
      nutrient,
      value,
      target: rdaTargets[nutrient],
      percentage: rdaTargets[nutrient] ? Math.round((value / rdaTargets[nutrient]) * 100) : null,
      status: getRDAStatus(rdaTargets[nutrient] ? (value / rdaTargets[nutrient]) * 100 : null)
    }));
    
    return {
      success: true,
      user_id: userId,
      user_profile: {
        dietary_restrictions: healthProfile.dietary_restrictions,
        health_goals: healthProfile.health_goals
      },
      rda_percentages: rdaPercentages
    };
  } catch (error) {
    logger.error('Error calculating cart RDA percentage', { error: error.message });
    return { rda_percentages: [] };
  }
}

function getRDAStatus(percentage) {
  if (percentage === null) return 'unknown';
  if (percentage < 50) return 'deficient';
  if (percentage < 80) return 'low';
  if (percentage <= 120) return 'adequate';
  if (percentage <= 200) return 'high';
  return 'excessive';
}

// ============================================================================
// DIETITIAN INTEGRATION
// ============================================================================

/**
 * Get dietitian-curated product collections
 */
async function getDietitianCollections(dietitianId = null) {
  let pg = getPostgreSQL();
  
  try {
    let query = `
      SELECT 
        dc.id,
        dc.collection_name,
        dc.description,
        dc.dietitian_id,
        dc.dietary_focus,
        dc.health_goals,
        dc.created_at,
        u.full_name as dietitian_name,
        u.credentials as dietitian_credentials
      FROM dietitian_collections dc
      LEFT JOIN users u ON dc.dietitian_id = u.id
      WHERE dc.is_active = true
    `;
    
    let params = [];
    
    if (dietitianId) {
      query += ' AND dc.dietitian_id = $1';
      params.push(dietitianId);
    }
    
    query += ' ORDER BY dc.created_at DESC';
    
    let result = await pg.query(query, params);
    
    // Get products for each collection
    const collections = await Promise.all(result.rows.map(async (collection) => {
      const products = await pg.query(`
        SELECT pl.* 
        FROM dietitian_collection_products dcp
        JOIN product_listings pl ON dcp.product_id = pl.id
        WHERE dcp.collection_id = $1
          AND pl.listing_status = 'active'
      `, [collection.id]);
      
      return {
        ...collection,
        products: products.rows,
        product_count: products.rows.length
      };
    }));
    
    return {
      success: true,
      collections
    };
  } catch (error) {
    logger.error('Error getting dietitian collections', { error: error.message });
    return { collections: [] };
  }
}

/**
 * Get dietitian recommendation for user
 */
async function getDietitianRecommendation(userId) {
  let pg = getPostgreSQL();
  
  try {
    // Get user's health profile
    let healthProfile = await consumerHealthService.getHealthProfile(userId);
    
    if (!healthProfile) {
      return { recommendation: null, reason: 'No health profile found' };
    }
    
    // Find dietitian collections matching user's needs
    let collections = await pg.query(`
      SELECT dc.*, u.full_name as dietitian_name
      FROM dietitian_collections dc
      LEFT JOIN users u ON dc.dietitian_id = u.id
      WHERE dc.is_active = true
        AND (
          dc.dietary_focus = ANY($1)
          OR dc.health_goals && $2
        )
      ORDER BY dc.rating DESC
      LIMIT 3
    `, [healthProfile.dietary_restrictions || [], healthProfile.health_goals || []]);
    
    if (collections.rows.length === 0) {
      return { recommendation: null, reason: 'No matching dietitian collections found' };
    }
    
    // Get products for top collection
    const topCollection = collections.rows[0];
    let products = await pg.query(`
      SELECT pl.*
      FROM dietitian_collection_products dcp
      JOIN product_listings pl ON dcp.product_id = pl.id
      WHERE dcp.collection_id = $1
        AND pl.listing_status = 'active'
    `, [topCollection.id]);
    
    return {
      success: true,
      user_id: userId,
      recommendation: {
        collection: topCollection,
        products: products.rows,
        match_reason: `Matches dietary focus: ${topCollection.dietary_focus} and health goals: ${topCollection.health_goals.join(', ')}`
      }
    };
  } catch (error) {
    logger.error('Error getting dietitian recommendation', { error: error.message, userId });
    return { recommendation: null, reason: 'Error occurred' };
  }
}

// ============================================================================
// CROSS-MODULE SIGNAL BUS EVENTS
// ============================================================================

/**
 * Emit comprehensive marketplace integration events
 */
async function emitIntegrationEvent(eventType, data) {
  const eventPayloads = {
    'product.nutrition_scored': {
      event_type: 'product.nutrition_scored',
      entity_id: data.product_id,
      entity_type: 'product_listing',
      nutrition_score: data.nutrition_score,
      nutrition_grade: data.nutrition_grade,
      timestamp: new Date().toISOString()
    },
    'recipe.products_matched': {
      event_type: 'recipe.products_matched',
      entity_id: data.recipe_id,
      entity_type: 'recipe',
      product_count: data.products.length,
      product_ids: data.products.map(p => p.id),
      timestamp: new Date().toISOString()
    },
    'health.recommendations_viewed': {
      event_type: 'health.recommendations_viewed',
      entity_id: data.user_id,
      entity_type: 'user',
      recommendation_count: data.count,
      dietary_restrictions: data.dietary_restrictions,
      timestamp: new Date().toISOString()
    },
    'cart.nutrition_calculated': {
      event_type: 'cart.nutrition_calculated',
      entity_id: data.cart_id,
      entity_type: 'cart',
      total_nutrition: data.total_nutrition,
      item_count: data.item_count,
      timestamp: new Date().toISOString()
    }
  };
  
  const payload = eventPayloads[eventType];
  if (payload) {
    await signalBus.emit(eventType, payload);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Nutrition Scoring
  calculateProductNutritionScore,
  calculateNutritionPricePremium,
  
  // Recipe Integration
  getRecipeSuggestionsForProduct,
  calculateRecipeNutrition,
  getProductsForRecipe,
  
  // Health-Based Recommendations
  getHealthBasedRecommendations,
  checkProductCompatibility,
  
  // Shopping Cart Nutrition
  calculateCartNutrition,
  calculateCartRDAPercentage,
  
  // Dietitian Integration
  getDietitianCollections,
  getDietitianRecommendation,
  
  // Signal Bus Events
  emitIntegrationEvent
};


