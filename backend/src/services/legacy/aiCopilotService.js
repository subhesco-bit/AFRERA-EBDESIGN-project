/**
 * AI Copilot Framework Service
 * CAP-224 to CAP-230: Finance Copilot, Logistics Copilot, Warehouse Copilot,
 * Insurance Copilot, Nutrition Copilot, Marketplace Copilot, Copilot Framework
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('..\/utils\/logger');
const { authMiddleware } = require('..\/middleware\/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('..\/database\/pool');

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
    let result = await pool.query(
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
    let result = await pool.query(
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
  const lowerMessage = (message || '').toLowerCase();
  const userId = session?.user_id;

  if (lowerMessage.includes('cash flow') && userId) {
    try {
      let result = await pool.query(
        `SELECT SUM(amount) AS total, AVG(amount) AS avg_amount, COUNT(*) AS txn_count
           FROM financial_transactions
          WHERE user_id = $1 AND transaction_date > NOW() - INTERVAL '90 days'`,
        [userId]
      );
      const row = result.rows[0];
      if (row && Number(row.txn_count) > 0) {
        return {
          content: `Based on your last 90 days of recorded transactions: total ₹${Number(row.total).toFixed(2)} across ${row.txn_count} transactions, averaging ₹${Number(row.avg_amount).toFixed(2)} per transaction. Ask me for a specific date range for a detailed breakdown.`,
          metadata: { capabilities: ['cash_flow_analysis'], source: 'financial_transactions', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Finance copilot cash-flow lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can help you with financial analysis, budget planning, and cash flow, based on your actual recorded transactions. Ask about "cash flow" for a real summary of your last 90 days, or use /finance/analytics for a fuller report. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['financial_analysis', 'cash_flow'], source: userId ? 'financial_transactions' : 'none', matched_on_real_data: false },
  };
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
  let lowerMessage = (message || '').toLowerCase();

  if (lowerMessage.includes('route') || lowerMessage.includes('shipment') || lowerMessage.includes('freight')) {
    try {
      let result = await pool.query(
        `SELECT origin_address, destination_address, weight_kg, estimated_cost, actual_cost, status
           FROM shipments
          ORDER BY created_at DESC
          LIMIT 5`
      );
      if (result.rows.length > 0) {
        const lines = result.rows.map((r) => `${r.origin_address} -> ${r.destination_address}: ${r.status}, est. ₹${r.estimated_cost ?? 'n/a'}${r.actual_cost ? ` (actual ₹${r.actual_cost})` : ''}`).join('\n');
        return {
          content: `Your 5 most recent shipments:\n${lines}`,
          metadata: { capabilities: ['tracking'], source: 'shipments', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Logistics copilot shipment lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can look up your real recent shipments — ask about "route" or "shipment" for a live status summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['tracking'], source: 'none', matched_on_real_data: false },
  };
}

/**
 * Logistics copilot specific endpoints.
 * FIXED 2026-08-15: previously queried a `logistics_routes` table that does
 * not exist anywhere in the schema — every call threw "relation does not
 * exist". Rewritten against the real `shipments` table.
 */
router.get('/logistics/routes', authMiddleware, async (req, res) => {
  try {
    const { origin, destination } = req.query;

    const routes = await pool.query(
      `SELECT id, shipment_number, origin_address, destination_address, weight_kg,
              estimated_cost, actual_cost, estimated_transit_days, status
         FROM shipments
        WHERE ($1::text IS NULL OR origin_address ILIKE $1)
          AND ($2::text IS NULL OR destination_address ILIKE $2)
        ORDER BY created_at DESC
        LIMIT 5`,
      [origin ? `%${origin}%` : null, destination ? `%${destination}%` : null]
    );

    res.json({ routes: routes.rows });
  } catch (error) {
    logger.error('Get logistics routes error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get logistics routes' });
  }
});

// ============================================================================
// WAREHOUSE COPILOT (CAP-226)
// ============================================================================

async function generateWarehouseCopilotResponse(message, context, session) {
  let lowerMessage = (message || '').toLowerCase();
  const warehouseId = context?.warehouse_id;

  if ((lowerMessage.includes('inventory') || lowerMessage.includes('stock')) && warehouseId) {
    try {
      let result = await pool.query(
        `SELECT p.name, wi.quantity, wi.zone, wi.expiry_date
           FROM warehouse_inventory wi
           JOIN products p ON p.id = wi.product_id
          WHERE wi.warehouse_id = $1
          ORDER BY wi.quantity ASC
          LIMIT 5`,
        [warehouseId]
      );
      if (result.rows.length > 0) {
        const lowest = result.rows.map((r) => `${r.name}: ${r.quantity} units (zone ${r.zone || 'unassigned'})`).join('\n');
        return {
          content: `Lowest-quantity items in this warehouse right now:\n${lowest}`,
          metadata: { capabilities: ['inventory_analysis'], source: 'warehouse_inventory', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Warehouse copilot inventory lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can help with real recorded inventory levels for a specific warehouse — ask about "inventory" or "stock" with a warehouse_id in context for a live low-stock summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['inventory_management'], source: warehouseId ? 'warehouse_inventory' : 'none', matched_on_real_data: false },
  };
}

/**
 * Warehouse copilot specific endpoints.
 * FIXED 2026-08-15: previously selected product_name/category/current_stock/
 * reorder_level/stock_status/turnover_rate — none of which exist on the real
 * warehouse_inventory table (013_logistics_enhancements.sql: quantity, zone,
 * location, expiry_date, batch_number, quality_grade). Every call to this
 * endpoint threw "column does not exist". Rewritten against the real schema,
 * joined to products for name/category.
 */
router.get('/warehouse/inventory', authMiddleware, async (req, res) => {
  try {
    const { warehouse_id, category_id } = req.query;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id is required' });

    const inventory = await pool.query(
      `SELECT wi.product_id, p.name AS product_name, p.category_id,
              wi.quantity, wi.zone, wi.location, wi.expiry_date, wi.batch_number,
              wi.quality_grade, wi.last_counted
         FROM warehouse_inventory wi
         JOIN products p ON p.id = wi.product_id
        WHERE wi.warehouse_id = $1
          AND ($2::integer IS NULL OR p.category_id = $2)
        ORDER BY wi.quantity ASC`,
      [warehouse_id, category_id || null]
    );

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
  let lowerMessage = (message || '').toLowerCase();
  let userId = session?.user_id;

  if (lowerMessage.includes('claim') || lowerMessage.includes('policy') || lowerMessage.includes('coverage')) {
    if (userId) {
      try {
        let result = await pool.query(
          `SELECT policy_number, coverage_amount, premium_amount, policy_end_date, status
             FROM policies
            WHERE user_id = $1
            ORDER BY policy_end_date ASC
            LIMIT 5`,
          [userId]
        );
        if (result.rows.length > 0) {
          let lines = result.rows.map((p) => `${p.policy_number}: ${p.status}, coverage ₹${p.coverage_amount}, expires ${new Date(p.policy_end_date).toLocaleDateString('en-IN')}`).join('\n');
          return {
            content: `Your recorded policies:\n${lines}`,
            metadata: { capabilities: ['policy_analysis'], source: 'policies', matched_on_real_data: true },
          };
        }
      } catch (error) {
        logger.warn('Insurance copilot policy lookup failed', { error: error.message });
      }
    }
  }

  return {
    content: `I can look up your real recorded policies — ask about "claim", "policy", or "coverage" for a live summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['policy_analysis'], source: userId ? 'policies' : 'none', matched_on_real_data: false },
  };
}

/**
 * Insurance copilot specific endpoints.
 * FIXED 2026-08-15: previously queried a nonexistent `insurance_policies`
 * table with columns (policy_id, policy_type, premium, risk_score) that
 * don't exist anywhere in the schema. Rewritten against the real `policies`
 * table (000_base_schema.sql).
 */
router.get('/insurance/policies', authMiddleware, async (req, res) => {
  try {
    const policies = await pool.query(
      `SELECT id, policy_number, coverage_amount, premium_amount,
              policy_start_date, policy_end_date, status, insurer_name
         FROM policies
        WHERE user_id = $1
        ORDER BY policy_end_date ASC`,
      [req.user.id]
    );

    res.json(policies.rows);
  } catch (error) {
    logger.error('Get insurance policies error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get insurance policies' });
  }
});

// ============================================================================
// NUTRITION COPILOT (CAP-228)
// ============================================================================

/**
 * Live interactive AI dietitian / natural-therapist copilot.
 *
 * Replaced a fabricated version of this function (static canned text,
 * hardcoded `confidence: 0.91/0.95` regardless of input) with one grounded
 * in real data: wellness_natural_practices (evidence-labeled traditional/
 * natural remedies, e.g. the NE forest-honey entry — see
 * 9999_zz_product_media_ai_schema.sql) and food_composition/nutrition data
 * already real in nutritionIntelligenceService.js. No LLM is configured in
 * this environment, so this is keyword-matched against real rows, not
 * generative — and it says so, rather than pretending otherwise.
 */
async function generateNutritionCopilotResponse(message, context, session) {
  const nutritionIntelligenceService = require('./nutritionIntelligenceService');
  let lowerMessage = (message || '').toLowerCase();
  const words = lowerMessage.split(/[^a-z0-9]+/).filter((w) => w.length > 3);

  // 1. Natural-therapy / traditional-remedy match (real DB, real evidence labels)
  for (const word of words) {
    try {
      const { practices, disclaimer } = await nutritionIntelligenceService.getWellnessPractices({ tag: word });
      if (practices.length > 0) {
        const p = practices[0];
        return {
          content: `${p.common_name || p.practice_name}: ${p.traditional_use}\n\nEvidence level: ${p.evidence_level.replace(/_/g, ' ')}.${p.requires_consultation ? ' Please consult a qualified practitioner before use.' : ''}${p.contraindications ? `\n\nContraindications: ${p.contraindications}` : ''}\n\n${disclaimer}`,
          metadata: {
            source: 'wellness_natural_practices',
            practice_id: p.id,
            evidence_level: p.evidence_level,
            requires_consultation: p.requires_consultation,
            matched_on_real_data: true,
          },
        };
      }
    } catch (error) {
      logger.warn('Nutrition copilot wellness lookup failed', { word, error: error.message });
    }
  }

  // 2. Real food-nutrition search (calorie/diet/meal-type questions)
  if (lowerMessage.includes('meal') || lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('nutrition')) {
    try {
      const matches = await nutritionIntelligenceService.searchFoodProfiles(words[0] || '', null);
      if (matches && matches.length > 0) {
        const top = matches.slice(0, 3).map((f) => f.food_name || f.name).filter(Boolean).join(', ');
        return {
          content: `Based on recorded nutrition data, relevant foods include: ${top}. Ask about a specific food by name for its real nutrient breakdown, or ask me to compare two products.`,
          metadata: { source: 'food_composition', matched_on_real_data: true, matchCount: matches.length },
        };
      }
    } catch (error) {
      logger.warn('Nutrition copilot food search failed', { error: error.message });
    }
  }

  // 3. Real Wikipedia reference lookup — genuine external source with
  // citation, tried only after internal (higher-trust) sources found nothing.
  try {
    const wikipediaService = require('./wikipediaService');
    const wiki = await wikipediaService.lookup(message);
    if (wiki) {
      return {
        content: `${wiki.extract}\n\n(Source: Wikipedia — ${wiki.sourceUrl}. This is a general reference, not agronomic or medical advice specific to your situation.)`,
        metadata: { source: 'wikipedia', sourceUrl: wiki.sourceUrl, matched_on_real_data: true },
      };
    }
  } catch (error) {
    logger.warn('Nutrition copilot Wikipedia fallback failed', { error: error.message });
  }

  // Honest fallback — no fabricated confidence score, no canned advice.
  return {
    content: `I can look up real, evidence-labeled traditional/natural remedies (try naming an ingredient, e.g. "honey"), real nutrient data for a specific food, or a general Wikipedia reference. I don't have a general-purpose AI model configured in this environment, so I can only answer from what's actually recorded in the database or cited from a real external source.`,
    metadata: { source: 'none', matched_on_real_data: false },
  };
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
  let lowerMessage = (message || '').toLowerCase();
  const categoryId = context?.category_id;

  if ((lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('market')) && categoryId) {
    try {
      let result = await pool.query(
        `SELECT avg_price, min_price, max_price, listing_count, record_date
           FROM market_price_history
          WHERE category_id = $1
          ORDER BY record_date DESC
          LIMIT 1`,
        [categoryId]
      );
      if (result.rows.length > 0) {
        const r = result.rows[0];
        return {
          content: `Most recent recorded market pricing for this category (as of ${new Date(r.record_date).toLocaleDateString('en-IN')}): average ₹${r.avg_price}, range ₹${r.min_price}-₹${r.max_price}, across ${r.listing_count} listings.`,
          metadata: { capabilities: ['pricing_analysis'], source: 'market_price_history', matched_on_real_data: true },
        };
      }
    } catch (error) {
      logger.warn('Marketplace copilot pricing lookup failed', { error: error.message });
    }
  }

  return {
    content: `I can look up real recorded market pricing for a category — ask about "price" or "market" with a category_id in context for a live summary. I don't have a general-purpose AI model configured here, so I only answer from what's actually recorded.`,
    metadata: { capabilities: ['pricing_analysis'], source: categoryId ? 'market_price_history' : 'none', matched_on_real_data: false },
  };
}

/**
 * Marketplace copilot specific endpoints.
 * FIXED 2026-08-15: previously queried a nonexistent `marketplace_analytics`
 * table with columns (product_category, seller_id, trend_direction,
 * growth_rate) that don't exist anywhere in the schema. Rewritten against
 * the real `market_price_history` table (3100_ecommerce_tables.sql), which
 * is keyed by category_id/state_id, not free-text category/region.
 */
router.get('/marketplace/trends', authMiddleware, async (req, res) => {
  try {
    const { category_id, state_id, days } = req.query;
    if (!category_id) return res.status(400).json({ error: 'category_id is required' });

    const trends = await pool.query(
      `SELECT category_id, state_id, avg_price, min_price, max_price, listing_count, record_date
         FROM market_price_history
        WHERE category_id = $1
          AND ($2::integer IS NULL OR state_id = $2)
          AND record_date >= CURRENT_DATE - ($3 || ' days')::interval
        ORDER BY record_date DESC`,
      [category_id, state_id || null, days || '30']
    );

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
      available_copilots: ['finance', 'logistics', 'warehouse', 'insurance', 'nutrition', 'marketplace']
    }
  };
}

/**
 * Get copilot usage analytics
 */
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    let analytics = await pool.query(`
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
  isHealthy,
  // Exported (additive only, no logic changed) so services/whatsappService.js
  // can reuse the existing generic-copilot template response for default
  // farmer queries instead of duplicating it.
  generateCopilotResponse
};


