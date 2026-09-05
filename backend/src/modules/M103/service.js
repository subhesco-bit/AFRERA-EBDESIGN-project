/**
 * Equipment Inventory Service (M103)
 * Comprehensive equipment inventory management, tracking, and optimization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Register equipment
 */
async function registerEquipment(equipmentData) {
  try {
    const {
      farmer_id,
      equipment_id,
      equipment_category,
      equipment_name,
      brand,
      model,
      year,
      serial_number,
      specifications,
      purchase_date,
      purchase_cost,
      location,
      state,
      district,
      condition,
      status
    } = equipmentData;

    const equipment = {
      equipment_registry_id: generateId(),
      equipment_id,
      farmer_id,
      equipment_category,
      equipment_name,
      brand,
      model,
      year,
      serial_number,
      specifications,
      purchase_date,
      purchase_cost,
      location,
      state,
      district,
      condition: condition || 'good',
      status: status || 'available',
      created_at: new Date().toISOString()
    };

    // AI-powered equipment optimization
    const aiRequest = {
      task: 'equipment_optimization',
      parameters: {
        equipment_data: equipmentData,
        category_requirements: await getCategoryRequirements(equipment_category),
        regional_demand: await getRegionalDemand(state, district, equipment_category),
        depreciation_analysis: await analyzeDepreciation(year, purchase_cost),
        utilization_potential: await assessUtilizationPotential(equipment_category, state)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    equipment.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO equipment_inventory 
       (equipment_registry_id, equipment_id, farmer_id, equipment_category, equipment_name, 
        brand, model, year, serial_number, specifications, purchase_date, purchase_cost, 
        location, state, district, condition, status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        equipment.equipment_registry_id,
        equipment.equipment_id,
        equipment.farmer_id,
        equipment.equipment_category,
        equipment.equipment_name,
        equipment.brand,
        equipment.model,
        equipment.year,
        equipment.serial_number,
        JSON.stringify(equipment.specifications),
        equipment.purchase_date,
        equipment.purchase_cost,
        equipment.location,
        equipment.state,
        equipment.district,
        equipment.condition,
        equipment.status,
        JSON.stringify(equipment.ai_recommendations),
        equipment.created_at
      ]
    );

    logger.info(`Equipment registered: ${equipment.equipment_registry_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering equipment', { error: error.message, stack: error.stack });
    throw new Error('Failed to register equipment');
  }
}

/**
 * Update equipment status
 */
async function updateEquipmentStatus(registryId, statusData) {
  try {
    const { status, condition, location, notes } = statusData;

    const update = {
      registry_id: registryId,
      status,
      condition,
      location,
      notes,
      updated_at: new Date().toISOString()
    };

    // AI-powered status analysis
    let aiRequest = {
      task: 'equipment_status_analysis',
      parameters: {
        registry_id: registryId,
        status_data: statusData,
        status_history: await getStatusHistory(registryId),
        utilization_patterns: await getUtilizationPatterns(registryId),
        maintenance_requirements: await getMaintenanceRequirements(registryId)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);
    update.ai_analysis = aiResponse;

    let result = await pool.query(
      `UPDATE equipment_inventory 
       SET status = $1, condition = $2, location = $3, updated_at = CURRENT_TIMESTAMP
       WHERE equipment_registry_id = $4
       RETURNING *`,
      [status, condition, location, registryId]
    );

    await pool.query(
      `INSERT INTO equipment_status_history 
       (history_id, registry_id, status, condition, location, notes, ai_analysis, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        generateId(),
        registryId,
        status,
        condition,
        location,
        notes,
        JSON.stringify(update.ai_analysis),
        update.updated_at
      ]
    );

    logger.info(`Equipment status updated: ${registryId}`);
    return { ...result.rows[0], ai_analysis: update.ai_analysis };
  } catch (error) {
    logger.error('Error updating equipment status', { error: error.message, stack: error.stack });
    throw new Error('Failed to update equipment status');
  }
}

/**
 * Track equipment utilization
 */
async function trackEquipmentUtilization(registryId, period) {
  try {
    const utilization = {
      tracking_id: generateId(),
      registry_id: registryId,
      period,
      timestamp: new Date().toISOString(),
      usage_hours: await getUsageHours(registryId, period),
      utilization_rate: await calculateUtilizationRate(registryId, period),
      operational_efficiency: await getOperationalEfficiency(registryId, period),
    cost_per_hour: await calculateCostPerHour(registryId, period),
    recommendations: await generateUtilizationRecommendations(registryId, period)
    };

    return utilization;
  } catch (error) {
    logger.error('Error tracking equipment utilization', { error: error.message, stack: error.stack });
    throw new Error('Failed to track equipment utilization');
  }
}

/**
 * Generate equipment inventory report
 */
async function generateInventoryReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      total_equipment: await getEquipmentCount(farmerId),
      category_breakdown: await getCategoryBreakdown(farmerId),
      condition_summary: await getConditionSummary(farmerId),
      utilization_summary: await getUtilizationSummary(farmerId),
      depreciation_value: await calculateDepreciationValue(farmerId),
      recommendations: await generateInventoryRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating inventory report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate inventory report');
  }
}

function generateId() {
  return `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getCategoryRequirements(category) {
  const requirements = {
    irrigation: { power: 'electric', pressure: '2-5 bar', flow_rate: '10-50 L/min' },
    harvesting: { capacity: '500-2000 kg/hr', power: '50-100 HP' },
    processing: { capacity: '100-1000 kg/hr', automation: 'semi-auto' }
  };
  return requirements[category] || {};
}

async function getRegionalDemand(state, district, category) {
  return {
    demand_level: 'high',
    seasonal_demand: ['kharif', 'rabi'],
    rental_potential: 'good'
  };
}

async function analyzeDepreciation(year, purchaseCost) {
  const age = new Date().getFullYear() - year;
  const depreciationRate = 0.15;
  const currentValue = purchaseCost * Math.pow(1 - depreciationRate, age);
  return {
    age,
    depreciation_rate: depreciationRate,
    current_value: currentValue,
    accumulated_depreciation: purchaseCost - currentValue
  };
}

async function assessUtilizationPotential(category, state) {
  return {
    potential: 'high',
    rental_opportunities: 5,
    sharing_potential: 'good'
  };
}

async function getStatusHistory(registryId) {
  try {
    let result = await pool.query(
      'SELECT * FROM equipment_status_history WHERE registry_id = $1 ORDER BY updated_at DESC LIMIT 10',
      [registryId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getUtilizationPatterns(registryId) {
  return {
    average_daily_hours: 6,
    peak_season_hours: 10,
    off_season_hours: 2
  };
}

async function getMaintenanceRequirements(registryId) {
  return [
    { task: 'routine_inspection', frequency: 'weekly' },
    { task: 'lubrication', frequency: 'monthly' },
    { task: 'overhaul', frequency: 'annually' }
  ];
}

async function getUsageHours(registryId, period) {
  return {
    total_hours: 180,
    average_daily: 6,
    peak_hours: 10
  };
}

async function calculateUtilizationRate(registryId, period) {
  return {
    utilization_rate: 75,
    target_rate: 80,
    gap: 5
  };
}

async function getOperationalEfficiency(registryId, period) {
  return {
    efficiency_score: 85,
    downtime: 15,
    uptime: 85
  };
}

async function calculateCostPerHour(registryId, period) {
  return {
    cost_per_hour: 150,
    fuel_cost: 50,
    maintenance_cost: 30,
    depreciation_cost: 70
  };
}

async function generateUtilizationRecommendations(registryId, period) {
  return [
    'Increase utilization during off-season through rental',
    'Schedule maintenance during low-demand periods',
    'Consider equipment sharing with neighboring farmers'
  ];
}

async function getEquipmentCount(farmerId) {
  try {
    let result = await pool.query(
      'SELECT COUNT(*) as count FROM equipment_inventory WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getCategoryBreakdown(farmerId) {
  try {
    let result = await pool.query(
      'SELECT equipment_category, COUNT(*) as count FROM equipment_inventory WHERE farmer_id = $1 GROUP BY equipment_category',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getConditionSummary(farmerId) {
  return {
    excellent: 30,
    good: 50,
    fair: 15,
    poor: 5
  };
}

async function getUtilizationSummary(farmerId) {
  return {
    average_utilization: 70,
    highly_utilized: 40,
    underutilized: 30,
    idle: 30
  };
}

async function calculateDepreciationValue(farmerId) {
  return {
    total_purchase_value: 500000,
    total_current_value: 350000,
    total_depreciation: 150000
  };
}

async function generateInventoryRecommendations(farmerId) {
  return [
    'Consider selling underutilized equipment',
    'Explore equipment rental opportunities',
    'Implement preventive maintenance schedule'
  ];
}

/**
 * List equipment. No list route existed at all before this (2026-08-24).
 */
async function listEquipment({ page = 1, limit = 20, farmer_id = null, status = null } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];
  const params = [];
  if (farmer_id) { params.push(farmer_id); conditions.push(`farmer_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRes = await pool.query(`SELECT COUNT(*) FROM equipment_inventory ${where}`, params);
  const total = parseInt(totalRes.rows[0].count, 10);

  const listParams = [...params, limit, offset];
  const res = await pool.query(
    `SELECT * FROM equipment_inventory ${where} ORDER BY created_at DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getEquipment(id) {
  let res = await pool.query('SELECT * FROM equipment_inventory WHERE equipment_registry_id = $1', [id]);
  return res.rows[0] || null;
}

module.exports = {
  listEquipment,
  getEquipment,
  registerEquipment,
  updateEquipmentStatus,
  trackEquipmentUtilization,
  generateInventoryReport
};
