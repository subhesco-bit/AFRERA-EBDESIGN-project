/**
 * Spare Parts Management Service (M109)
 * Spare parts inventory, procurement, and consumption tracking
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Register spare part
 */
async function registerSparePart(partData) {
  try {
    const {
      farmer_id,
      part_name,
      part_number,
      category,
      brand,
      compatibility,
      quantity_in_stock,
      reorder_level,
      unit_cost,
      supplier,
      location,
      state,
      district
    } = partData;

    const part = {
      part_id: generateId(),
      farmer_id,
      part_name,
      part_number,
      category,
      brand,
      compatibility,
      quantity_in_stock,
      reorder_level,
      unit_cost,
      supplier,
      location,
      state,
      district,
      status: 'in_stock',
      created_at: new Date().toISOString()
    };

    // AI-powered inventory optimization
    const aiRequest = {
      task: 'inventory_optimization',
      parameters: {
        part_data: partData,
        demand_forecast: await getDemandForecast(part_number, category),
        lead_time_analysis: await analyzeLeadTime(supplier, category),
        consumption_patterns: await getConsumptionPatterns(part_number),
        optimal_stock_level: await calculateOptimalStock(part_number, category)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    part.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO spare_parts_inventory 
       (part_id, farmer_id, part_name, part_number, category, brand, compatibility, 
        quantity_in_stock, reorder_level, unit_cost, supplier, location, state, district, 
        status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        part.part_id,
        part.farmer_id,
        part.part_name,
        part.part_number,
        part.category,
        part.brand,
        JSON.stringify(part.compatibility),
        part.quantity_in_stock,
        part.reorder_level,
        part.unit_cost,
        part.supplier,
        part.location,
        part.state,
        part.district,
        part.status,
        JSON.stringify(part.ai_recommendations),
        part.created_at
      ]
    );

    logger.info(`Spare part registered: ${part.part_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering spare part', { error: error.message, stack: error.stack });
    throw new Error('Failed to register spare part');
  }
}

/**
 * Record part consumption
 */
async function recordPartConsumption(consumptionData) {
  try {
    const {
      part_id,
      equipment_id,
      quantity,
      used_by,
      work_order_id,
      consumption_date,
      notes
    } = consumptionData;

    const consumption = {
      consumption_id: generateId(),
      part_id,
      equipment_id,
      quantity,
      used_by,
      work_order_id,
      consumption_date,
      notes,
      created_at: new Date().toISOString()
    };

    // AI-powered consumption analysis
    const aiRequest = {
      task: 'consumption_analysis',
      parameters: {
        consumption_data: consumptionData,
        consumption_history: await getConsumptionHistory(part_id),
        abnormal_consumption: await detectAbnormalConsumption(part_id, quantity),
        replacement_prediction: await predictReplacementNeed(part_id, equipment_id),
        cost_impact: await calculateCostImpact(part_id, quantity)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    consumption.ai_analysis = aiResponse;

    await pool.query(
      `UPDATE spare_parts_inventory 
       SET quantity_in_stock = quantity_in_stock - $1, updated_at = CURRENT_TIMESTAMP
       WHERE part_id = $2`,
      [quantity, part_id]
    );

    const result = await pool.query(
      `INSERT INTO spare_parts_consumption 
       (consumption_id, part_id, equipment_id, quantity, used_by, work_order_id, 
        consumption_date, notes, ai_analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        consumption.consumption_id,
        consumption.part_id,
        consumption.equipment_id,
        consumption.quantity,
        consumption.used_by,
        consumption.work_order_id,
        consumption.consumption_date,
        consumption.notes,
        JSON.stringify(consumption.ai_analysis),
        consumption.created_at
      ]
    );

    logger.info(`Part consumption recorded: ${consumption.consumption_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording part consumption', { error: error.message, stack: error.stack });
    throw new Error('Failed to record part consumption');
  }
}

/**
 * Track inventory status
 */
async function trackInventoryStatus(partId, period) {
  try {
    const status = {
      tracking_id: generateId(),
      part_id: partId,
      period,
      timestamp: new Date().toISOString(),
      current_stock: await getCurrentStock(partId),
      consumption_rate: await getConsumptionRate(partId, period),
      reorder_status: await getReorderStatus(partId),
      lead_time: await getLeadTime(partId),
      recommendations: await generateInventoryRecommendations(partId, period)
    };

    return status;
  } catch (error) {
    logger.error('Error tracking inventory status', { error: error.message, stack: error.stack });
    throw new Error('Failed to track inventory status');
  }
}

/**
 * Generate inventory report
 */
async function generateInventoryReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      total_parts: await getTotalParts(farmerId),
      total_value: await getTotalInventoryValue(farmerId),
      low_stock_items: await getLowStockItems(farmerId),
      consumption_summary: await getConsumptionSummary(farmerId),
      supplier_performance: await getSupplierPerformance(farmerId),
      recommendations: await generateInventoryRecommendationsReport(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating inventory report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate inventory report');
  }
}

function generateId() {
  return `SP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getDemandForecast(partNumber, category) {
  return {
    forecast: 'stable',
    expected_demand: 10,
    confidence: 0.85
  };
}

async function analyzeLeadTime(supplier, category) {
  return {
    average_lead_time: 7,
    lead_time_range: { min: 5, max: 10 }
  };
}

async function getConsumptionPatterns(partNumber) {
  return {
    average_monthly: 5,
    peak_season: 8,
    off_season: 2
  };
}

async function calculateOptimalStock(partNumber, category) {
  return {
    optimal_level: 20,
    safety_stock: 5,
    reorder_point: 10
  };
}

async function getConsumptionHistory(partId) {
  try {
    const result = await pool.query(
      'SELECT * FROM spare_parts_consumption WHERE part_id = $1 ORDER BY consumption_date DESC LIMIT 10',
      [partId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function detectAbnormalConsumption(partId, quantity) {
  return {
    abnormal: quantity > 5,
    severity: quantity > 5 ? 'high' : 'normal'
  };
}

async function predictReplacementNeed(partId, equipmentId) {
  return {
    next_replacement: '30 days',
    confidence: 0.8
  };
}

async function calculateCostImpact(partId, quantity) {
  try {
    const result = await pool.query(
      'SELECT unit_cost FROM spare_parts_inventory WHERE part_id = $1',
      [partId]
    );
    const unitCost = result.rows[0]?.unit_cost || 0;
    return {
      total_cost: unitCost * quantity,
      cost_per_unit: unitCost
    };
  } catch (error) {
    return { total_cost: 0, cost_per_unit: 0 };
  }
}

async function getCurrentStock(partId) {
  try {
    const result = await pool.query(
      'SELECT quantity_in_stock FROM spare_parts_inventory WHERE part_id = $1',
      [partId]
    );
    return result.rows[0]?.quantity_in_stock || 0;
  } catch (error) {
    return 0;
  }
}

async function getConsumptionRate(partId, period) {
  return {
    total_consumed: 15,
    average_daily: 0.5,
    trend: 'stable'
  };
}

async function getReorderStatus(partId) {
  const stock = await getCurrentStock(partId);
  try {
    const result = await pool.query(
      'SELECT reorder_level FROM spare_parts_inventory WHERE part_id = $1',
      [partId]
    );
    const reorderLevel = result.rows[0]?.reorder_level || 10;
    return {
      needs_reorder: stock <= reorderLevel,
      urgency: stock < reorderLevel / 2 ? 'high' : 'normal'
    };
  } catch (error) {
    return { needs_reorder: false, urgency: 'normal' };
  }
}

async function getLeadTime(partId) {
  return {
    average_days: 7,
    current_status: 'on_track'
  };
}

async function generateInventoryRecommendations(partId, period) {
  return [
    'Monitor stock levels regularly',
    'Consider bulk ordering for discounts',
    'Maintain safety stock for critical parts'
  ];
}

async function getTotalParts(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM spare_parts_inventory WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalInventoryValue(farmerId) {
  try {
    const result = await pool.query(
      'SELECT SUM(quantity_in_stock * unit_cost) as total FROM spare_parts_inventory WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.total || 0;
  } catch (error) {
    return 0;
  }
}

async function getLowStockItems(farmerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM spare_parts_inventory WHERE farmer_id = $1 AND quantity_in_stock <= reorder_level',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getConsumptionSummary(farmerId) {
  return {
    total_consumed: 100,
    total_cost: 50000,
    average_cost_per_part: 500
  };
}

async function getSupplierPerformance(farmerId) {
  return [
    { supplier: 'A', rating: 4.5, on_time_delivery: 95 },
    { supplier: 'B', rating: 4.0, on_time_delivery: 90 }
  ];
}

async function generateInventoryRecommendationsReport(farmerId) {
  return [
    'Implement just-in-time inventory',
    'Diversify supplier base',
    'Use AI for demand forecasting'
  ];
}

/**
 * List spare parts. No list route existed at all before this (2026-08-24).
 */
async function listSpareParts({ page = 1, limit = 20, farmer_id = null, status = null } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];
  const params = [];
  if (farmer_id) { params.push(farmer_id); conditions.push(`farmer_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRes = await pool.query(`SELECT COUNT(*) FROM spare_parts_inventory ${where}`, params);
  const total = parseInt(totalRes.rows[0].count, 10);

  const listParams = [...params, limit, offset];
  const res = await pool.query(
    `SELECT * FROM spare_parts_inventory ${where} ORDER BY created_at DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getSparePart(id) {
  const res = await pool.query('SELECT * FROM spare_parts_inventory WHERE part_id = $1', [id]);
  return res.rows[0] || null;
}

module.exports = {
  listSpareParts,
  getSparePart,
  registerSparePart,
  recordPartConsumption,
  trackInventoryStatus,
  generateInventoryReport
};
