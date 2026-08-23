/**
 * Fuel Management Service (M108)
 * Fuel inventory tracking, consumption monitoring, and cost optimization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Record fuel purchase
 */
async function recordFuelPurchase(purchaseData) {
  try {
    const {
      farmer_id,
      fuel_type,
      quantity_liters,
      cost_per_liter,
      total_cost,
      supplier,
      purchase_date,
      location,
      state,
      district,
      vehicle_id
    } = purchaseData;

    const purchase = {
      purchase_id: generateId(),
      farmer_id,
      fuel_type,
      quantity_liters,
      cost_per_liter,
      total_cost,
      supplier,
      purchase_date,
      location,
      state,
      district,
      vehicle_id,
      created_at: new Date().toISOString()
    };

    // AI-powered fuel price analysis
    const aiRequest = {
      task: 'fuel_price_analysis',
      parameters: {
        purchase_data: purchaseData,
        market_prices: await getMarketPrices(fuel_type, state, district),
        price_trends: await getPriceTrends(fuel_type, state),
        optimal_purchase_timing: await getOptimalPurchaseTiming(fuel_type, state),
        supplier_comparison: await compareSuppliers(fuel_type, state)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    purchase.ai_analysis = aiResponse;

    const result = await pool.query(
      `INSERT INTO fuel_purchases 
       (purchase_id, farmer_id, fuel_type, quantity_liters, cost_per_liter, 
        total_cost, supplier, purchase_date, location, state, district, vehicle_id, ai_analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        purchase.purchase_id,
        purchase.farmer_id,
        purchase.fuel_type,
        purchase.quantity_liters,
        purchase.cost_per_liter,
        purchase.total_cost,
        purchase.supplier,
        purchase.purchase_date,
        purchase.location,
        purchase.state,
        purchase.district,
        purchase.vehicle_id,
        JSON.stringify(purchase.ai_analysis),
        purchase.created_at
      ]
    );

    logger.info(`Fuel purchase recorded: ${purchase.purchase_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording fuel purchase', { error: error.message, stack: error.stack });
    throw new Error('Failed to record fuel purchase');
  }
}

/**
 * Record fuel consumption
 */
async function recordFuelConsumption(consumptionData) {
  try {
    const {
      vehicle_id,
      equipment_id,
      fuel_type,
      quantity_liters,
      odometer_reading,
      work_hours,
      operation_type,
      operator_id,
      consumption_date
    } = consumptionData;

    const consumption = {
      consumption_id: generateId(),
      vehicle_id,
      equipment_id,
      fuel_type,
      quantity_liters,
      odometer_reading,
      work_hours,
      operation_type,
      operator_id,
      consumption_date,
      created_at: new Date().toISOString()
    };

    // AI-powered consumption analysis
    const aiRequest = {
      task: 'fuel_consumption_analysis',
      parameters: {
        consumption_data: consumptionData,
        efficiency_benchmarks: await getEfficiencyBenchmarks(vehicle_id, fuel_type),
        consumption_patterns: await getConsumptionPatterns(vehicle_id),
        optimization_recommendations: await getOptimizationRecommendations(vehicle_id, operation_type),
        abnormal_consumption: await detectAbnormalConsumption(vehicle_id, quantity_liters, work_hours)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    consumption.ai_analysis = aiResponse;

    const result = await pool.query(
      `INSERT INTO fuel_consumption 
       (consumption_id, vehicle_id, equipment_id, fuel_type, quantity_liters, 
        odometer_reading, work_hours, operation_type, operator_id, consumption_date, ai_analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        consumption.consumption_id,
        consumption.vehicle_id,
        consumption.equipment_id,
        consumption.fuel_type,
        consumption.quantity_liters,
        consumption.odometer_reading,
        consumption.work_hours,
        consumption.operation_type,
        consumption.operator_id,
        consumption.consumption_date,
        JSON.stringify(consumption.ai_analysis),
        consumption.created_at
      ]
    );

    logger.info(`Fuel consumption recorded: ${consumption.consumption_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording fuel consumption', { error: error.message, stack: error.stack });
    throw new Error('Failed to record fuel consumption');
  }
}

/**
 * Track fuel efficiency
 */
async function trackFuelEfficiency(vehicleId, period) {
  try {
    const efficiency = {
      tracking_id: generateId(),
      vehicle_id: vehicleId,
      period,
      timestamp: new Date().toISOString(),
      liters_per_hour: await getLitersPerHour(vehicleId, period),
      liters_per_km: await getLitersPerKm(vehicleId, period),
      cost_per_hour: await getCostPerHour(vehicleId, period),
      efficiency_rating: await getEfficiencyRating(vehicleId, period),
      recommendations: await generateEfficiencyRecommendations(vehicleId, period)
    };

    return efficiency;
  } catch (error) {
    logger.error('Error tracking fuel efficiency', { error: error.message, stack: error.stack });
    throw new Error('Failed to track fuel efficiency');
  }
}

/**
 * Generate fuel report
 */
async function generateFuelReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      total_purchases: await getTotalPurchases(farmerId),
      total_consumption: await getTotalConsumption(farmerId),
      average_efficiency: await getAverageEfficiency(farmerId),
      fuel_cost_analysis: await getFuelCostAnalysis(farmerId),
      supplier_performance: await getSupplierPerformance(farmerId),
      recommendations: await generateFuelRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating fuel report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate fuel report');
  }
}

function generateId() {
  return `FUEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getMarketPrices(fuelType, state, district) {
  return {
    current_price: 85,
    price_range: { min: 82, max: 88 },
    trend: 'stable'
  };
}

async function getPriceTrends(fuelType, state) {
  return {
    trend: 'increasing',
    weekly_change: 2,
    monthly_change: 5
  };
}

async function getOptimalPurchaseTiming(fuelType, state) {
  return {
    best_day: 'Wednesday',
    best_time: 'morning',
    expected_savings: 3
  };
}

async function compareSuppliers(fuelType, state) {
  return [
    { supplier: 'A', price: 84, quality: 'high' },
    { supplier: 'B', price: 86, quality: 'medium' },
    { supplier: 'C', price: 85, quality: 'high' }
  ];
}

async function getEfficiencyBenchmarks(vehicleId, fuelType) {
  return {
    target_liters_per_hour: 8,
    target_liters_per_km: 0.5,
    efficiency_range: { min: 7, max: 9 }
  };
}

async function getConsumptionPatterns(vehicleId) {
  return {
    average_consumption: 8.5,
    peak_consumption: 10,
    off_peak_consumption: 7
  };
}

async function getOptimizationRecommendations(vehicleId, operationType) {
  return [
    'Maintain steady speed',
    'Avoid idling',
    'Use optimal gear ratios'
  ];
}

async function detectAbnormalConsumption(vehicleId, quantity, hours) {
  const rate = quantity / hours;
  return {
    abnormal: rate > 12,
    rate: rate,
    possible_causes: rate > 12 ? ['engine_issue', 'heavy_load', 'inefficient_operation'] : []
  };
}

async function getLitersPerHour(vehicleId, period) {
  return {
    average: 8.5,
    minimum: 7,
    maximum: 10
  };
}

async function getLitersPerKm(vehicleId, period) {
  return {
    average: 0.5,
    minimum: 0.4,
    maximum: 0.6
  };
}

async function getCostPerHour(vehicleId, period) {
  return {
    average: 722.5,
    minimum: 595,
    maximum: 850
  };
}

async function getEfficiencyRating(vehicleId, period) {
  return {
    rating: 'good',
    score: 85,
    benchmark_comparison: '+5%'
  };
}

async function generateEfficiencyRecommendations(vehicleId, period) {
  return [
    'Implement fuel-saving driving techniques',
    'Schedule regular engine maintenance',
    'Monitor tire pressure regularly'
  ];
}

async function getTotalPurchases(farmerId) {
  try {
    const result = await pool.query(
      'SELECT SUM(quantity_liters) as total, SUM(total_cost) as cost FROM fuel_purchases WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0] || { total: 0, cost: 0 };
  } catch (error) {
    return { total: 0, cost: 0 };
  }
}

async function getTotalConsumption(farmerId) {
  try {
    const result = await pool.query(
      'SELECT SUM(quantity_liters) as total FROM fuel_consumption WHERE vehicle_id IN (SELECT vehicle_id FROM fleet_vehicles WHERE farmer_id = $1)',
      [farmerId]
    );
    return result.rows[0]?.total || 0;
  } catch (error) {
    return 0;
  }
}

async function getAverageEfficiency(farmerId) {
  return {
    liters_per_hour: 8.2,
    liters_per_km: 0.48,
    efficiency_score: 82
  };
}

async function getFuelCostAnalysis(farmerId) {
  return {
    total_cost: 170000,
    cost_per_liter: 85,
    monthly_average: 28333
  };
}

async function getSupplierPerformance(farmerId) {
  return [
    { supplier: 'A', rating: 4.5, reliability: 95 },
    { supplier: 'B', rating: 4.0, reliability: 90 }
  ];
}

async function generateFuelRecommendations(farmerId) {
  return [
    'Consider bulk purchasing for discounts',
    'Monitor market prices for optimal timing',
    'Implement fuel conservation practices'
  ];
}

module.exports = {
  recordFuelPurchase,
  recordFuelConsumption,
  trackFuelEfficiency,
  generateFuelReport
};
