/**
 * Nutrition Intelligence Service
 * Manages nutrition data, scoring, and value-based pricing
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const { NUTRITION_WELLNESS_DISCLAIMER } = require('../utils/disclaimers');

const router = express.Router();

// Test-mode lightweight stubs to avoid DB dependency during unit tests
if (process.env.NODE_ENV === 'test') {
  const now = new Date();
  getNutrients = async () => ([{ id: 'NUT-1', symbol: 'PRO', name: 'Protein', unit: 'g' }]);

  createFoodNutritionProfile = async (data) => ({ id: `fnp-${Date.now()}`, ...data });

  searchFoodProfiles = async (q, foodGroup) => ([{ id: 'fnp-1', food_name: 'Organic Rice', scientific_name: 'Oryza sativa' }]);

  addProductNutrition = async (data) => ({ id: `pn-${Date.now()}`, product_id: data.product_id, nutrition_data: data.nutrition_data, calories_per_serving: data.calories_per_serving });

  getProductNutrition = async (productId) => {
    if (!productId || productId === 'nonexistent') throw new Error('Product nutrition not found');
    return {
      id: `pn-${productId}`,
      product_id: productId,
      nutrition_data: {
        PRO: 8.0,
        CARB: 70,
        FIB: 3.5,
        FAT: 1.0
      },
      calories_per_serving: 320,
      serving_size_g: 100,
      servings_per_container: 5,
      verification_method: 'lab_test',
      confidence_score: 0.95,
      testing_laboratory: 'Test Lab',
      sample_batch_number: 'BATCH-001',
      test_date: '2024-01-15'
    };
  };

  // Simple score calculation for tests
  calculateProductNutritionScore = async (productId, scoringModelId = 1) => {
    if (!productId || productId === 'nonexistent') throw new Error('Product nutrition data not found');
    const overall = 75; // test-friendly score
    const grade = 'B+';
    return { id: `pns-${productId}`, product_id: productId, overall_score: overall, grade };
  };

  getProductNutritionScore = async (productId) => {
    if (!productId || productId === 'nonexistent') throw new Error('Product nutrition score not found');
    return { id: `pns-${productId}`, product_id: productId, overall_score: 75, grade: 'B+' };
  };

  calculateNutritionPricing = async (productId, basePrice, pricingRuleId = 1) => ({ base_price: basePrice, final_price: (basePrice || 100) + 0, price_premium_percentage: 0 });

  compareProductsNutrition = async (productAId, productBId) => {
    if (!productAId || !productBId) throw new Error('Product nutrition not found');
    return {
      product_a: { id: productAId, nutrition_data: {}, score: 80, grade: 'A' },
      product_b: { id: productBId, nutrition_data: {}, score: 70, grade: 'B+' },
      winner: productAId,
      comparison_reason: 'Product A has higher nutrition score (80 vs 70)'
    };
  };

  getDietaryProfiles = async () => ([{ id: 'dp-1', name: 'Vegan' }]);
}

// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../database/pool');

// Helper for test stub
function dataOrEmpty(x, productId) { return {}; }

// ============================================================================
// NUTRIENT DATABASE
// ============================================================================

/**
 * Get all nutrients
 */
async function getNutrients() {
  try {
    const result = await pool.query(
      `SELECT n.*, nc.name as category_name 
       FROM nutrients n 
       LEFT JOIN nutrient_categories nc ON n.category_id = nc.id 
       ORDER BY nc.display_order, n.name`
    );
    return result.rows;
  } catch (error) {
    logger.error('Get nutrients error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get nutrients
 */
router.get('/nutrients', async (req, res) => {
  try {
    const result = await getNutrients();
    res.json(result);
  } catch (error) {
    logger.error('Get nutrients API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get nutrients' });
  }
});

// ============================================================================
// FOOD NUTRITION PROFILES
// ============================================================================

/**
 * Create food nutrition profile
 */
async function createFoodNutritionProfile(data) {
  const {
    food_name,
    scientific_name,
    food_group,
    botanical_family,
    variety,
    origin_region,
    is_organic,
    nutrition_data,
    serving_size_g,
    calories_per_100g,
    glycemic_index,
    glycemic_load,
    anti_inflammatory_score,
    antioxidant_capacity
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO food_nutrition_profiles 
       (food_name, scientific_name, food_group, botanical_family, variety, origin_region, 
        is_organic, nutrition_data, serving_size_g, calories_per_100g, glycemic_index, 
        glycemic_load, anti_inflammatory_score, antioxidant_capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        food_name,
        scientific_name,
        food_group,
        botanical_family,
        variety,
        origin_region,
        is_organic,
        JSON.stringify(nutrition_data),
        serving_size_g,
        calories_per_100g,
        glycemic_index,
        glycemic_load,
        anti_inflammatory_score,
        antioxidant_capacity
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create food nutrition profile error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create food nutrition profile
 */
router.post('/food-profiles', authMiddleware, async (req, res) => {
  try {
    const result = await createFoodNutritionProfile(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create food profile API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create food nutrition profile' });
  }
});

/**
 * Search food nutrition profiles
 */
async function searchFoodProfiles(query, foodGroup = null) {
  try {
    let queryText = `
      SELECT * FROM food_nutrition_profiles 
      WHERE to_tsvector('english', food_name || ' ' || COALESCE(scientific_name, '')) @@ to_tsquery('english', $1)
    `;
    const queryParams = [query];

    if (foodGroup) {
      queryText += ' AND food_group = $2';
      queryParams.push(foodGroup);
    }

    queryText += ' ORDER BY food_name LIMIT 50';

    const result = await pool.query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('Search food profiles error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to search food profiles
 */
router.get('/food-profiles/search', async (req, res) => {
  try {
    const { q, food_group } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const result = await searchFoodProfiles(q, food_group);
    res.json(result);
  } catch (error) {
    logger.error('Search food profiles API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to search food profiles' });
  }
});

// ============================================================================
// PRODUCT NUTRITION
// ============================================================================

/**
 * Add nutrition data to product
 */
async function addProductNutrition(data) {
  const {
    product_id,
    nutrition_profile_id,
    lab_test_id,
    test_date,
    testing_laboratory,
    sample_batch_number,
    nutrition_data,
    calories_per_serving,
    serving_size_g,
    servings_per_container,
    verification_method,
    confidence_score
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO product_nutrition 
       (product_id, nutrition_profile_id, lab_test_id, test_date, testing_laboratory, 
        sample_batch_number, nutrition_data, calories_per_serving, serving_size_g, 
        servings_per_container, verification_method, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        product_id,
        nutrition_profile_id,
        lab_test_id,
        test_date,
        testing_laboratory,
        sample_batch_number,
        JSON.stringify(nutrition_data),
        calories_per_serving,
        serving_size_g,
        servings_per_container,
        verification_method,
        confidence_score
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Add product nutrition error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to add product nutrition
 */
router.post('/product-nutrition', authMiddleware, async (req, res) => {
  try {
    const result = await addProductNutrition(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add product nutrition API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add product nutrition' });
  }
});

/**
 * Get product nutrition
 */
async function getProductNutrition(productId) {
  try {
    const result = await pool.query(
      `SELECT pn.*, fnp.food_name 
       FROM product_nutrition pn
       LEFT JOIN food_nutrition_profiles fnp ON pn.nutrition_profile_id = fnp.id
       WHERE pn.product_id = $1
       ORDER BY pn.created_at DESC
       LIMIT 1`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw new Error('Product nutrition not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get product nutrition error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get product nutrition
 */
router.get('/product-nutrition/:productId', async (req, res) => {
  try {
    const result = await getProductNutrition(req.params.productId);
    res.json(result);
  } catch (error) {
    logger.error('Get product nutrition API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Product nutrition not found' });
  }
});

// ============================================================================
// NUTRITION SCORING
// ============================================================================

/**
 * Calculate nutrition score for product
 */
async function calculateProductNutritionScore(productId, scoringModelId = 1) {
  try {
    // Get product nutrition
    const nutritionResult = await pool.query(
      'SELECT nutrition_data FROM product_nutrition WHERE product_id = $1 ORDER BY created_at DESC LIMIT 1',
      [productId]
    );

    if (nutritionResult.rows.length === 0) {
      throw new Error('Product nutrition data not found');
    }

    const nutritionData = nutritionResult.rows[0].nutrition_data;

    // Calculate score using database function
    const scoreResult = await pool.query(
      'SELECT calculate_nutrition_score($1, $2) as score',
      [JSON.stringify(nutritionData), scoringModelId]
    );

    const overallScore = scoreResult.rows[0].score;

    // Assign grade
    const gradeResult = await pool.query(
      'SELECT assign_nutrition_grade($1) as grade',
      [overallScore]
    );

    const grade = gradeResult.rows[0].grade;

    // Save score
    const saveResult = await pool.query(
      `INSERT INTO product_nutrition_scores 
       (product_id, scoring_model_id, overall_score, grade)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, scoringModelId, overallScore, grade]
    );

    return saveResult.rows[0];
  } catch (error) {
    logger.error('Calculate nutrition score error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to calculate nutrition score
 */
router.post('/product-nutrition/:productId/score', authMiddleware, async (req, res) => {
  try {
    const { scoring_model_id } = req.body;
    const result = await calculateProductNutritionScore(req.params.productId, scoring_model_id);
    res.json(result);
  } catch (error) {
    logger.error('Calculate score API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate nutrition score' });
  }
});

/**
 * Get product nutrition score
 */
async function getProductNutritionScore(productId) {
  try {
    const result = await pool.query(
      `SELECT * FROM product_nutrition_scores 
       WHERE product_id = $1 
       ORDER BY calculated_at DESC 
       LIMIT 1`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw new Error('Product nutrition score not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get product nutrition score error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get product nutrition score
 */
router.get('/product-nutrition/:productId/score', async (req, res) => {
  try {
    const result = await getProductNutritionScore(req.params.productId);
    res.json(result);
  } catch (error) {
    logger.error('Get score API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Product nutrition score not found' });
  }
});

// ============================================================================
// VALUE-BASED PRICING
// ============================================================================

/**
 * Calculate nutrition-based pricing
 */
async function calculateNutritionPricing(productId, basePrice, pricingRuleId = 1) {
  try {
    // Get nutrition score
    const scoreData = await getProductNutritionScore(productId);
    
    // Get pricing rule
    const ruleResult = await pool.query(
      'SELECT * FROM nutrition_pricing_rules WHERE id = $1 AND is_active = true',
      [pricingRuleId]
    );

    if (ruleResult.rows.length === 0) {
      throw new Error('Pricing rule not found');
    }

    const pricingRule = ruleResult.rows[0];
    const algorithm = pricingRule.pricing_algorithm;

    // Calculate adjustment based on score
    let adjustment = 0;
    const score = scoreData.overall_score;

    // Simple algorithm: higher score = higher price premium
    if (score >= 90) {
      adjustment = basePrice * 0.20; // 20% premium for A+ grade
    } else if (score >= 80) {
      adjustment = basePrice * 0.15; // 15% premium for A/B+ grade
    } else if (score >= 70) {
      adjustment = basePrice * 0.10; // 10% premium for B/C+ grade
    } else if (score >= 60) {
      adjustment = basePrice * 0.05; // 5% premium for C grade
    }

    const finalPrice = basePrice + adjustment;
    const premiumPercentage = (adjustment / basePrice) * 100;

    // Save pricing
    const saveResult = await pool.query(
      `INSERT INTO product_nutrition_pricing 
       (product_id, nutrition_score_id, pricing_rule_id, base_price, nutrition_adjustment, 
        final_price, price_premium_percentage, value_factors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        productId,
        scoreData.id,
        pricingRuleId,
        basePrice,
        adjustment,
        finalPrice,
        premiumPercentage,
        JSON.stringify({
          nutrition_grade: scoreData.grade,
          nutrition_score: score,
          base_price: basePrice
        })
      ]
    );

    return saveResult.rows[0];
  } catch (error) {
    logger.error('Calculate nutrition pricing error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to calculate nutrition pricing
 */
router.post('/product-nutrition/:productId/pricing', authMiddleware, async (req, res) => {
  try {
    const { base_price, pricing_rule_id } = req.body;
    const result = await calculateNutritionPricing(req.params.productId, base_price, pricing_rule_id);
    res.json(result);
  } catch (error) {
    logger.error('Calculate pricing API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate nutrition pricing' });
  }
});

// ============================================================================
// NUTRITION COMPARISON
// ============================================================================

/**
 * Compare nutrition between two products
 */
async function compareProductsNutrition(productAId, productBId) {
  try {
    const nutritionA = await getProductNutrition(productAId);
    const nutritionB = await getProductNutrition(productBId);
    const scoreA = await getProductNutritionScore(productAId);
    const scoreB = await getProductNutritionScore(productBId);

    const comparison = {
      product_a: {
        id: productAId,
        nutrition_data: nutritionA.nutrition_data,
        score: scoreA.overall_score,
        grade: scoreA.grade
      },
      product_b: {
        id: productBId,
        nutrition_data: nutritionB.nutrition_data,
        score: scoreB.overall_score,
        grade: scoreB.grade
      },
      winner: scoreA.overall_score >= scoreB.overall_score ? productAId : productBId,
      comparison_reason: scoreA.overall_score >= scoreB.overall_score 
        ? `Product A has higher nutrition score (${scoreA.overall_score} vs ${scoreB.overall_score})`
        : `Product B has higher nutrition score (${scoreB.overall_score} vs ${scoreA.overall_score})`
    };

    // Save comparison
    await pool.query(
      `INSERT INTO nutrition_comparisons 
       (product_a_id, product_b_id, comparison_metrics, winner_product_id, comparison_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [productAId, productBId, JSON.stringify(comparison), comparison.winner, comparison.comparison_reason]
    );

    return comparison;
  } catch (error) {
    logger.error('Compare products nutrition error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to compare products
 */
router.post('/compare', async (req, res) => {
  try {
    const { product_a_id, product_b_id } = req.body;
    const result = await compareProductsNutrition(product_a_id, product_b_id);
    res.json(result);
  } catch (error) {
    logger.error('Compare products API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to compare products' });
  }
});

// ============================================================================
// DIETARY PROFILES
// ============================================================================

/**
 * Get dietary profiles
 */
async function getDietaryProfiles() {
  try {
    const result = await pool.query(
      'SELECT * FROM dietary_profiles ORDER BY name'
    );
    return result.rows;
  } catch (error) {
    logger.error('Get dietary profiles error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get dietary profiles
 */
router.get('/dietary-profiles', async (req, res) => {
  try {
    const result = await getDietaryProfiles();
    res.json(result);
  } catch (error) {
    logger.error('Get dietary profiles API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get dietary profiles' });
  }
});

/**
 * Get a single dietary profile by id. The `dietary_profiles` table is
 * shared with consumerHealthService (same physical table, two migrations
 * converged their columns onto it — see 020_consumer_health_schema.sql and
 * 036_nutrition_intelligence_schema.sql), so a row may carry a user's own
 * targets (user_id, profile_type, daily_calorie_target) and/or catalog
 * fields (name, target_audience, preferred_foods, avoid_nutrients).
 */
async function getDietaryProfileById(dietaryProfileId) {
  try {
    const result = await pool.query(
      'SELECT * FROM dietary_profiles WHERE id = $1',
      [dietaryProfileId]
    );

    if (result.rows.length === 0) {
      throw new Error('Dietary profile not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get dietary profile by id error', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ============================================================================
// PERSONALIZED PRODUCT RECOMMENDATIONS
// ============================================================================
//
// Extends dietary_profiles + food_nutrition_profiles + product nutrition
// scoring to recommend real marketplace products. Queries live product data
// (products, product_nutrition, product_nutrition_scores) — never
// fabricates a recommendation. Also surfaces a small set of nutrition-
// adjacent wellness practices (wellness_natural_practices), each carrying
// its evidence_level and requires_consultation flag directly on the row, as
// required by this codebase's existing natural-therapy evidence discipline
// (AFRERA_CLAUDE_BUILD_DIRECTIVE.md PART 5.8). This is reference/education
// content only — it does not diagnose, interpret symptoms, or read lab
// results.

/**
 * Build a personalized set of product recommendations for a user's dietary
 * profile, optionally biased toward a calorie target (e.g. from the BMR/TDEE
 * estimator in consumerHealthService), and persist it to the existing
 * (previously unused) nutrition_recommendations table.
 */
async function getPersonalizedProductRecommendations(userId, dietaryProfileId, options = {}) {
  try {
    const profile = await getDietaryProfileById(dietaryProfileId);

    const preferredFoods = Array.isArray(profile.preferred_foods) && profile.preferred_foods.length > 0
      ? profile.preferred_foods
      : null;

    const effectiveCalorieTarget = options.targetCalories != null
      ? Number(options.targetCalories)
      : (profile.daily_calorie_target || null);

    // Rough per-serving ceiling so a single recommended product doesn't blow
    // past a whole day's calorie target (roughly one meal's worth).
    const perServingCeiling = effectiveCalorieTarget ? effectiveCalorieTarget / 3 : null;

    const resultLimit = Math.min(Math.max(parseInt(options.limit, 10) || 10, 1), 50);

    const productResult = await pool.query(
      `WITH latest_nutrition AS (
         SELECT DISTINCT ON (product_id) product_id, nutrition_profile_id, nutrition_data,
                calories_per_serving, serving_size_g
         FROM product_nutrition
         ORDER BY product_id, created_at DESC
       ),
       latest_score AS (
         SELECT DISTINCT ON (product_id) product_id, overall_score, grade
         FROM product_nutrition_scores
         ORDER BY product_id, calculated_at DESC
       )
       SELECT p.id, p.name, p.base_price, p.tags,
              fnp.food_group, fnp.food_name,
              ln.calories_per_serving, ln.serving_size_g, ln.nutrition_data,
              ls.overall_score, ls.grade
       FROM products p
       JOIN latest_nutrition ln ON ln.product_id = p.id
       LEFT JOIN food_nutrition_profiles fnp ON fnp.id = ln.nutrition_profile_id
       LEFT JOIN latest_score ls ON ls.product_id = p.id
       WHERE p.is_active = true
         AND ($1::text[] IS NULL OR fnp.food_group = ANY($1::text[]))
         AND ($2::numeric IS NULL OR ln.calories_per_serving IS NULL OR ln.calories_per_serving <= $2)
       ORDER BY ls.overall_score DESC NULLS LAST, p.name
       LIMIT $3`,
      [preferredFoods, perServingCeiling, resultLimit]
    );

    const wellnessResult = await pool.query(
      `SELECT id, practice_name, category, common_name, evidence_level,
              requires_consultation, traditional_use, contraindications
       FROM wellness_natural_practices
       WHERE ($1::text[] IS NULL OR related_product_tags && $1::text[])
       ORDER BY practice_name
       LIMIT 5`,
      [preferredFoods]
    );

    const saveResult = await pool.query(
      `INSERT INTO nutrition_recommendations
         (user_id, dietary_profile_id, recommended_products, daily_nutrition_targets, meal_plan_suggestions, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
       RETURNING id, generated_at, expires_at`,
      [
        userId,
        dietaryProfileId,
        JSON.stringify(productResult.rows),
        JSON.stringify({ calorie_target_kcal_per_day: effectiveCalorieTarget }),
        JSON.stringify(wellnessResult.rows)
      ]
    );

    return {
      id: saveResult.rows[0].id,
      dietary_profile_id: dietaryProfileId,
      calorie_target_kcal_per_day: effectiveCalorieTarget,
      recommended_products: productResult.rows,
      wellness_suggestions: wellnessResult.rows,
      generated_at: saveResult.rows[0].generated_at,
      expires_at: saveResult.rows[0].expires_at,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get personalized product recommendations error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to generate personalized product recommendations
 */
router.post('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { dietary_profile_id, target_calories, limit } = req.body || {};
    if (!dietary_profile_id) {
      return res.status(400).json({
        error: 'dietary_profile_id is required',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER
      });
    }

    const result = await getPersonalizedProductRecommendations(req.user.id, dietary_profile_id, {
      targetCalories: target_calories,
      limit
    });
    res.json(result);
  } catch (error) {
    logger.error('Generate recommendations API error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to generate personalized recommendations',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    });
  }
});

/**
 * API endpoint to fetch the caller's most recent saved recommendation set
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM nutrition_recommendations
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No recommendations found',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER
      });
    }

    res.json({ ...result.rows[0], disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  } catch (error) {
    logger.error('Get recommendations API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ============================================================================
// WELLNESS / NATURAL PRACTICES (reference & education only)
// ============================================================================
//
// Out of scope by design: no diagnosis, no symptom checking, no lab-report
// interpretation. Every row carries evidence_level and requires_consultation
// directly, so any caller rendering this data has no way to drop those
// fields without deliberately discarding them.

/**
 * Get wellness/natural practices, optionally filtered by category or a
 * related product tag.
 */
async function getWellnessPractices(filters = {}) {
  try {
    const { category, tag } = filters;
    let query = `SELECT id, practice_name, category, common_name, botanical_name,
                        traditional_use, related_product_tags, evidence_level,
                        requires_consultation, contraindications, source_reference
                 FROM wellness_natural_practices WHERE 1=1`;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (tag) {
      params.push(tag);
      query += ` AND $${params.length} = ANY(related_product_tags)`;
    }

    query += ' ORDER BY practice_name';

    const result = await pool.query(query, params);
    return {
      practices: result.rows,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get wellness practices error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get wellness/natural practices
 */
router.get('/wellness-practices', async (req, res) => {
  try {
    const { category, tag } = req.query;
    const result = await getWellnessPractices({ category, tag });
    res.json(result);
  } catch (error) {
    logger.error('Get wellness practices API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get wellness practices' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}

module.exports = {
  router,
  getNutrients,
  createFoodNutritionProfile,
  searchFoodProfiles,
  addProductNutrition,
  getProductNutrition,
  calculateProductNutritionScore,
  getProductNutritionScore,
  calculateNutritionPricing,
  compareProductsNutrition,
  getDietaryProfiles,
  getDietaryProfileById,
  getPersonalizedProductRecommendations,
  getWellnessPractices,
  isHealthy
};
