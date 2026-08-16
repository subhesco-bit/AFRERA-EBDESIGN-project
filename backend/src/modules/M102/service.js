/**
 * Implement Management Service (M102)
 * Agricultural implement inventory, maintenance, and usage tracking
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Register agricultural implement
 */
async function registerImplement(implementData) {
  try {
    const {
      farmer_id,
      implement_id,
      implement_type,
      brand,
      model,
      year,
      serial_number,
      width,
      working_width,
      compatible_tractor_hp,
      purchase_date,
      location,
      state,
      district,
      condition,
      status
    } = implementData;

    const implement = {
      implement_registry_id: generateId(),
      implement_id,
      farmer_id,
      implement_type,
      brand,
      model,
      year,
      serial_number,
      width,
      working_width,
      compatible_tractor_hp,
      purchase_date,
      location,
      state,
      district,
      condition: condition || 'good',
      status: status || 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered implement optimization
    const aiRequest = {
      task: 'implement_optimization',
      parameters: {
        implement_data: implementData,
        type_specifics: await getImplementTypeSpecifics(implement_type),
        regional_suitability: await getRegionalSuitability(state, district, implement_type),
        maintenance_requirements: await getMaintenanceRequirements(implement_type, brand),
        usage_recommendations: await getUsageRecommendations(implement_type, working_width)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    implement.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO implement_registry 
       (implement_registry_id, implement_id, farmer_id, implement_type, brand, model, 
        year, serial_number, width, working_width, compatible_tractor_hp, purchase_date, 
        location, state, district, condition, status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        implement.implement_registry_id,
        implement.implement_id,
        implement.farmer_id,
        implement.implement_type,
        implement.brand,
        implement.model,
        implement.year,
        implement.serial_number,
        implement.width,
        implement.working_width,
        implement.compatible_tractor_hp,
        implement.purchase_date,
        implement.location,
        implement.state,
        implement.district,
        implement.condition,
        implement.status,
        JSON.stringify(implement.ai_recommendations),
        implement.created_at
      ]
    );

    logger.info(`Implement registered: ${implement.implement_registry_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering implement', { error: error.message, stack: error.stack });
    throw new Error('Failed to register implement');
  }
}

/**
 * Update implement maintenance
 */
async function updateImplementMaintenance(registryId, maintenanceData) {
  try {
    const {
      maintenance_type,
      service_date,
      parts_replaced,
      labor_cost,
      parts_cost,
      service_center,
      condition_after,
      next_service_date,
      notes
    } = maintenanceData;

    const maintenanceRecord = {
      record_id: generateId(),
      registry_id: registryId,
      maintenance_type,
      service_date,
      parts_replaced,
      labor_cost,
      parts_cost,
      service_center,
      condition_after,
      next_service_date,
      notes,
      recorded_at: new Date().toISOString()
    };

    // AI-powered maintenance analysis
    const aiRequest = {
      task: 'implement_maintenance_analysis',
      parameters: {
        registry_id: registryId,
        maintenance_data: maintenanceData,
        maintenance_history: await getImplementMaintenanceHistory(registryId),
        wear_patterns: await analyzeWearPatterns(registryId),
        implement_specs: await getImplementSpecs(registryId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    maintenanceRecord.ai_analysis = aiResponse;

    await pool.query(
      `UPDATE implement_registry 
       SET condition = $1, updated_at = CURRENT_TIMESTAMP
       WHERE implement_registry_id = $2`,
      [condition_after, registryId]
    );

    await pool.query(
      `INSERT INTO implement_maintenance_records 
       (record_id, registry_id, maintenance_type, service_date, parts_replaced, 
        labor_cost, parts_cost, service_center, condition_after, next_service_date, 
        notes, ai_analysis, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        maintenanceRecord.record_id,
        registryId,
        maintenance_type,
        service_date,
        JSON.stringify(parts_replaced),
        labor_cost,
        parts_cost,
        service_center,
        condition_after,
        next_service_date,
        notes,
        JSON.stringify(maintenanceRecord.ai_analysis),
        maintenanceRecord.recorded_at
      ]
    );

    logger.info(`Implement maintenance updated: ${registryId}`);
    return maintenanceRecord;
  } catch (error) {
    logger.error('Error updating implement maintenance', { error: error.message, stack: error.stack });
    throw new Error('Failed to update implement maintenance');
  }
}

/**
 * Track implement usage
 */
async function trackImplementUsage(registryId, period) {
  try {
    const usage = {
      tracking_id: generateId(),
      registry_id: registryId,
      period,
      timestamp: new Date().toISOString(),
      field_hours: await getFieldHours(registryId, period),
      area_covered: await getAreaCovered(registryId, period),
      efficiency_metrics: await getEfficiencyMetrics(registryId, period),
      wear_analysis: await analyzeWear(registryId, period),
      recommendations: await generateUsageRecommendations(registryId, period)
    };

    return usage;
  } catch (error) {
    logger.error('Error tracking implement usage', { error: error.message, stack: error.stack });
    throw new Error('Failed to track implement usage');
  }
}

/**
 * Generate implement report
 */
async function generateImplementReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type,
      generated_at: new Date().toISOString(),
      implement_count: await getImplementCount(farmerId),
      type_distribution: await getTypeDistribution(farmerId),
      condition_summary: await getConditionSummary(farmerId),
      utilization_metrics: await getUtilizationMetrics(farmerId),
      maintenance_costs: await getMaintenanceCosts(farmerId),
      recommendations: await generateFarmerRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating implement report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate implement report');
  }
}

function generateId() {
  return `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getImplementTypeSpecifics(implementType) {
  const specifics = {
    plow: { optimal_depth: '15-25cm', soil_type: 'all', speed: '3-5 km/h' },
    harrow: { optimal_depth: '5-15cm', soil_type: 'all', speed: '5-8 km/h' },
    cultivator: { optimal_depth: '5-15cm', soil_type: 'all', speed: '4-6 km/h' },
    seeder: { optimal_depth: '2-5cm', soil_type: 'prepared', speed: '4-6 km/h' }
  };
  return specifics[implementType] || {};
}

async function getRegionalSuitability(state, district, implementType) {
  return {
    soil_compatibility: 'high',
    crop_suitability: ['wheat', 'rice', 'maize'],
    seasonal_relevance: ['kharif', 'rabi']
  };
}

async function getMaintenanceRequirements(implementType, brand) {
  return [
    { part: 'blades', replacement_interval: '200_hours', condition: 'check' },
    { part: 'bearings', replacement_interval: '500_hours', condition: 'grease' },
    { part: 'hitch', replacement_interval: '1000_hours', condition: 'inspect' }
  ];
}

async function getUsageRecommendations(implementType, workingWidth) {
  return {
    optimal_tractor_hp: workingWidth * 15,
    recommended_speed: '5 km/h',
    field_conditions: 'dry soil'
  };
}

async function getImplementMaintenanceHistory(registryId) {
  try {
    const result = await pool.query(
      'SELECT * FROM implement_maintenance_records WHERE registry_id = $1 ORDER BY service_date DESC LIMIT 10',
      [registryId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function analyzeWearPatterns(registryId) {
  return {
    blade_wear: 'moderate',
    bearing_wear: 'low',
    structural_wear: 'minimal'
  };
}

async function getImplementSpecs(registryId) {
  try {
    const result = await pool.query(
      'SELECT * FROM implement_registry WHERE implement_registry_id = $1',
      [registryId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getFieldHours(registryId, period) {
  return {
    total_hours: 120,
    average_daily: 4,
    peak_hours: 8
  };
}

async function getAreaCovered(registryId, period) {
  return {
    total_hectares: 60,
    hectares_per_hour: 0.5,
    efficiency_rating: 'good'
  };
}

async function getEfficiencyMetrics(registryId, period) {
  return {
    fuel_efficiency: 'optimal',
    time_efficiency: 85,
    quality_rating: 'excellent'
  };
}

async function analyzeWear(registryId, period) {
  return {
    overall_wear: 'moderate',
    critical_components: [],
    replacement_needed: false
  };
}

async function generateUsageRecommendations(registryId, period) {
  return [
    'Schedule blade sharpening',
    'Check bearing lubrication',
    'Inspect hitch points'
  ];
}

async function getImplementCount(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM implement_registry WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTypeDistribution(farmerId) {
  try {
    const result = await pool.query(
      'SELECT implement_type, COUNT(*) as count FROM implement_registry WHERE farmer_id = $1 GROUP BY implement_type',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getConditionSummary(farmerId) {
  return {
    excellent: 40,
    good: 45,
    fair: 10,
    poor: 5
  };
}

async function getUtilizationMetrics(farmerId) {
  return {
    average_utilization: 75,
    peak_utilization: 90,
    idle_time: 25
  };
}

async function getMaintenanceCosts(farmerId) {
  return {
    total_cost: 25000,
    parts_cost: 15000,
    labor_cost: 10000,
    cost_per_hectare: 416
  };
}

async function generateFarmerRecommendations(farmerId) {
  return [
    'Implement preventive maintenance schedule',
    'Monitor wear patterns regularly',
    'Optimize implement selection for field conditions'
  ];
}

module.exports = {
  registerImplement,
  updateImplementMaintenance,
  trackImplementUsage,
  generateImplementReport
};
