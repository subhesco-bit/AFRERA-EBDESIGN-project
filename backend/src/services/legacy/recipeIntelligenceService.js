/**
 * Recipe Intelligence Service
 * CAP-281 to CAP-288: Recipe Database, AI Recipe Generator, Nutrition Calculation,
 * Ingredient Substitution, Cost Calculator, Seasonal Recipes, Regional Recipes, Institutional Recipes
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../../utils/logger');
const { authMiddleware } = require('../../../middleware/auth');
const { authLimiter } = require('../../../middleware/rateLimiter');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../../database/pool');

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
      verified_by
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
        JSON.stringify(tags), JSON.stringify(media_files), verified_by
      ]
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

    let result = await pool.query(query, params);
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
    let result = await pool.query(
      'SELECT * FROM recipe_database WHERE id = $1',
      [req.params.id]
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
      protein_target
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
      protein_target
    });

    // Store generated recipe
    let result = await pool.query(
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
        null
      ]
    );

    logger.info(`AI recipe generated: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Generate AI recipe error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate AI recipe' });
  }
});

/**
 * Mock AI recipe generation
 */
async function generateAIRecipe(params) {
  // In production, this would use AI/ML models
  logger.info('Generating AI recipe with parameters', { params });
  return {
    recipe_name: `AI Generated ${params.meal_type || 'Dinner'} with ${params.available_ingredients?.[0] || 'Mixed Ingredients'}`,
    // FIXED 2026-08-04: these three fields were chosen at random when the
    // caller did not specify them, and returned as if the system had decided.
    // A farmer told their dish is "Thai, Hard" by an AI would reasonably
    // believe something analysed it. Nothing did — it was a dice roll.
    //
    // Now: derive what can be derived, and say "unspecified" for what cannot.
    // An honest blank is worth more than a confident fabrication.
    cuisine_type: params.cuisine_preference || 'unspecified',
    meal_type: params.meal_type || 'unspecified',
    // Difficulty IS derivable: more distinct ingredients means more steps and
    // more parallel work. This is a crude heuristic and is labelled as one.
    difficulty_level: params.difficulty_level
      || (() => {
        const n = (params.available_ingredients || []).length;
        if (n === 0) return 'unspecified';
        return n <= 4 ? 'Easy' : n <= 8 ? 'Medium' : 'Hard';
      })(),
    difficulty_basis: params.difficulty_level
      ? 'caller-specified'
      : ((params.available_ingredients || []).length
        ? 'derived from ingredient count (heuristic, not a trained model)'
        : 'insufficient data'),
    preparation_time: 15,
    cooking_time: 30,
    servings: params.servings || 4,
    ingredients: params.available_ingredients || [
      { name: 'Mixed Vegetables', quantity: '2 cups', unit: 'cups' },
      { name: 'Rice', quantity: '1 cup', unit: 'cups' },
      { name: 'Spices', quantity: '1 tbsp', unit: 'tablespoons' }
    ],
    instructions: [
      'Prepare all ingredients by washing and cutting',
      'Heat oil in a pan and add spices',
      'Add vegetables and cook for 10 minutes',
      'Add rice and cook for another 15 minutes',
      'Serve hot'
    ],
    nutritional_info: {
      calories: 350,
      protein: 12,
      carbohydrates: 45,
      fat: 10,
      fiber: 6
    },
    dietary_restrictions: params.dietary_restrictions || [],
    allergens: [],
    equipment_needed: ['Pan', 'Knife', 'Cutting Board', 'Spatula'],
    tags: ['AI Generated', 'Quick', 'Healthy'],
    media_files: []
  };
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
      ingredients: ingredients,
      servings: servings,
      nutrition_per_serving: nutrition,
      total_nutrition: {
        calories: nutrition.calories * servings,
        protein: nutrition.protein * servings,
        carbohydrates: nutrition.carbohydrates * servings,
        fat: nutrition.fat * servings,
        fiber: nutrition.fiber * servings
      }
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
  // Mock nutrition calculation - in production, would use nutrition database
  logger.info('Calculating nutrition for recipe');

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  ingredients.forEach(ingredient => {
    // Mock nutrition values per 100g
    const nutritionPer100g = {
      calories: 100,
      protein: 5,
      carbohydrates: 15,
      fat: 3,
      fiber: 2
    };

    const quantity = parseFloat(ingredient.quantity) || 100;
    const factor = quantity / 100;

    totalCalories += nutritionPer100g.calories * factor;
    totalProtein += nutritionPer100g.protein * factor;
    totalCarbs += nutritionPer100g.carbohydrates * factor;
    totalFat += nutritionPer100g.fat * factor;
    totalFiber += nutritionPer100g.fiber * factor;
  });

  return {
    calories: Math.round(totalCalories / servings),
    protein: Math.round(totalProtein / servings),
    carbohydrates: Math.round(totalCarbs / servings),
    fat: Math.round(totalFat / servings),
    fiber: Math.round(totalFiber / servings)
  };
}

/**
 * Get nutrition data for ingredient
 */
router.get('/nutrition-data/:ingredient', authMiddleware, async (req, res) => {
  try {
    const ingredient = req.params.ingredient;

    // Mock nutrition data - in production, would query nutrition database
    const nutritionData = {
      ingredient: ingredient,
      calories_per_100g: 100,
      protein_per_100g: 5,
      carbohydrates_per_100g: 15,
      fat_per_100g: 3,
      fiber_per_100g: 2,
      vitamins: ['Vitamin A', 'Vitamin C', 'Vitamin K'],
      minerals: ['Iron', 'Calcium', 'Potassium'],
      allergens: []
    };

    res.json(nutritionData);
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
      cuisine_type
    });

    res.json({
      original_ingredient: ingredient,
      substitutions: substitutions,
      recommendation: substitutions[0] || null
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
    'milk': [
      { substitute: 'almond milk', ratio: '1:1', notes: 'Dairy-free option' },
      { substitute: 'coconut milk', ratio: '1:1', notes: 'Richer flavor, dairy-free' },
      { substitute: 'soy milk', ratio: '1:1', notes: 'High protein alternative' }
    ],
    'butter': [
      { substitute: 'coconut oil', ratio: '1:1', notes: 'Dairy-free, solid at room temp' },
      { substitute: 'olive oil', ratio: '3:4', notes: 'Healthier fat option' },
      { substitute: 'applesauce', ratio: '1:1', notes: 'For baking, reduces fat' }
    ],
    'flour': [
      { substitute: 'almond flour', ratio: '1:1', notes: 'Gluten-free, low carb' },
      { substitute: 'coconut flour', ratio: '1:4', notes: 'Gluten-free, absorbent' },
      { substitute: 'oat flour', ratio: '1:1', notes: 'Whole grain option' }
    ]
  };

  return substitutionDatabase[params.ingredient.toLowerCase()] || [
    { substitute: 'similar ingredient', ratio: '1:1', notes: 'Generic substitution' }
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
      ingredients: ingredients,
      servings: servings,
      cost_per_serving: cost.cost_per_serving,
      total_cost: cost.total_cost,
      cost_breakdown: cost.cost_breakdown,
      location: location || 'default'
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
      'vegetables': 0.05,
      'fruits': 0.08,
      'grains': 0.03,
      'proteins': 0.15,
      'dairy': 0.10,
      'spices': 0.20
    };

    const category = ingredient.category || 'vegetables';
    const price = pricePerUnit[category] || 0.05;
    let quantity = parseFloat(ingredient.quantity) || 1;
    const ingredientCost = price * quantity;

    totalCost += ingredientCost;
    costBreakdown.push({
      ingredient: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      unit_price: price,
      total_cost: ingredientCost
    });
  });

  return {
    total_cost: Math.round(totalCost * 100) / 100,
    cost_per_serving: Math.round((totalCost / servings) * 100) / 100,
    cost_breakdown: costBreakdown
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
      ingredient: ingredient,
      average_price: 0.10,
      price_range: { min: 0.05, max: 0.20 },
      unit: 'per gram',
      location: location || 'national',
      seasonality: 'stable',
      availability: 'high'
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

    let result = await pool.query(
      `SELECT * FROM recipe_database 
       WHERE is_verified = true 
         AND seasonal_availability @> $1::jsonb
         AND ($2::text IS NULL OR region = $2)
       ORDER BY popularity DESC
       LIMIT 20`,
      [JSON.stringify([currentSeason]), region]
    );

    res.json({
      season: currentSeason,
      region: region || 'all',
      recipes: result.rows
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

    let currentSeason = season || determineSeason();

    // Mock seasonal ingredients - in production, would query database
    const seasonalIngredients = {
      spring: ['asparagus', 'spinach', 'strawberries', 'peas', 'artichokes'],
      summer: ['tomatoes', 'corn', 'zucchini', 'bell peppers', 'watermelon'],
      fall: ['pumpkin', 'apples', 'brussels sprouts', 'sweet potatoes', 'cranberries'],
      winter: ['citrus fruits', 'kale', 'brussels sprouts', 'winter squash', 'root vegetables']
    };

    res.json({
      season: currentSeason,
      region: region || 'all',
      ingredients: seasonalIngredients[currentSeason] || []
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
    let params = [];
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

    let result = await pool.query(query, params);
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
      region: region,
      popular_dishes: [],
      common_ingredients: [],
      cooking_techniques: [],
      cultural_significance: '',
      typical_meals: []
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
      status
    } = req.body;

    let result = await pool.query(
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
        JSON.stringify(special_diet_needs), approved_by, status
      ]
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
    let params = [];
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

    let result = await pool.query(query, params);
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
      [recipe_id]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = recipeResult.rows[0];
    const scaleFactor = target_servings / recipe.servings;

    // Scale ingredients
    const scaledIngredients = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: (parseFloat(ingredient.quantity) * scaleFactor).toFixed(2)
    }));

    // Scale nutritional info
    const scaledNutrition = {
      calories: Math.round(recipe.nutritional_info.calories * scaleFactor),
      protein: Math.round(recipe.nutritional_info.protein * scaleFactor),
      carbohydrates: Math.round(recipe.nutritional_info.carbohydrates * scaleFactor),
      fat: Math.round(recipe.nutritional_info.fat * scaleFactor),
      fiber: Math.round(recipe.nutritional_info.fiber * scaleFactor)
    };

    // Adjust for institutional constraints
    const adjustedRecipe = applyInstitutionalConstraints({
      scaledIngredients,
      scaledNutrition,
      constraints: institutional_constraints
    });

    res.json({
      original_recipe: recipe_id,
      target_servings: target_servings,
      scale_factor: scaleFactor,
      scaled_ingredients: adjustedRecipe.ingredients,
      scaled_nutrition: adjustedRecipe.nutrition,
      adjustments: adjustedRecipe.adjustments,
      institutional_constraints: institutional_constraints
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
    adjustments: adjustments
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
  isHealthy
};


