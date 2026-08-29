/**
 * Poultry Management Service (M123)
 * Comprehensive poultry farming, health monitoring, and production management
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Register poultry flock
 */
async function registerPoultryFlock(flockData) {
  try {
    const {
      farmer_id,
      flock_id,
      breed,
      bird_type,
      bird_count,
      age_weeks,
      housing_type,
      location,
      state,
      district,
      registration_date,
      purpose,
      feed_type
    } = flockData;

    const flock = {
      flock_registry_id: generateId(),
      flock_id,
      farmer_id,
      breed,
      bird_type,
      bird_count,
      age_weeks,
      housing_type,
      location,
      state,
      district,
      registration_date,
      purpose,
      feed_type,
      status: 'registered',
      created_at: new Date().toISOString()
    };

    // AI-powered poultry health assessment
    const aiRequest = {
      task: 'poultry_health_assessment',
      parameters: {
        flock_data: flockData,
        breed_characteristics: await getBreedCharacteristics(breed),
        regional_health_patterns: await getRegionalHealthPatterns(state, district),
        vaccination_schedule: await getVaccinationSchedule(breed, age_weeks),
        nutritional_requirements: await getNutritionalRequirements(breed, purpose)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    flock.ai_health_assessment = aiResponse;

    const result = await pool.query(
      `INSERT INTO poultry_registry 
       (flock_registry_id, flock_id, farmer_id, breed, bird_type, bird_count, 
        age_weeks, housing_type, location, state, district, registration_date, 
        purpose, feed_type, status, ai_assessment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        flock.flock_registry_id,
        flock.flock_id,
        flock.farmer_id,
        flock.breed,
        flock.bird_type,
        flock.bird_count,
        flock.age_weeks,
        flock.housing_type,
        flock.location,
        flock.state,
        flock.district,
        flock.registration_date,
        flock.purpose,
        flock.feed_type,
        flock.status,
        JSON.stringify(flock.ai_health_assessment),
        flock.created_at
      ]
    );

    logger.info(`Poultry flock registered: ${flock.flock_registry_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering poultry flock', { error: error.message, stack: error.stack });
    throw new Error('Failed to register poultry flock');
  }
}

/**
 * Update flock health record
 */
async function updateFlockHealth(registryId, healthData) {
  try {
    const {
      health_status,
      mortality_rate,
      feed_consumption,
      water_consumption,
      vaccination_records,
      treatment_history,
      egg_production,
      weight_gains
    } = healthData;

    const healthRecord = {
      record_id: generateId(),
      registry_id: registryId,
      health_status,
      mortality_rate,
      feed_consumption,
      water_consumption,
      vaccination_records,
      treatment_history,
      egg_production,
      weight_gains,
      recorded_at: new Date().toISOString()
    };

    const aiRequest = {
      task: 'poultry_health_analysis',
      parameters: {
        registry_id: registryId,
        health_data: healthData,
        historical_health: await getFlockHealthHistory(registryId),
        breed_standards: await getBreedHealthStandards(await getFlockBreed(registryId)),
        environmental_factors: await getEnvironmentalFactors(await getFlockLocation(registryId))
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    healthRecord.ai_analysis = aiResponse;

    await pool.query(
      `UPDATE poultry_registry 
       SET health_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE flock_registry_id = $2`,
      [health_status, registryId]
    );

    await pool.query(
      `INSERT INTO poultry_health_records 
       (record_id, registry_id, health_status, mortality_rate, feed_consumption, 
        water_consumption, vaccination_records, treatment_history, egg_production, 
        weight_gains, ai_analysis, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        healthRecord.record_id,
        registryId,
        health_status,
        mortality_rate,
        JSON.stringify(feed_consumption),
        JSON.stringify(water_consumption),
        JSON.stringify(vaccination_records),
        JSON.stringify(treatment_history),
        JSON.stringify(egg_production),
        JSON.stringify(weight_gains),
        JSON.stringify(healthRecord.ai_analysis),
        healthRecord.recorded_at
      ]
    );

    logger.info(`Poultry flock health updated: ${registryId}`);
    return healthRecord;
  } catch (error) {
    logger.error('Error updating flock health', { error: error.message, stack: error.stack });
    throw new Error('Failed to update flock health');
  }
}

/**
 * Track flock performance
 */
async function trackFlockPerformance(registryId, period) {
  try {
    const performance = {
      tracking_id: generateId(),
      registry_id: registryId,
      period,
      timestamp: new Date().toISOString(),
      egg_production_metrics: await getEggProductionMetrics(registryId, period),
      feed_efficiency: await calculateFeedEfficiency(registryId, period),
      health_metrics: await getHealthMetrics(registryId, period),
      mortality_analysis: await getMortalityAnalysis(registryId, period),
      weight_gains: await getWeightGains(registryId, period),
      recommendations: await generatePerformanceRecommendations(registryId, period)
    };

    return performance;
  } catch (error) {
    logger.error('Error tracking flock performance', { error: error.message, stack: error.stack });
    throw new Error('Failed to track flock performance');
  }
}

/**
 * Generate poultry management report
 */
async function generatePoultryReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      flock_count: await getFlockCount(farmerId),
      breed_distribution: await getBreedDistribution(farmerId),
      health_summary: await getHealthSummary(farmerId),
      production_metrics: await getProductionMetrics(farmerId),
      vaccination_status: await getVaccinationStatus(farmerId),
      recommendations: await generateFarmerRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating poultry report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate poultry report');
  }
}

function generateId() {
  return `POU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getBreedCharacteristics(breed) {
  return {
    ideal_temperature: 20,
    humidity_range: '60-70%',
    space_per_bird: '0.5 sq ft',
    lifespan_weeks: 72
  };
}

async function getRegionalHealthPatterns(state, district) {
  return {
    common_diseases: ['newcastle', 'avian_influenza', 'coccidiosis'],
    vaccination_requirements: ['ndv', 'ib', 'ibd']
  };
}

async function getVaccinationSchedule(breed, ageWeeks) {
  return [
    { vaccine: 'NDV', due_week: 1, status: 'pending' },
    { vaccine: 'IB', due_week: 2, status: 'pending' },
    { vaccine: 'IBD', due_week: 3, status: 'pending' }
  ];
}

async function getNutritionalRequirements(breed, purpose) {
  return {
    protein_percentage: 18,
    energy_kcal: 2800,
    calcium_percentage: 1.0,
    phosphorus_percentage: 0.5
  };
}

async function getFlockHealthHistory(registryId) {
  try {
    const result = await pool.query(
      'SELECT * FROM poultry_health_records WHERE registry_id = $1 ORDER BY recorded_at DESC LIMIT 10',
      [registryId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getBreedHealthStandards(breed) {
  return {
    ideal_mortality_rate: 5,
    target_feed_conversion: 1.8,
    target_egg_production: 85
  };
}

async function getEnvironmentalFactors(location) {
  return {
    climate: 'tropical',
    altitude: 100,
    biosecurity_level: 'standard'
  };
}

async function getFlockBreed(registryId) {
  try {
    const result = await pool.query(
      'SELECT breed FROM poultry_registry WHERE flock_registry_id = $1',
      [registryId]
    );
    return result.rows[0]?.breed || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

async function getFlockLocation(registryId) {
  try {
    const result = await pool.query(
      'SELECT location, state, district FROM poultry_registry WHERE flock_registry_id = $1',
      [registryId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getEggProductionMetrics(registryId, period) {
  return {
    total_eggs: 1000,
    egg_rate: 85,
    egg_weight: 60,
    quality_grade: 'A'
  };
}

async function calculateFeedEfficiency(registryId, period) {
  return {
    feed_conversion_ratio: 1.8,
    feed_cost_per_kg: 2.5,
    efficiency_rating: 'good'
  };
}

async function getHealthMetrics(registryId, period) {
  return {
    overall_health_score: 80,
    disease_incidence: 3,
    mortality_rate: 4
  };
}

async function getMortalityAnalysis(registryId, period) {
  return {
    total_deaths: 20,
    mortality_rate: 4,
    causes: ['disease', 'predation', 'unknown']
  };
}

async function getWeightGains(registryId, period) {
  return {
    average_weight: 2.5,
    weight_gain: 0.5,
    growth_rate: 'normal'
  };
}

async function generatePerformanceRecommendations(registryId, period) {
  return [
    'Optimize feed composition for better conversion',
    'Improve biosecurity measures',
    'Monitor environmental conditions'
  ];
}

async function getFlockCount(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM poultry_registry WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getBreedDistribution(farmerId) {
  try {
    const result = await pool.query(
      'SELECT breed, COUNT(*) as count FROM poultry_registry WHERE farmer_id = $1 GROUP BY breed',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getHealthSummary(farmerId) {
  return {
    healthy: 80,
    needs_attention: 15,
    critical: 5
  };
}

async function getProductionMetrics(farmerId) {
  return {
    total_eggs: 50000,
    average_egg_rate: 82,
    total_meat_production: 1000
  };
}

async function getVaccinationStatus(farmerId) {
  return {
    fully_vaccinated: 70,
    partially_vaccinated: 20,
    not_vaccinated: 10
  };
}

async function generateFarmerRecommendations(farmerId) {
  return [
    'Complete vaccination schedule for all flocks',
    'Implement regular health check-ups',
    'Optimize feed management'
  ];
}

module.exports = {
  registerPoultryFlock,
  updateFlockHealth,
  trackFlockPerformance,
  generatePoultryReport
};
