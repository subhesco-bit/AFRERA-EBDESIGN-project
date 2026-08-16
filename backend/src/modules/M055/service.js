/**
 * Pricing Management Service (M055)
 * Dynamic pricing with AI-powered optimization and demand forecasting
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Create pricing rule with AI-powered optimization
 */
async function createPricingRule(ruleData) {
  try {
    const {
      product_id,
      rule_name,
      rule_type,
      base_price,
      conditions,
      adjustments,
      metadata
    } = ruleData;

    const rule = {
      rule_id: generateId(),
      product_id,
      rule_name,
      rule_type,
      base_price,
      conditions,
      adjustments,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered pricing optimization
    const aiRequest = {
      task: 'pricing_optimization',
      parameters: {
        rule_data: ruleData,
        market_data: await getMarketData(product_id),
        demand_forecast: await getDemandForecast(product_id),
        competitor_pricing: await getCompetitorPricing(product_id),
        elasticity_analysis: await analyzePriceElasticity(product_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    rule.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO pricing_rules 
       (rule_id, product_id, rule_name, rule_type, base_price, 
        conditions, adjustments, status, ai_recommendations, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        rule.rule_id,
        rule.product_id,
        rule.rule_name,
        rule.rule_type,
        rule.base_price,
        JSON.stringify(rule.conditions),
        JSON.stringify(rule.adjustments),
        rule.status,
        JSON.stringify(rule.ai_recommendations),
        JSON.stringify(metadata || {}),
        rule.created_at
      ]
    );

    logger.info(`Pricing rule created: ${rule.rule_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating pricing rule', { error: error.message, stack: error.stack });
    throw new Error('Failed to create pricing rule');
  }
}

/**
 * Calculate dynamic price
 */
async function calculateDynamicPrice(productId, context = {}) {
  try {
    const basePrice = await getBasePrice(productId);
    const applicableRules = await getApplicableRules(productId, context);

    let finalPrice = basePrice;
    const appliedAdjustments = [];

    for (const rule of applicableRules) {
      const adjustment = applyRule(rule, basePrice, context);
      finalPrice += adjustment.amount;
      appliedAdjustments.push(adjustment);
    }

    // AI-powered price optimization
    const aiRequest = {
      task: 'dynamic_pricing',
      parameters: {
        product_id: productId,
        base_price: basePrice,
        context: context,
        demand: await getCurrentDemand(productId),
        inventory: await getInventoryLevel(productId),
        time_factors: await getTimeFactors()
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    return {
      product_id: productId,
      base_price: basePrice,
      final_price: finalPrice,
      applied_rules: applicableRules,
      adjustments: appliedAdjustments,
      ai_optimization: aiResponse,
      calculated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error calculating dynamic price', { error: error.message });
    throw new Error('Failed to calculate dynamic price');
  }
}

/**
 * List pricing rules
 */
async function listPricingRules({ page = 1, limit = 20, productId = null, status = null } = {}) {
  try {
    const offset = (page - 1) * limit;
    
    let countQuery = 'SELECT COUNT(*) FROM pricing_rules';
    let countParams = [];
    let conditions = [];
    
    if (productId) {
      conditions.push('product_id = $' + (conditions.length + 1));
      countParams.push(productId);
    }
    if (status) {
      conditions.push('status = $' + (conditions.length + 1));
      countParams.push(status);
    }
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalRes = await pool.query(countQuery, countParams);
    const total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = 'SELECT * FROM pricing_rules';
    let dataParams = [...countParams];
    
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const res = await pool.query(dataQuery, dataParams);
    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  } catch (error) {
    logger.error('Error listing pricing rules', { error: error.message });
    throw new Error('Failed to list pricing rules');
  }
}

/**
 * Update pricing rule
 */
async function updatePricingRule(ruleId, updates) {
  try {
    const { rule_name, rule_type, base_price, conditions, adjustments, status, metadata } = updates;

    const result = await pool.query(
      `UPDATE pricing_rules 
       SET rule_name = COALESCE($1, rule_name),
           rule_type = COALESCE($2, rule_type),
           base_price = COALESCE($3, base_price),
           conditions = COALESCE($4, conditions::jsonb),
           adjustments = COALESCE($5, adjustments::jsonb),
           status = COALESCE($6, status),
           metadata = COALESCE($7, metadata::jsonb),
           updated_at = NOW()
       WHERE rule_id = $8
       RETURNING *`,
      [
        rule_name, rule_type, base_price,
        conditions ? JSON.stringify(conditions) : null,
        adjustments ? JSON.stringify(adjustments) : null,
        status,
        metadata ? JSON.stringify(metadata) : null,
        ruleId
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error updating pricing rule', { error: error.message });
    throw new Error('Failed to update pricing rule');
  }
}

/**
 * Delete pricing rule
 */
async function deletePricingRule(ruleId) {
  try {
    const res = await pool.query('DELETE FROM pricing_rules WHERE rule_id = $1 RETURNING rule_id', [ruleId]);
    return !!res.rows[0];
  } catch (error) {
    logger.error('Error deleting pricing rule', { error: error.message });
    throw new Error('Failed to delete pricing rule');
  }
}

// Helper functions
function generateId() {
  return `PR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getMarketData(productId) {
  return {
    average_price: 100,
    price_range: { min: 80, max: 120 },
    demand_level: 'high'
  };
}

async function getDemandForecast(productId) {
  return {
    forecast: 'increasing',
    confidence: 0.8,
    time_horizon: '30_days'
  };
}

async function getCompetitorPricing(productId) {
  return [
    { competitor: 'A', price: 95 },
    { competitor: 'B', price: 105 },
    { competitor: 'C', price: 110 }
  ];
}

async function analyzePriceElasticity(productId) {
  return {
    elasticity: -1.5,
    sensitivity: 'high',
    optimal_price_point: 102
  };
}

async function getBasePrice(productId) {
  const res = await pool.query('SELECT price FROM products WHERE product_id = $1', [productId]);
  return res.rows[0]?.price || 0;
}

async function getApplicableRules(productId, context) {
  const res = await pool.query(
    'SELECT * FROM pricing_rules WHERE product_id = $1 AND status = $2',
    [productId, 'active']
  );
  return res.rows;
}

function applyRule(rule, basePrice, context) {
  return {
    rule_id: rule.rule_id,
    rule_name: rule.rule_name,
    amount: basePrice * 0.1,
    type: 'percentage'
  };
}

async function getCurrentDemand(productId) {
  return { level: 'high', trend: 'increasing' };
}

async function getInventoryLevel(productId) {
  const res = await pool.query('SELECT quantity FROM products WHERE product_id = $1', [productId]);
  return res.rows[0]?.quantity || 0;
}

async function getTimeFactors() {
  return {
    hour: new Date().getHours(),
    day_of_week: new Date().getDay(),
    season: 'monsoon'
  };
}

module.exports = {
  createPricingRule,
  calculateDynamicPrice,
  listPricingRules,
  updatePricingRule,
  deletePricingRule
};
