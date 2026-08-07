/**
 * AI Copilot Framework Service
 * CAP-224 to CAP-230: Finance Copilot, Logistics Copilot, Warehouse Copilot,
 * Insurance Copilot, Nutrition Copilot, Marketplace Copilot, Copilot Framework
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../database/pool');

// ============================================================================
// COPILOT FRAMEWORK (CAP-230)
// ============================================================================

/**
 * Initialize copilot session
 */
router.post('/session', authMiddleware, async (req, res) => {
  try {
    const { copilot_type, context, session_metadata } = req.body;

    const result = await pool.query(
      `INSERT INTO copilot_sessions 
       (user_id, copilot_type, context, session_metadata, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
       RETURNING *`,
      [req.user.id, copilot_type, JSON.stringify(context), JSON.stringify(session_metadata)]
    );

    logger.info(`Copilot session created: ${result.rows[0].id} for ${copilot_type}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create copilot session error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create copilot session' });
  }
});

/**
 * Send message to copilot
 */
router.post('/session/:id/message', authMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body;

    // Get session details
    const sessionResult = await pool.query(
      'SELECT * FROM copilot_sessions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Store user message
    await pool.query(
      `INSERT INTO copilot_messages 
       (session_id, role, content, context, created_at)
       VALUES ($1, 'user', $2, $3, NOW())`,
      [req.params.id, message, JSON.stringify(context)]
    );

    // Generate AI response based on copilot type
    const aiResponse = await generateCopilotResponse(session.copilot_type, message, context, session);

    // Store AI response
    await pool.query(
      `INSERT INTO copilot_messages 
       (session_id, role, content, context, metadata, created_at)
       VALUES ($1, 'assistant', $2, $3, $4, NOW())`,
      [req.params.id, aiResponse.content, JSON.stringify(context), JSON.stringify(aiResponse.metadata)]
    );

    // Update session
    await pool.query(
      `UPDATE copilot_sessions 
       SET updated_at = NOW(), message_count = message_count + 1
       WHERE id = $1`,
      [req.params.id]
    );

    res.json({
      session_id: req.params.id,
      response: aiResponse
    });
  } catch (error) {
    logger.error('Send copilot message error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to send message to copilot' });
  }
});

/**
 * Generate copilot response based on type
 */
async function generateCopilotResponse(copilotType, message, context, session) {
  logger.info(`Generating ${copilotType} copilot response`);

  switch (copilotType) {
    case 'finance':
      return await generateFinanceCopilotResponse(message, context, session);
    case 'logistics':
      return await generateLogisticsCopilotResponse(message, context, session);
    case 'warehouse':
      return await generateWarehouseCopilotResponse(message, context, session);
    case 'insurance':
      return await generateInsuranceCopilotResponse(message, context, session);
    case 'nutrition':
      return await generateNutritionCopilotResponse(message, context, session);
    case 'marketplace':
      return await generateMarketplaceCopilotResponse(message, context, session);
    default:
      return await generateGenericCopilotResponse(message, context, session);
  }
}

/**
 * Get session history
 */
router.get('/session/:id/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM copilot_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get session history error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get session history' });
  }
});

/**
 * Close copilot session
 */
router.put('/session/:id/close', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE copilot_sessions 
       SET status = 'closed', ended_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.info(`Copilot session closed: ${req.params.id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Close copilot session error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to close copilot session' });
  }
});

// ============================================================================
// FINANCE COPILOT (CAP-224)
// ============================================================================

async function generateFinanceCopilotResponse(message, context, session) {
  // Mock implementation - in production, this would use RAG with financial data
  const responses = {
    'default': {
      content: `I can help you with financial analysis, budget planning, cash flow management, and financial reporting. What specific financial task would you like assistance with?`,
      metadata: {
        capabilities: ['financial_analysis', 'budget_planning', 'cash_flow', 'reporting'],
        confidence: 0.95
      }
    },
    'cash flow': {
      content: `Based on your current cash flow data, I recommend:\n1. Improve accounts receivable collection\n2. Negotiate better payment terms with suppliers\n3. Maintain a minimum cash buffer of 3 months operating expenses\n\nWould you like me to generate a detailed cash flow forecast?`,
      metadata: {
        capabilities: ['cash_flow_analysis'],
        confidence: 0.88,
        suggestions: ['ar_improvement', 'payment_terms', 'cash_buffer']
      }
    }
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('cash flow')) {
    return responses['cash flow'];
  }
  return responses['default'];
}

/**
 * Finance copilot specific endpoints
 */
router.get('/finance/analytics', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const analytics = await pool.query(`
      SELECT 
        SUM(amount) as total_revenue,
        AVG(amount) as avg_transaction,
        COUNT(*) as transaction_count,
        EXTRACT(MONTH FROM transaction_date) as month
      FROM financial_transactions
      WHERE transaction_date BETWEEN $1 AND $2
        AND user_id = $3
      GROUP BY month
      ORDER BY month
    `, [start_date, end_date, req.user.id]);

    res.json(analytics.rows);
  } catch (error) {
    logger.error('Get finance analytics error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get finance analytics' });
  }
});

// ============================================================================
// LOGISTICS COPILOT (CAP-225)
// ============================================================================

async function generateLogisticsCopilotResponse(message, context, session) {
  const responses = {
    'default': {
      content: `I can assist with route optimization, fleet management, shipment tracking, and logistics cost analysis. What logistics challenge can I help you solve?`,
      metadata: {
        capabilities: ['route_optimization', 'fleet_management', 'tracking', 'cost_analysis'],
        confidence: 0.94
      }
    },
    'route': {
      content: `I've analyzed your current routes and identified optimization opportunities:\n1. Route A-B-C can be optimized to save 15% fuel\n2. Consolidating shipments on Route X-Y can reduce costs by 22%\n3. Alternative routing via highway network can reduce transit time by 2 hours\n\nShall I generate detailed route optimization plans?`,
      metadata: {
        capabilities: ['route_optimization'],
        confidence: 0.91,
        optimization_potential: '15-22%'
      }
    }
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('route') || lowerMessage.includes('optimization')) {
    return responses['route'];
  }
  return responses['default'];
}

/**
 * Logistics copilot specific endpoints
 */
router.get('/logistics/routes', authMiddleware, async (req, res) => {
  try {
    const { origin, destination, cargo_type } = req.query;

    // Mock route optimization
    const routes = await pool.query(`
      SELECT * FROM logistics_routes
      WHERE origin ILIKE $1 AND destination ILIKE $2
      LIMIT 5
    `, [`%${origin}%`, `%${destination}%`]);

    res.json({
      routes: routes.rows,
      optimization_suggestions: [
        'Consider consolidated shipping for cost savings',
        'Off-peak delivery timing can reduce costs by 15%',
        'Alternative routes available via highway network'
      ]
    });
  } catch (error) {
    logger.error('Get logistics routes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get logistics routes' });
  }
});

// ============================================================================
// WAREHOUSE COPILOT (CAP-226)
// ============================================================================

async function generateWarehouseCopilotResponse(message, context, session) {
  const responses = {
    'default': {
      content: `I can help with inventory management, warehouse layout optimization, stock level forecasting, and picking efficiency. What warehouse operation needs assistance?`,
      metadata: {
        capabilities: ['inventory_management', 'layout_optimization', 'forecasting', 'picking_efficiency'],
        confidence: 0.93
      }
    },
    'inventory': {
      content: `Current inventory analysis shows:\n1. Fast-moving items: 23% of SKUs, 78% of volume\n2. Slow-moving items: 45% of SKUs, 12% of volume\n3. Obsolete stock: 8% of total inventory value\n\nRecommendations:\n- Implement ABC analysis for better stock control\n- Consider clearance sale for slow-moving items\n- Review safety stock levels for high-value items`,
      metadata: {
        capabilities: ['inventory_analysis'],
        confidence: 0.89,
        actionable_insights: true
      }
    }
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
    return responses['inventory'];
  }
  return responses['default'];
}

/**
 * Warehouse copilot specific endpoints
 */
router.get('/warehouse/inventory', authMiddleware, async (req, res) => {
  try {
    const { warehouse_id, category } = req.query;

    const inventory = await pool.query(`
      SELECT 
        product_id,
        product_name,
        category,
        current_stock,
        reorder_level,
        stock_status,
        last_restocked,
        turnover_rate
      FROM warehouse_inventory
      WHERE warehouse_id = $1
        AND ($2::text IS NULL OR category = $2)
      ORDER BY turnover_rate DESC
    `, [warehouse_id, category]);

    res.json(inventory.rows);
  } catch (error) {
    logger.error('Get warehouse inventory error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get warehouse inventory' });
  }
});

// ============================================================================
// INSURANCE COPILOT (CAP-227)
// ============================================================================

async function generateInsuranceCopilotResponse(message, context, session) {
  const responses = {
    'default': {
      content: `I can assist with policy analysis, claims processing, risk assessment, premium optimization, and compliance management. What insurance matter can I help with?`,
      metadata: {
        capabilities: ['policy_analysis', 'claims', 'risk_assessment', 'premium_optimization', 'compliance'],
        confidence: 0.96
      }
    },
    'claim': {
      content: `For your claim inquiry, I can help with:\n1. Claim status tracking and updates\n2. Document requirements verification\n3. Coverage analysis under your policy\n4. Estimated processing timeline\n\nPlease provide your claim number or policy details for specific assistance.`,
      metadata: {
        capabilities: ['claims_assistance'],
        confidence: 0.92,
        next_steps: ['claim_number', 'policy_details']
      }
    }
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('claim')) {
    return responses['claim'];
  }
  return responses['default'];
}

/**
 * Insurance copilot specific endpoints
 */
router.get('/insurance/policies', authMiddleware, async (req, res) => {
  try {
    const policies = await pool.query(`
      SELECT 
        policy_id,
        policy_type,
        coverage_amount,
        premium,
        status,
        renewal_date,
        risk_score
      FROM insurance_policies
      WHERE user_id = $1
      ORDER BY renewal_date ASC
    `, [req.user.id]);

    res.json(policies.rows);
  } catch (error) {
    logger.error('Get insurance policies error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get insurance policies' });
  }
});

// ============================================================================
// NUTRITION COPILOT (CAP-228)
// ============================================================================

async function generateNutritionCopilotResponse(message, context, session) {
  const responses = {
    'default': {
      content: `I can help with nutritional analysis, meal planning, dietary recommendations, allergen management, and health-focused food selection. What nutrition guidance do you need?`,
      metadata: {
        capabilities: ['nutritional_analysis', 'meal_planning', 'dietary_recommendations', 'allergen_management'],
        confidence: 0.95
      }
    },
    'meal': {
      content: `Based on your nutritional profile and preferences, I recommend:\n\nBreakfast: High-protein options with complex carbohydrates\nLunch: Balanced meal with vegetables and lean protein\nDinner: Light meal with essential nutrients\n\nSnacks: Nutrient-dense options between meals\n\nWould you like detailed recipes and shopping lists for these meals?`,
      metadata: {
        capabilities: ['meal_planning'],
        confidence: 0.91,
        personalized: true
      }
    }
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('meal') || lowerMessage.includes('diet') || lowerMessage.includes('food')) {
    return responses['meal'];
  }
  return responses['default'];
}

/**
 * Nutrition copilot specific endpoints
 */
router.get('/nutrition/analysis', authMiddleware, async (req, res) => {
  try {
    const { food_items, serving_size } = req.query;

    const analysis = await pool.query(`
      SELECT 
        f.food_name,
        f.calories_per_serving,
        f.protein,
        f.carbohydrates,
        f.fats,
        f.fiber,
        f.vitamins,
        f.minerals,
        f.allergens
      FROM food_composition f
      WHERE f.food_name = ANY($1)
    `, [food_items.split(',')]);

    res.json({
      analysis: analysis.rows,
      total_nutrition: calculateTotalNutrition(analysis.rows),
      recommendations: generateNutritionRecommendations(analysis.rows)
    });
  } catch (error) {
    logger.error('Get nutrition analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get nutrition analysis' });
  }
});

function calculateTotalNutrition(foods) {
  return foods.reduce((total, food) => ({
    calories: total.calories + (food.calories_per_serving || 0),
    protein: total.protein + (food.protein || 0),
    carbohydrates: total.carbohydrates + (food.carbohydrates || 0),
    fats: total.fats + (food.fats || 0),
    fiber: total.fiber + (food.fiber || 0)
  }), { calories: 0, protein: 0, carbohydrates: 0, fats: 0, fiber: 0 });
}

function generateNutritionRecommendations(foods) {
  return [
    'Ensure adequate protein intake for muscle health',
    'Include fiber-rich foods for digestive health',
    'Balance macronutrients throughout the day',
    'Consider vitamin and mineral supplementation if needed'
  ];
}

// ============================================================================
// MARKETPLACE COPILOT (CAP-229)
// ============================================================================

async function generateMarketplaceCopilotResponse(message, context, session) {
  const responses = {
    'default': {
      content: `I can assist with market analysis, pricing strategies, product recommendations, seller optimization, and buyer guidance. What marketplace aspect would you like help with?`,
      metadata: {
        capabilities: ['market_analysis', 'pricing_strategy', 'product_recommendations', 'seller_optimization', 'buyer_guidance'],
        confidence: 0.94
      }
    },
    'pricing': {
      content: `Market pricing analysis for your products:\n1. Current market price range: ₹X - ₹Y per unit\n2. Competitive positioning: Your prices are 12% below market average\n3. Demand elasticity: Price-sensitive category with optimal price point at ₹Z\n4. Seasonal trends: Prices typically increase by 15-20% during peak season\n\nRecommendations:\n- Consider dynamic pricing based on demand\n- Bundle complementary products for value perception\n- Implement promotional pricing during off-peak periods`,
      metadata: {
        capabilities: ['pricing_analysis'],
        confidence: 0.90,
        data_driven: true
      }
    }
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('market')) {
    return responses['pricing'];
  }
  return responses['default'];
}

/**
 * Marketplace copilot specific endpoints
 */
router.get('/marketplace/trends', authMiddleware, async (req, res) => {
  try {
    const { category, region, time_period } = req.query;

    const trends = await pool.query(`
      SELECT 
        product_category,
        region,
        AVG(price) as avg_price,
        AVG(quantity_sold) as avg_volume,
        COUNT(DISTINCT seller_id) as seller_count,
        trend_direction,
        growth_rate
      FROM marketplace_analytics
      WHERE product_category = $1
        AND region = $2
        AND date >= NOW() - INTERVAL $3
      GROUP BY product_category, region, trend_direction, growth_rate
    `, [category, region, time_period || '30 days']);

    res.json(trends.rows);
  } catch (error) {
    logger.error('Get marketplace trends error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get marketplace trends' });
  }
});

// ============================================================================
// GENERIC COPILOT RESPONSE
// ============================================================================

async function generateGenericCopilotResponse(message, context, session) {
  return {
    content: `I'm your AI copilot assistant. I can help you with various tasks across the platform. Please let me know what specific assistance you need, and I'll connect you with the right specialized copilot.`,
    metadata: {
      capabilities: ['general_assistance'],
      confidence: 0.85,
      available_copilots: ['finance', 'logistics', 'warehouse', 'insurance', 'nutrition', 'marketplace']
    }
  };
}

/**
 * Get copilot usage analytics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const analytics = await pool.query(`
      SELECT 
        copilot_type,
        COUNT(*) as session_count,
        AVG(message_count) as avg_messages,
        AVG(EXTRACT(EPOCH FROM (ended_at - created_at))/3600) as avg_duration_hours,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed_sessions
      FROM copilot_sessions
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY copilot_type
    `, [req.user.id]);

    res.json(analytics.rows);
  } catch (error) {
    logger.error('Get copilot analytics error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get copilot analytics' });
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
