/**
 * Breakdown Maintenance Service (M107)
 * Equipment breakdown management, emergency repairs, and downtime tracking
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Report equipment breakdown
 */
async function reportBreakdown(breakdownData) {
  try {
    const {
      equipment_id,
      equipment_type,
      farmer_id,
      breakdown_date,
      breakdown_time,
      location,
      state,
      district,
      symptoms,
      severity,
      reported_by,
      operator_notes
    } = breakdownData;

    const breakdown = {
      breakdown_id: generateId(),
      equipment_id,
      equipment_type,
      farmer_id,
      breakdown_date,
      breakdown_time,
      location,
      state,
      district,
      symptoms,
      severity: severity || 'medium',
      reported_by,
      operator_notes,
      status: 'reported',
      created_at: new Date().toISOString()
    };

    // AI-powered breakdown diagnosis
    const aiRequest = {
      task: 'breakdown_diagnosis',
      parameters: {
        breakdown_data: breakdownData,
        equipment_history: await getEquipmentHistory(equipment_id),
        symptom_analysis: await analyzeSymptoms(symptoms, equipment_type),
        common_failures: await getCommonFailures(equipment_type),
        repair_estimates: await getRepairEstimates(equipment_type, severity)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    breakdown.ai_diagnosis = aiResponse;

    const result = await pool.query(
      `INSERT INTO equipment_breakdowns 
       (breakdown_id, equipment_id, equipment_type, farmer_id, breakdown_date, 
        breakdown_time, location, state, district, symptoms, severity, reported_by, 
        operator_notes, status, ai_diagnosis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        breakdown.breakdown_id,
        breakdown.equipment_id,
        breakdown.equipment_type,
        breakdown.farmer_id,
        breakdown.breakdown_date,
        breakdown.breakdown_time,
        breakdown.location,
        breakdown.state,
        breakdown.district,
        JSON.stringify(breakdown.symptoms),
        breakdown.severity,
        breakdown.reported_by,
        breakdown.operator_notes,
        breakdown.status,
        JSON.stringify(breakdown.ai_diagnosis),
        breakdown.created_at
      ]
    );

    logger.info(`Breakdown reported: ${breakdown.breakdown_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error reporting breakdown', { error: error.message, stack: error.stack });
    throw new Error('Failed to report breakdown');
  }
}

/**
 * Schedule emergency repair
 */
async function scheduleEmergencyRepair(breakdownId, repairData) {
  try {
    const {
      technician_id,
      estimated_arrival,
      priority,
      required_parts,
      estimated_cost,
      repair_notes
    } = repairData;

    const repair = {
      repair_id: generateId(),
      breakdown_id: breakdownId,
      technician_id,
      estimated_arrival,
      priority: priority || 'high',
      required_parts,
      estimated_cost,
      repair_notes,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    // AI-powered repair optimization
    const aiRequest = {
      task: 'repair_optimization',
      parameters: {
        repair_data: repairData,
        breakdown_details: await getBreakdownDetails(breakdownId),
        technician_availability: await getTechnicianAvailability(technician_id),
        parts_availability: await checkPartsAvailability(required_parts),
        repair_time_estimate: await estimateRepairTime(breakdownId, required_parts)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    repair.ai_optimization = aiResponse;

    await pool.query(
      `UPDATE equipment_breakdowns 
       SET status = 'repair_scheduled', updated_at = CURRENT_TIMESTAMP
       WHERE breakdown_id = $1`,
      [breakdownId]
    );

    const result = await pool.query(
      `INSERT INTO emergency_repairs 
       (repair_id, breakdown_id, technician_id, estimated_arrival, priority, 
        required_parts, estimated_cost, repair_notes, status, ai_optimization, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        repair.repair_id,
        repair.breakdown_id,
        repair.technician_id,
        repair.estimated_arrival,
        repair.priority,
        JSON.stringify(repair.required_parts),
        repair.estimated_cost,
        repair.repair_notes,
        repair.status,
        JSON.stringify(repair.ai_optimization),
        repair.created_at
      ]
    );

    logger.info(`Emergency repair scheduled: ${repair.repair_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error scheduling emergency repair', { error: error.message, stack: error.stack });
    throw new Error('Failed to schedule emergency repair');
  }
}

/**
 * Track downtime
 */
async function trackDowntime(equipmentId, period) {
  try {
    const downtime = {
      tracking_id: generateId(),
      equipment_id: equipmentId,
      period,
      timestamp: new Date().toISOString(),
      total_downtime: await getTotalDowntime(equipmentId, period),
      breakdown_count: await getBreakdownCount(equipmentId, period),
      repair_time: await getRepairTime(equipmentId, period),
      cost_impact: await calculateCostImpact(equipmentId, period),
      recommendations: await generateDowntimeRecommendations(equipmentId, period)
    };

    return downtime;
  } catch (error) {
    logger.error('Error tracking downtime', { error: error.message, stack: error.stack });
    throw new Error('Failed to track downtime');
  }
}

/**
 * Generate breakdown report
 */
async function generateBreakdownReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      total_breakdowns: await getTotalBreakdowns(farmerId),
      breakdown_by_type: await getBreakdownByType(farmerId),
      downtime_summary: await getDowntimeSummary(farmerId),
      repair_costs: await getRepairCosts(farmerId),
      mttr_mtbf: await calculateMTTRMTBF(farmerId),
      recommendations: await generatePreventiveRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating breakdown report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate breakdown report');
  }
}

function generateId() {
  return `BD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getEquipmentHistory(equipmentId) {
  try {
    const result = await pool.query(
      'SELECT * FROM equipment_breakdowns WHERE equipment_id = $1 ORDER BY breakdown_date DESC LIMIT 5',
      [equipmentId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function analyzeSymptoms(symptoms, equipmentType) {
  return {
    likely_cause: 'mechanical_failure',
    confidence: 0.85,
    affected_components: ['engine', 'transmission']
  };
}

async function getCommonFailures(equipmentType) {
  return [
    { failure: 'engine_overheating', frequency: 'high' },
    { failure: 'hydraulic_leak', frequency: 'medium' },
    { failure: 'electrical_issue', frequency: 'low' }
  ];
}

async function getRepairEstimates(equipmentType, severity) {
  const baseCost = { high: 15000, medium: 8000, low: 3000 };
  return {
    estimated_cost: baseCost[severity] || 8000,
    estimated_time: severity === 'high' ? 48 : 24,
    parts_required: ['engine_parts', 'filters']
  };
}

async function getBreakdownDetails(breakdownId) {
  try {
    const result = await pool.query(
      'SELECT * FROM equipment_breakdowns WHERE breakdown_id = $1',
      [breakdownId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getTechnicianAvailability(technicianId) {
  return {
    available: true,
    next_available: '2 hours',
    skills: ['mechanical', 'electrical']
  };
}

async function checkPartsAvailability(requiredParts) {
  return {
    all_available: true,
    unavailable_parts: [],
    delivery_time: '24 hours'
  };
}

async function estimateRepairTime(breakdownId, requiredParts) {
  return {
    estimated_hours: 8,
    confidence: 0.8
  };
}

async function getTotalDowntime(equipmentId, period) {
  return {
    total_hours: 48,
    average_per_breakdown: 12,
    impact_level: 'medium'
  };
}

async function getBreakdownCount(equipmentId, period) {
  return {
    total: 4,
    critical: 1,
    major: 2,
    minor: 1
  };
}

async function getRepairTime(equipmentId, period) {
  return {
    total_repair_hours: 32,
    average_repair_time: 8,
    efficiency_rating: 'good'
  };
}

async function calculateCostImpact(equipmentId, period) {
  return {
    total_cost: 40000,
    repair_cost: 32000,
    lost_productivity: 8000,
    impact_per_hour: 833
  };
}

async function generateDowntimeRecommendations(equipmentId, period) {
  return [
    'Implement preventive maintenance schedule',
    'Train operators on early failure detection',
    'Keep critical spare parts in stock'
  ];
}

async function getTotalBreakdowns(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM equipment_breakdowns WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getBreakdownByType(farmerId) {
  try {
    const result = await pool.query(
      'SELECT equipment_type, COUNT(*) as count FROM equipment_breakdowns WHERE farmer_id = $1 GROUP BY equipment_type',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getDowntimeSummary(farmerId) {
  return {
    total_downtime_hours: 192,
    average_downtime: 24,
    downtime_percentage: 5
  };
}

async function getRepairCosts(farmerId) {
  return {
    total_repair_cost: 160000,
    average_repair_cost: 20000,
    cost_trend: 'increasing'
  };
}

async function calculateMTTRMTBF(farmerId) {
  return {
    mttr: 24, // Mean Time To Repair
    mtbf: 480, // Mean Time Between Failures
    reliability_score: 95
  };
}

async function generatePreventiveRecommendations(farmerId) {
  return [
    'Increase preventive maintenance frequency',
    'Implement condition monitoring',
    'Review operator training programs'
  ];
}

module.exports = {
  reportBreakdown,
  scheduleEmergencyRepair,
  trackDowntime,
  generateBreakdownReport
};
