/**
 * Recipe Intelligence Service
 * CAP-281 to CAP-288: Recipe Database, AI Recipe Generator, Nutrition Calculation,
 * Ingredient Substitution, Cost Calculator, Seasonal Recipes, Regional Recipes, Institutional Recipes
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const nutritionIntelligenceService = require('./nutritionIntelligenceService');
const aiGateway = require('../aiGatewayService');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

// ============================================================================
// RECIPE DATABASE (CAP-281)
// ============================================================================

/**
 * Create recipe entry
 */
router.post('/recipes', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      recipe_name,
      cuisine_type,
      meal_type,
      difficulty_level,
      preparation_time,
      cooking_time,
      servings,
      ingredients,
      instructions,
      nutritional_info,
      dietary_restrictions,
      allergens,
      equipment_needed,
      source,
      author,
      tags,
      media_files,
      verified_by,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO recipe_database 
       (recipe_name, cuisine_type, meal_type, difficulty_level, preparation_time, 
        cooking_time, servings, ingredients, instructions, nutritional_info, 
        dietary_restrictions, allergens, equipment_needed, source, author, 
        tags, media_files, verified_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
       RETURNING *`,
      [
        recipe_name, cuisine_type, meal_type, difficulty_level, preparation_time,
        cooking_time, servings, JSON.stringify(ingredients), JSON.stringify(instructions),
        JSON.stringify(nutritional_info), JSON.stringify(dietary_restrictions),
        JSON.stringify(allergens), JSON.stringify(equipment_needed), source, author,
        JSON.stringify(tags), JSON.stringify(media_files), verified_by,
      ],
    );

    logger.info(`Recipe created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

/**
 * Get recipes with filters
 */
router.get('/recipes', authMiddleware, async (req, res) => {
  try {
    const { cuisine_type, meal_type, difficulty_level, dietary_restrictions, allergen_free, search } = req.query;

    let query = 'SELECT * FROM recipe_database WHERE is_verified = true';
    const params = [];
    let paramCount = 0;

    if (cuisine_type) {
      paramCount++;
      query += ` AND cuisine_type = $${paramCount}`;
      params.push(cuisine_type);
    }

    if (meal_type) {
      paramCount++;
      query += ` AND meal_type = $${paramCount}`;
      params.push(meal_type);
    }

    if (difficulty_level) {
      paramCount++;
      query += ` AND difficulty_level = $${paramCount}`;
      params.push(difficulty_level);
    }

    if (dietary_restrictions) {
      paramCount++;
      query += ` AND dietary_restrictions @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([dietary_restrictions]));
    }

    if (allergen_free) {
      paramCount++;
      query += ` AND NOT allergens @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([allergen_free]));
    }

    if (search) {
      paramCount++;
      query += ` AND (recipe_name ILIKE $${paramCount} OR ingredients::text ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get recipes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get recipes' });
  }
});

/**
 * Get recipe by ID
 */
router.get('/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM recipe_database WHERE id = $1',
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get recipe' });
  }
});

// ============================================================================
// AI RECIPE GENERATOR (CAP-282)
// ============================================================================

/**
 * Generate recipe using AI
 */
router.post('/generate-recipe', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      available_ingredients,
      cuisine_preference,
      meal_type,
      dietary_restrictions,
      servings,
      difficulty_level,
      time_constraint,
      calorie_target,
      protein_target,
    } = req.body;

    // Generate recipe using AI
    const generatedRecipe = await generateAIRecipe({
      available_ingredients,
      cuisine_preference,
      meal_type,
      dietary_restrictions,
      servings,
      difficulty_level,
      time_constraint,
      calorie_target,
      protein_target,
    });

    // Store generated recipe
    const result = await pool.query(
      `INSERT INTO recipe_database 
       (recipe_name, cuisine_type, meal_type, difficulty_level, preparation_time, 
        cooking_time, servings, ingredients, instructions, nutritional_info, 
        dietary_restrictions, allergens, equipment_needed, source, author, 
        tags, media_files, verified_by, is_ai_generated, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true, NOW(), NOW())
       RETURNING *`,
      [
        generatedRecipe.recipe_name,
        generatedRecipe.cuisine_type,
        generatedRecipe.meal_type,
        generatedRecipe.difficulty_level,
        generatedRecipe.preparation_time,
        generatedRecipe.cooking_time,
        generatedRecipe.servings,
        JSON.stringify(generatedRecipe.ingredients),
        JSON.stringify(generatedRecipe.instructions),
        JSON.stringify(generatedRecipe.nutritional_info),
        JSON.stringify(generatedRecipe.dietary_restrictions),
        JSON.stringify(generatedRecipe.allergens),
        JSON.stringify(generatedRecipe.equipment_needed),
        'AI Generated',
        'AI Recipe Generator',
        JSON.stringify(generatedRecipe.tags),
        JSON.stringify(generatedRecipe.media_files),
        null,
      ],
    );

    logger.info(`AI recipe generated: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Generate AI recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate AI recipe' });
  }
});

/** Generate a structured recipe through the governed AI gateway. */
async function generateAIRecipe(params) {
  const response = await aiGateway.run({
    moduleId: 'recipe-intelligence',
    capability: 'master-chef-recipe-writer',
    prompt: `Return JSON only for a recipe using these constraints: ${JSON.stringify(params)}. Include recipe_name, cuisine_type, meal_type, difficulty_level, preparation_time, cooking_time, servings, ingredients with gram quantities, instructions, nutritional_info, dietary_restrictions, allergens, equipment_needed, and tags. Do not invent nutrition values; nutrition will be calculated from verified profiles.`,
    context: { cuisine: params.cuisine_preference, ingredients: params.available_ingredients },
  });
  if (!response.success) {
    const error = new Error(response.error);
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }
  let recipe;
  try {
    recipe = JSON.parse(response.content);
  } catch (error) {
    error.code = 'INVALID_STRUCTURED_AI_OUTPUT';
    throw error;
  }
  if (!recipe.recipe_name || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.instructions)) {
    const error = new Error('AI recipe output is missing required fields');
    error.code = 'INVALID_STRUCTURED_AI_OUTPUT';
    throw error;
  }
  return { ...recipe, ai_provenance: response.provenance };
}

// ============================================================================
// NUTRITION CALCULATION (CAP-283)
// ============================================================================

/**
 * Calculate nutrition for recipe
 */
router.post('/nutrition-calculation', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { ingredients, servings } = req.body;

    // Calculate nutrition
    const nutrition = await calculateRecipeNutrition(ingredients, servings);

    res.json({
      ingredients,
      servings,
      nutrition_per_serving: nutrition,
      total_nutrition: {
        calories: nutrition.calories * servings,
        protein: nutrition.protein * servings,
        carbohydrates: nutrition.carbohydrates * servings,
        fat: nutrition.fat * servings,
        fiber: nutrition.fiber * servings,
      },
    });
  } catch (error) {
    logger.error('Calculate nutrition error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate nutrition' });
  }
});

/**
 * Calculate recipe nutrition
 */
async function calculateRecipeNutrition(ingredients, servings) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) throw new Error('ingredients must be a non-empty array');
  const servingCount = Number(servings);
  if (!Number.isFinite(servingCount) || servingCount <= 0) throw new Error('servings must be greater than zero');

  const totals = { CAL: 0, PRO: 0, CARB: 0, FAT: 0, FIB: 0 };
  const sources = [];
  for (const ingredient of ingredients) {
    const name = String(ingredient.name || '').trim();
    const unit = String(ingredient.unit || 'g').toLowerCase();
    const quantityGrams = Number(ingredient.quantityGrams ?? ingredient.quantity);
    if (!name || !Number.isFinite(quantityGrams) || quantityGrams <= 0 || !['g', 'gram', 'grams'].includes(unit)) {
      throw new Error(`Ingredient ${name || '(unnamed)'} requires a positive quantity in grams`);
    }

    const profiles = await nutritionIntelligenceService.searchFoodProfiles(name.split(/\s+/)[0]);
    const profile = profiles.find(item => String(item.food_name).toLowerCase() === name.toLowerCase()) || profiles[0];
    if (!profile || !profile.nutrition_data) {
      const error = new Error(`Verified nutrition data unavailable for ${name}`);
      error.code = 'VERIFIED_NUTRITION_DATA_REQUIRED';
      throw error;
    }

    const factor = quantityGrams / 100;
    for (const key of Object.keys(totals)) totals[key] += Number(profile.nutrition_data[key] || 0) * factor;
    sources.push({ name: profile.food_name, profileId: profile.id, source: 'food_nutrition_profiles' });
  }

  return {
    calories: Math.round(totals.CAL / servingCount),
    protein: Math.round(totals.PRO / servingCount),
    carbohydrates: Math.round(totals.CARB / servingCount),
    fat: Math.round(totals.FAT / servingCount),
    fiber: Math.round(totals.FIB / servingCount),
    provenance: 'verified food_nutrition_profiles per-100g composition data',
    sources,
  };
}

/**
 * Get nutrition data for ingredient
 */
router.get('/nutrition-data/:ingredient', authMiddleware, async (req, res) => {
  try {
    const ingredient = req.params.ingredient;
    const profiles = await nutritionIntelligenceService.searchFoodProfiles(ingredient.split(/\s+/)[0]);
    const profile = profiles.find(item => String(item.food_name).toLowerCase() === ingredient.toLowerCase()) || profiles[0];
    if (!profile) return res.status(404).json({ error: 'Verified nutrition profile not found' });
    res.json({ ...profile, provenance: 'food_nutrition_profiles' });
  } catch (error) {
    logger.error('Get nutrition data error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get nutrition data' });
  }
});

// ============================================================================
// INGREDIENT SUBSTITUTION (CAP-284)
// ============================================================================

/**
 * Get ingredient substitutions
 */
router.post('/ingredient-substitution', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { ingredient, dietary_restrictions, availability, cuisine_type } = req.body;

    const substitutions = await findIngredientSubstitutions({
      ingredient,
      dietary_restrictions,
      availability,
      cuisine_type,
    });

    res.json({
      original_ingredient: ingredient,
      substitutions,
      recommendation: substitutions[0] || null,
    });
  } catch (error) {
    logger.error('Get ingredient substitutions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get ingredient substitutions' });
  }
});

/**
 * Find ingredient substitutions
 */
async function findIngredientSubstitutions(params) {
  // Mock substitution logic - in production, would use AI and substitution database
  logger.info(`Finding substitutions for ${params.ingredient}`);

  const substitutionDatabase = {
    milk: [
      { substitute: 'almond milk', ratio: '1:1', notes: 'Dairy-free option' },
      { substitute: 'coconut milk', ratio: '1:1', notes: 'Richer flavor, dairy-free' },
      { substitute: 'soy milk', ratio: '1:1', notes: 'High protein alternative' },
    ],
    butter: [
      { substitute: 'coconut oil', ratio: '1:1', notes: 'Dairy-free, solid at room temp' },
      { substitute: 'olive oil', ratio: '3:4', notes: 'Healthier fat option' },
      { substitute: 'applesauce', ratio: '1:1', notes: 'For baking, reduces fat' },
    ],
    flour: [
      { substitute: 'almond flour', ratio: '1:1', notes: 'Gluten-free, low carb' },
      { substitute: 'coconut flour', ratio: '1:4', notes: 'Gluten-free, absorbent' },
      { substitute: 'oat flour', ratio: '1:1', notes: 'Whole grain option' },
    ],
  };

  return substitutionDatabase[params.ingredient.toLowerCase()] || [
    { substitute: 'similar ingredient', ratio: '1:1', notes: 'Generic substitution' },
  ];
}

// ============================================================================
// COST CALCULATOR (CAP-285)
// ============================================================================

/**
 * Calculate recipe cost
 */
router.post('/cost-calculation', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { ingredients, servings, location } = req.body;

    const cost = await calculateRecipeCost(ingredients, servings, location);

    res.json({
      ingredients,
      servings,
      cost_per_serving: cost.cost_per_serving,
      total_cost: cost.total_cost,
      cost_breakdown: cost.cost_breakdown,
      location: location || 'default',
    });
  } catch (error) {
    logger.error('Calculate recipe cost error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate recipe cost' });
  }
});

/**
 * Calculate recipe cost
 */
async function calculateRecipeCost(ingredients, servings, location) {
  // Mock cost calculation - in production, would use pricing database
  logger.info('Calculating recipe cost');

  let totalCost = 0;
  const costBreakdown = [];

  ingredients.forEach(ingredient => {
    // Mock price per unit
    const pricePerUnit = {
      vegetables: 0.05,
      fruits: 0.08,
      grains: 0.03,
      proteins: 0.15,
      dairy: 0.10,
      spices: 0.20,
    };

    const category = ingredient.category || 'vegetables';
    const price = pricePerUnit[category] || 0.05;
    const quantity = parseFloat(ingredient.quantity) || 1;
    const ingredientCost = price * quantity;

    totalCost += ingredientCost;
    costBreakdown.push({
      ingredient: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      unit_price: price,
      total_cost: ingredientCost,
    });
  });

  return {
    total_cost: Math.round(totalCost * 100) / 100,
    cost_per_serving: Math.round((totalCost / servings) * 100) / 100,
    cost_breakdown: costBreakdown,
  };
}

/**
 * Get ingredient pricing
 */
router.get('/ingredient-pricing/:ingredient', authMiddleware, async (req, res) => {
  try {
    const { ingredient } = req.params;
    const { location } = req.query;

    // Mock pricing data - in production, would query pricing database
    const pricing = {
      ingredient,
      average_price: 0.10,
      price_range: { min: 0.05, max: 0.20 },
      unit: 'per gram',
      location: location || 'national',
      seasonality: 'stable',
      availability: 'high',
    };

    res.json(pricing);
  } catch (error) {
    logger.error('Get ingredient pricing error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get ingredient pricing' });
  }
});

// ============================================================================
// SEASONAL RECIPES (CAP-286)
// ============================================================================

/**
 * Get seasonal recipes
 */
router.get('/seasonal-recipes', authMiddleware, async (req, res) => {
  try {
    const { season, region, month } = req.query;

    // Determine season if not provided
    const currentSeason = season || determineSeason(month);

    const result = await pool.query(
      `SELECT * FROM recipe_database 
       WHERE is_verified = true 
         AND seasonal_availability @> $1::jsonb
         AND ($2::text IS NULL OR region = $2)
       ORDER BY popularity DESC
       LIMIT 20`,
      [JSON.stringify([currentSeason]), region],
    );

    res.json({
      season: currentSeason,
      region: region || 'all',
      recipes: result.rows,
    });
  } catch (error) {
    logger.error('Get seasonal recipes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get seasonal recipes' });
  }
});

/**
 * Determine season from month
 */
function determineSeason(month) {
  const currentMonth = month || new Date().getMonth() + 1;

  if (currentMonth >= 3 && currentMonth <= 5) return 'spring';
  if (currentMonth >= 6 && currentMonth <= 8) return 'summer';
  if (currentMonth >= 9 && currentMonth <= 11) return 'fall';
  return 'winter';
}

/**
 * Get seasonal ingredients
 */
router.get('/seasonal-ingredients', authMiddleware, async (req, res) => {
  try {
    const { season, region } = req.query;

    const currentSeason = season || determineSeason();

    // Mock seasonal ingredients - in production, would query database
    const seasonalIngredients = {
      spring: ['asparagus', 'spinach', 'strawberries', 'peas', 'artichokes'],
      summer: ['tomatoes', 'corn', 'zucchini', 'bell peppers', 'watermelon'],
      fall: ['pumpkin', 'apples', 'brussels sprouts', 'sweet potatoes', 'cranberries'],
      winter: ['citrus fruits', 'kale', 'brussels sprouts', 'winter squash', 'root vegetables'],
    };

    res.json({
      season: currentSeason,
      region: region || 'all',
      ingredients: seasonalIngredients[currentSeason] || [],
    });
  } catch (error) {
    logger.error('Get seasonal ingredients error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get seasonal ingredients' });
  }
});

// ============================================================================
// REGIONAL RECIPES (CAP-287)
// ============================================================================

/**
 * Get regional recipes
 */
router.get('/regional-recipes', authMiddleware, async (req, res) => {
  try {
    const { region, state, city, cuisine_type } = req.query;

    let query = 'SELECT * FROM recipe_database WHERE is_verified = true';
    const params = [];
    let paramCount = 0;

    if (region) {
      paramCount++;
      query += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (state) {
      paramCount++;
      query += ` AND state = $${paramCount}`;
      params.push(state);
    }

    if (city) {
      paramCount++;
      query += ` AND city = $${paramCount}`;
      params.push(city);
    }

    if (cuisine_type) {
      paramCount++;
      query += ` AND cuisine_type = $${paramCount}`;
      params.push(cuisine_type);
    }

    query += ' ORDER BY popularity DESC LIMIT 20';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get regional recipes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get regional recipes' });
  }
});

/**
 * Get regional cuisine information
 */
router.get('/regional-cuisine/:region', authMiddleware, async (req, res) => {
  try {
    const { region } = req.params;

    // Mock regional cuisine data - in production, would query database
    const cuisineInfo = {
      region,
      popular_dishes: [],
      common_ingredients: [],
      cooking_techniques: [],
      cultural_significance: '',
      typical_meals: [],
    };

    res.json(cuisineInfo);
  } catch (error) {
    logger.error('Get regional cuisine error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get regional cuisine' });
  }
});

// ============================================================================
// INSTITUTIONAL RECIPES (CAP-288)
// ============================================================================

/**
 * Create institutional recipe
 */
router.post('/institutional-recipes', authLimiter, authMiddleware, async (req, res) => {
  try {
    const {
      institution_id,
      recipe_name,
      meal_type,
      target_servings,
      dietary_requirements,
      nutritional_targets,
      budget_constraints,
      equipment_available,
      staff_skill_level,
      preparation_time_constraint,
      serving_method,
      storage_requirements,
      allergy_considerations,
      special_diet_needs,
      approved_by,
      status,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO institutional_recipes 
       (institution_id, recipe_name, meal_type, target_servings, dietary_requirements, 
        nutritional_targets, budget_constraints, equipment_available, staff_skill_level, 
        preparation_time_constraint, serving_method, storage_requirements, 
        allergy_considerations, special_diet_needs, approved_by, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
       RETURNING *`,
      [
        institution_id, recipe_name, meal_type, target_servings,
        JSON.stringify(dietary_requirements), JSON.stringify(nutritional_targets),
        JSON.stringify(budget_constraints), JSON.stringify(equipment_available),
        staff_skill_level, preparation_time_constraint, serving_method,
        JSON.stringify(storage_requirements), JSON.stringify(allergy_considerations),
        JSON.stringify(special_diet_needs), approved_by, status,
      ],
    );

    logger.info(`Institutional recipe created: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create institutional recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create institutional recipe' });
  }
});

/**
 * Get institutional recipes
 */
router.get('/institutional-recipes', authMiddleware, async (req, res) => {
  try {
    const { institution_id, meal_type, status, dietary_requirements } = req.query;

    let query = 'SELECT * FROM institutional_recipes WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (institution_id) {
      paramCount++;
      query += ` AND institution_id = $${paramCount}`;
      params.push(institution_id);
    }

    if (meal_type) {
      paramCount++;
      query += ` AND meal_type = $${paramCount}`;
      params.push(meal_type);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (dietary_requirements) {
      paramCount++;
      query += ` AND dietary_requirements @> $${paramCount}::jsonb`;
      params.push(JSON.stringify([dietary_requirements]));
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get institutional recipes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get institutional recipes' });
  }
});

/**
 * Scale recipe for institutional use
 */
router.post('/scale-recipe', authLimiter, authMiddleware, async (req, res) => {
  try {
    const { recipe_id, target_servings, institutional_constraints } = req.body;

    // Get original recipe
    const recipeResult = await pool.query(
      'SELECT * FROM recipe_database WHERE id = $1',
      [recipe_id],
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = recipeResult.rows[0];
    const scaleFactor = target_servings / recipe.servings;

    // Scale ingredients
    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: (parseFloat(ingredient.quantity) * scaleFactor).toFixed(2),
    }));

    // Scale nutritional info
    const scaledNutrition = {
      calories: Math.round(recipe.nutritional_info.calories * scaleFactor),
      protein: Math.round(recipe.nutritional_info.protein * scaleFactor),
      carbohydrates: Math.round(recipe.nutritional_info.carbohydrates * scaleFactor),
      fat: Math.round(recipe.nutritional_info.fat * scaleFactor),
      fiber: Math.round(recipe.nutritional_info.fiber * scaleFactor),
    };

    // Adjust for institutional constraints
    const adjustedRecipe = applyInstitutionalConstraints({
      scaledIngredients,
      scaledNutrition,
      constraints: institutional_constraints,
    });

    res.json({
      original_recipe: recipe_id,
      target_servings,
      scale_factor: scaleFactor,
      scaled_ingredients: adjustedRecipe.ingredients,
      scaled_nutrition: adjustedRecipe.nutrition,
      adjustments: adjustedRecipe.adjustments,
      institutional_constraints,
    });
  } catch (error) {
    logger.error('Scale recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to scale recipe' });
  }
});

/**
 * Apply institutional constraints to scaled recipe
 */
function applyInstitutionalConstraints(params) {
  const { scaledIngredients, scaledNutrition, constraints } = params;
  const adjustments = [];

  // Apply budget constraints
  if (constraints?.budget_limit) {
    adjustments.push({ type: 'budget', message: 'Recipe adjusted to meet budget constraints' });
  }

  // Apply equipment constraints
  if (constraints?.equipment_available) {
    adjustments.push({ type: 'equipment', message: 'Recipe adjusted for available equipment' });
  }

  // Apply time constraints
  if (constraints?.time_limit) {
    adjustments.push({ type: 'time', message: 'Recipe adjusted for time constraints' });
  }

  return {
    ingredients: scaledIngredients,
    nutrition: scaledNutrition,
    adjustments,
  };
}

/**
 * Get recipe intelligence dashboard
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const dashboard = await pool.query(`
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(*) FILTER (WHERE is_ai_generated = true) as ai_generated_recipes,
        COUNT(*) FILTER (WHERE cuisine_type = 'Indian') as indian_recipes,
        COUNT(*) FILTER (WHERE cuisine_type = 'Chinese') as chinese_recipes,
        COUNT(*) FILTER (WHERE meal_type = 'Breakfast') as breakfast_recipes,
        COUNT(*) FILTER (WHERE meal_type = 'Lunch') as lunch_recipes,
        COUNT(*) FILTER (WHERE meal_type = 'Dinner') as dinner_recipes,
        AVG(difficulty_level = 'Easy')::int as easy_recipes,
        AVG(difficulty_level = 'Medium')::int as medium_recipes,
        AVG(difficulty_level = 'Hard')::int as hard_recipes
      FROM recipe_database
      WHERE is_verified = true
    `);

    res.json(dashboard.rows[0]);
  } catch (error) {
    logger.error('Get recipe dashboard error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get recipe dashboard' });
  }
});

// Health check
function isHealthy() {
  return true;
}

module.exports = {
  router,
  calculateRecipeNutrition,
  isHealthy,
};

