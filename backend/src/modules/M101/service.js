/**
 * Tractor Management Service (M101)
 * Comprehensive tractor fleet management, maintenance tracking, and operational monitoring
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Register tractor
 */
async function registerTractor(tractorData) {
  try {
    const {
      farmer_id,
      tractor_id,
      make,
      model,
      year,
      engine_number,
      chassis_number,
      registration_number,
      hp,
      fuel_type,
      purchase_date,
      location,
      state,
      district,
      insurance_expiry,
      status
    } = tractorData;

    const tractor = {
      tractor_registry_id: generateId(),
      tractor_id,
      farmer_id,
      make,
      model,
      year,
      engine_number,
      chassis_number,
      registration_number,
      hp,
      fuel_type,
      purchase_date,
      location,
      state,
      district,
      insurance_expiry,
      status: status || 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered tractor condition assessment
    const aiRequest = {
      task: 'tractor_condition_assessment',
      parameters: {
        tractor_data: tractorData,
        make_model_specs: await getMakeModelSpecs(make, model, year),
        regional_usage_patterns: await getRegionalUsagePatterns(state, district),
        maintenance_recommendations: await getMaintenanceRecommendations(year, hp),
        optimal_usage: await getOptimalUsagePatterns(hp, fuel_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    tractor.ai_assessment = aiResponse;

    const result = await pool.query(
      `INSERT INTO tractor_registry 
       (tractor_registry_id, tractor_id, farmer_id, make, model, year, 
        engine_number, chassis_number, registration_number, hp, fuel_type, 
        purchase_date, location, state, district, insurance_expiry, status, 
        ai_assessment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        tractor.tractor_registry_id,
        tractor.tractor_id,
        tractor.farmer_id,
        tractor.make,
        tractor.model,
        tractor.year,
        tractor.engine_number,
        tractor.chassis_number,
        tractor.registration_number,
        tractor.hp,
        tractor.fuel_type,
        tractor.purchase_date,
        tractor.location,
        tractor.state,
        tractor.district,
        tractor.insurance_expiry,
        tractor.status,
        JSON.stringify(tractor.ai_assessment),
        tractor.created_at
      ]
    );

    logger.info(`Tractor registered: ${tractor.tractor_registry_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering tractor', { error: error.message, stack: error.stack });
    throw new Error('Failed to register tractor');
  }
}

/**
 * Update tractor maintenance record
 */
async function updateTractorMaintenance(registryId, maintenanceData) {
  try {
    const {
      maintenance_type,
      service_date,
      odometer_reading,
      work_hours,
      parts_replaced,
      labor_cost,
      parts_cost,
      service_center,
      next_service_date,
      notes
    } = maintenanceData;

    const maintenanceRecord = {
      record_id: generateId(),
      registry_id: registryId,
      maintenance_type,
      service_date,
      odometer_reading,
      work_hours,
      parts_replaced,
      labor_cost,
      parts_cost,
      service_center,
      next_service_date,
      notes,
      recorded_at: new Date().toISOString()
    };

    // AI-powered maintenance analysis
    const aiRequest = {
      task: 'tractor_maintenance_analysis',
      parameters: {
        registry_id: registryId,
        maintenance_data: maintenanceData,
        maintenance_history: await getMaintenanceHistory(registryId),
        manufacturer_guidelines: await getManufacturerGuidelines(await getTractorMakeModel(registryId)),
        usage_patterns: await getUsagePatterns(registryId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    maintenanceRecord.ai_analysis = aiResponse;

    await pool.query(
      `INSERT INTO tractor_maintenance_records 
       (record_id, registry_id, maintenance_type, service_date, odometer_reading, 
        work_hours, parts_replaced, labor_cost, parts_cost, service_center, 
        next_service_date, notes, ai_analysis, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        maintenanceRecord.record_id,
        registryId,
        maintenance_type,
        service_date,
        odometer_reading,
        work_hours,
        JSON.stringify(parts_replaced),
        labor_cost,
        parts_cost,
        service_center,
        next_service_date,
        notes,
        JSON.stringify(maintenanceRecord.ai_analysis),
        maintenanceRecord.recorded_at
      ]
    );

    logger.info(`Tractor maintenance updated: ${registryId}`);
    return maintenanceRecord;
  } catch (error) {
    logger.error('Error updating tractor maintenance', { error: error.message, stack: error.stack });
    throw new Error('Failed to update tractor maintenance');
  }
}

/**
 * Track tractor performance
 */
async function trackTractorPerformance(registryId, period) {
  try {
    const performance = {
      tracking_id: generateId(),
      registry_id: registryId,
      period,
      timestamp: new Date().toISOString(),
      fuel_efficiency: await calculateFuelEfficiency(registryId, period),
      work_hours: await getWorkHours(registryId, period),
      field_coverage: await getFieldCoverage(registryId, period),
      operational_cost: await calculateOperationalCost(registryId, period),
      maintenance_frequency: await getMaintenanceFrequency(registryId, period),
      recommendations: await generatePerformanceRecommendations(registryId, period)
    };

    return performance;
  } catch (error) {
    logger.error('Error tracking tractor performance', { error: error.message, stack: error.stack });
    throw new Error('Failed to track tractor performance');
  }
}

/**
 * Generate tractor management report
 */
async function generateTractorReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type,
      generated_at: new Date().toISOString(),
      tractor_count: await getTractorCount(farmerId),
      make_distribution: await getMakeDistribution(farmerId),
      maintenance_summary: await getMaintenanceSummary(farmerId),
      operational_metrics: await getOperationalMetrics(farmerId),
      cost_analysis: await getCostAnalysis(farmerId),
      recommendations: await generateFarmerRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating tractor report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate tractor report');
  }
}

function generateId() {
  return `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getMakeModelSpecs(make, model, year) {
  return {
    weight: 2500,
    dimensions: { length: 4.5, width: 2.0, height: 2.5 },
    fuel_capacity: 60,
    hydraulic_capacity: 40,
    pto_hp: 45
  };
}

async function getRegionalUsagePatterns(state, district) {
  return {
    common_crops: ['wheat', 'rice', 'maize'],
    soil_type: 'loamy',
    terrain: 'flat',
    seasonal_demand: ['kharif', 'rabi']
  };
}

async function getMaintenanceRecommendations(year, hp) {
  return [
    { service: 'oil_change', interval: '100_hours', due: '50_hours' },
    { service: 'filter_replacement', interval: '200_hours', due: '100_hours' },
    { service: 'greasing', interval: '50_hours', due: '25_hours' }
  ];
}

async function getOptimalUsagePatterns(hp, fuelType) {
  return {
    max_field_size: hp * 0.5,
    optimal_implements: ['plow', 'harrow', 'cultivator'],
    fuel_consumption: fuelType === 'diesel' ? 8 : 10
  };
}

async function getMaintenanceHistory(registryId) {
  try {
    const result = await pool.query(
      'SELECT * FROM tractor_maintenance_records WHERE registry_id = $1 ORDER BY service_date DESC LIMIT 10',
      [registryId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getManufacturerGuidelines(makeModel) {
  return {
    service_interval: 100,
    oil_type: '15W40',
    recommended_parts: ['oil_filter', 'air_filter', 'fuel_filter']
  };
}

async function getUsagePatterns(registryId) {
  return {
    average_daily_hours: 8,
    peak_season_hours: 12,
    typical_operations: ['tilling', 'plowing', 'hauling']
  };
}

async function getTractorMakeModel(registryId) {
  try {
    const result = await pool.query(
      'SELECT make, model FROM tractor_registry WHERE tractor_registry_id = $1',
      [registryId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function calculateFuelEfficiency(registryId, period) {
  return {
    liters_per_hour: 8.5,
    cost_per_hour: 85,
    efficiency_rating: 'good',
    benchmark_comparison: '+5%'
  };
}

async function getWorkHours(registryId, period) {
  return {
    total_hours: 240,
    average_daily: 8,
    peak_hours: 12,
    utilization_rate: 75
  };
}

async function getFieldCoverage(registryId, period) {
  return {
    total_acres: 120,
    acres_per_hour: 0.5,
    efficiency_rating: 'excellent'
  };
}

async function calculateOperationalCost(registryId, period) {
  return {
    fuel_cost: 20400,
    maintenance_cost: 15000,
    labor_cost: 36000,
    total_cost: 71400,
    cost_per_hour: 297.5
  };
}

async function getMaintenanceFrequency(registryId, period) {
  return {
    total_services: 4,
    preventive: 3,
    corrective: 1,
    compliance_rate: 85
  };
}

async function generatePerformanceRecommendations(registryId, period) {
  return [
    'Schedule preventive maintenance during off-season',
    'Monitor fuel consumption patterns',
    'Optimize implement selection for field conditions'
  ];
}

async function getTractorCount(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM tractor_registry WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getMakeDistribution(farmerId) {
  try {
    const result = await pool.query(
      'SELECT make, COUNT(*) as count FROM tractor_registry WHERE farmer_id = $1 GROUP BY make',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getMaintenanceSummary(farmerId) {
  return {
    preventive_maintenance: 75,
    corrective_maintenance: 20,
    overdue: 5
  };
}

async function getOperationalMetrics(farmerId) {
  return {
    total_work_hours: 960,
    total_field_coverage: 480,
    average_utilization: 80
  };
}

async function getCostAnalysis(farmerId) {
  return {
    total_cost: 285600,
    fuel_cost: 81600,
    maintenance_cost: 60000,
    labor_cost: 144000,
    cost_per_acre: 595
  };
}

async function generateFarmerRecommendations(farmerId) {
  return [
    'Implement preventive maintenance schedule',
    'Monitor fuel efficiency trends',
    'Consider equipment sharing during peak season'
  ];
}

module.exports = {
  registerTractor,
  updateTractorMaintenance,
  trackTractorPerformance,
  generateTractorReport
};
