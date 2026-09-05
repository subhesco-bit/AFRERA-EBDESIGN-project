/**
 * Equipment Inventory Service (M042)
 * Farm equipment inventory management with AI-powered maintenance prediction
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

async function createEquipment(equipmentData) {
  try {
    const {
      equipment_name,
      equipment_code,
      category,
      subcategory,
      manufacturer,
      model,
      serial_number,
      purchase_date,
      purchase_cost,
      expected_lifespan_years,
      condition,
      location,
      owner_id,
      owner_type,
      specifications,
      fuel_type,
      power_rating,
      maintenance_interval_days
    } = equipmentData;

    const current_age_years = purchase_date 
      ? Math.floor((new Date() - new Date(purchase_date)) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;

    const equipment = {
      equipment_id: generateId(),
      equipment_name,
      equipment_code,
      category,
      subcategory,
      manufacturer,
      model,
      serial_number,
      purchase_date,
      purchase_cost,
      current_value: purchase_cost,
      expected_lifespan_years,
      current_age_years,
      condition: condition || 'good',
      location,
      owner_id,
      owner_type,
      specifications: specifications || {},
      operating_hours: 0,
      fuel_type,
      power_rating,
      maintenance_interval_days,
      last_maintenance_date: null,
      next_maintenance_date: calculateNextMaintenanceDate(purchase_date, maintenance_interval_days),
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered health assessment
    const aiRequest = {
      task: 'equipment_health_assessment',
      parameters: {
        equipment_data: equipmentData,
        manufacturer_reliability: await getManufacturerReliability(manufacturer),
        category_benchmarks: await getCategoryBenchmarks(category),
        usage_patterns: await getUsagePatterns(category)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    equipment.ai_health_score = aiResponse.health_score;
    equipment.ai_maintenance_prediction = aiResponse;

    const result = await pool.query(
      `INSERT INTO equipment_inventory 
       (equipment_id, equipment_name, equipment_code, category, subcategory, manufacturer, 
        model, serial_number, purchase_date, purchase_cost, current_value, expected_lifespan_years, 
        current_age_years, condition, location, owner_id, owner_type, specifications, operating_hours, 
        fuel_type, power_rating, maintenance_interval_days, last_maintenance_date, next_maintenance_date, 
        ai_health_score, ai_maintenance_prediction, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
       RETURNING *`,
      [
        equipment.equipment_id, equipment.equipment_name, equipment.equipment_code,
        equipment.category, equipment.subcategory, equipment.manufacturer, equipment.model,
        equipment.serial_number, equipment.purchase_date, equipment.purchase_cost,
        equipment.current_value, equipment.expected_lifespan_years, equipment.current_age_years,
        equipment.condition, equipment.location, equipment.owner_id, equipment.owner_type,
        JSON.stringify(equipment.specifications), equipment.operating_hours, equipment.fuel_type,
        equipment.power_rating, equipment.maintenance_interval_days, equipment.last_maintenance_date,
        equipment.next_maintenance_date, equipment.ai_health_score,
        JSON.stringify(equipment.ai_maintenance_prediction), equipment.status, equipment.created_at
      ]
    );

    logger.info(`Equipment created: ${equipment.equipment_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating equipment', { error: error.message, stack: error.stack });
    throw new Error('Failed to create equipment');
  }
}

async function recordEquipmentUsage(equipmentId, usageData) {
  try {
    const { user_id, usage_date, start_time, end_time, task_performed, location, fuel_consumed, notes } = usageData;

    const hours_used = calculateHoursUsed(start_time, end_time);

    const usage = {
      usage_id: generateId(),
      equipment_id: equipmentId,
      user_id,
      usage_date: usage_date || new Date().toISOString().split('T')[0],
      start_time,
      end_time,
      hours_used,
      task_performed,
      location,
      fuel_consumed,
      notes,
      created_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO equipment_usage_log 
       (usage_id, equipment_id, user_id, usage_date, start_time, end_time, hours_used, 
        task_performed, location, fuel_consumed, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        usage.usage_id, usage.equipment_id, usage.user_id, usage.usage_date,
        usage.start_time, usage.end_time, usage.hours_used, usage.task_performed,
        usage.location, usage.fuel_consumed, usage.notes, usage.created_at
      ]
    );

    // Update equipment operating hours
    await pool.query(
      'UPDATE equipment_inventory SET operating_hours = operating_hours + $1 WHERE equipment_id = $2',
      [hours_used, equipmentId]
    );

    logger.info(`Equipment usage recorded: ${usage.usage_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording equipment usage', { error: error.message, stack: error.stack });
    throw new Error('Failed to record equipment usage');
  }
}

async function getEquipmentByOwner(ownerId) {
  try {
    let result = await pool.query(
      'SELECT * FROM equipment_inventory WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId]
    );

    return {
      owner_id: ownerId,
      total_equipment: result.rows.length,
      total_value: result.rows.reduce((sum, eq) => sum + parseFloat(eq.current_value || 0), 0),
      by_category: getCategorySummary(result.rows),
      equipment: result.rows
    };
  } catch (error) {
    logger.error('Error getting equipment by owner', { error: error.message });
    throw new Error('Failed to get equipment by owner');
  }
}

async function getMaintenancePredictions(category) {
  try {
    let result = await pool.query(
      'SELECT * FROM equipment_inventory WHERE category = $1 AND status = $2',
      [category, 'active']
    );

    const predictions = result.rows.map(equipment => ({
      equipment_id: equipment.equipment_id,
      equipment_name: equipment.equipment_name,
      health_score: equipment.ai_health_score,
      next_maintenance: equipment.next_maintenance_date,
      maintenance_prediction: equipment.ai_maintenance_prediction,
      urgency: determineMaintenanceUrgency(equipment)
    }));

    return {
      category,
      total_equipment: predictions.length,
      predictions
    };
  } catch (error) {
    logger.error('Error getting maintenance predictions', { error: error.message, stack: error.stack });
    throw new Error('Failed to get maintenance predictions');
  }
}

function generateId() {
  return `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateNextMaintenanceDate(purchaseDate, intervalDays) {
  if (!purchaseDate || !intervalDays) return null;
  const date = new Date(purchaseDate);
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split('T')[0];
}

function calculateHoursUsed(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end - start) / (1000 * 60 * 60);
}

async function getManufacturerReliability(manufacturer) {
  return {
    reliability_score: 0.85,
    common_issues: ['wear', 'tear'],
    average_lifespan: 10
  };
}

async function getCategoryBenchmarks(category) {
  return {
    average_operating_hours: 1000,
    maintenance_frequency: 'quarterly',
    failure_rate: 0.05
  };
}

async function getUsagePatterns(category) {
  return {
    peak_usage_season: 'harvest',
    average_daily_hours: 8,
    utilization_rate: 0.7
  };
}

function getCategorySummary(equipmentList) {
  const summary = {};
  equipmentList.forEach(eq => {
    summary[eq.category] = (summary[eq.category] || 0) + 1;
  });
  return summary;
}

function determineMaintenanceUrgency(equipment) {
  const daysUntilMaintenance = equipment.next_maintenance_date
    ? Math.floor((new Date(equipment.next_maintenance_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysUntilMaintenance < 0) return 'overdue';
  if (daysUntilMaintenance < 7) return 'urgent';
  if (daysUntilMaintenance < 30) return 'soon';
  return 'normal';
}

module.exports = {
  createEquipment,
  recordEquipmentUsage,
  getEquipmentByOwner,
  getMaintenancePredictions
};
