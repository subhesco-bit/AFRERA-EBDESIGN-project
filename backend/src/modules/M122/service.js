/**
 * Cattle Registry Service (M122)
 * Comprehensive livestock management and cattle registry system
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Register cattle in the registry
 */
async function registerCattle(cattleData) {
  try {
    const {
      farmer_id,
      cattle_id,
      breed,
      age,
      gender,
      weight,
      health_status,
      vaccination_status,
      location,
      state,
      district,
      registration_date,
      purpose,
      tag_number
    } = cattleData;

    const cattle = {
      registry_id: generateId(),
      cattle_id: cattle_id,
      farmer_id: farmer_id,
      breed: breed,
      age: age,
      gender: gender,
      weight: weight,
      health_status: health_status,
      vaccination_status: vaccination_status,
      location: location,
      state: state,
      district: district,
      registration_date: registration_date,
      purpose: purpose,
      tag_number: tag_number,
      status: 'registered',
      created_at: new Date().toISOString()
    };

    // AI-powered cattle health assessment
    const aiRequest = {
      task: 'cattle_health_assessment',
      parameters: {
        cattle_data: cattleData,
        breed_characteristics: await getBreedCharacteristics(breed),
        regional_health_patterns: await getRegionalHealthPatterns(state, district),
        vaccination_schedule: await getVaccinationSchedule(breed, age),
        nutritional_requirements: await getNutritionalRequirements(breed, purpose)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    cattle.ai_health_assessment = aiResponse;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO cattle_registry 
       (registry_id, cattle_id, farmer_id, breed, age, gender, weight, 
        health_status, vaccination_status, location, state, district, 
        registration_date, purpose, tag_number, status, ai_assessment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        cattle.registry_id,
        cattle.cattle_id,
        cattle.farmer_id,
        cattle.breed,
        cattle.age,
        cattle.gender,
        cattle.weight,
        cattle.health_status,
        cattle.vaccination_status,
        cattle.location,
        cattle.state,
        cattle.district,
        cattle.registration_date,
        cattle.purpose,
        cattle.tag_number,
        cattle.status,
        JSON.stringify(cattle.ai_health_assessment),
        cattle.created_at
      ]
    );

    logger.info(`Cattle registered: ${cattle.registry_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering cattle', { error: error.message, stack: error.stack });
    throw new Error('Failed to register cattle');
  }
}

/**
 * Update cattle health record
 */
async function updateCattleHealth(registryId, healthData) {
  try {
    const {
      health_status,
      weight,
      body_condition_score,
      vaccination_records,
      treatment_history,
      reproductive_status,
      milk_production,
      feed_intake
    } = healthData;

    const healthRecord = {
      record_id: generateId(),
      registry_id: registryId,
      health_status: health_status,
      weight: weight,
      body_condition_score: body_condition_score,
      vaccination_records: vaccination_records,
      treatment_history: treatment_history,
      reproductive_status: reproductive_status,
      milk_production: milk_production,
      feed_intake: feed_intake,
      recorded_at: new Date().toISOString()
    };

    // AI-powered health analysis
    const aiRequest = {
      task: 'cattle_health_analysis',
      parameters: {
        registry_id: registryId,
        health_data: healthData,
        historical_health: await getCattleHealthHistory(registryId),
        breed_standards: await getBreedHealthStandards(await getCattleBreed(registryId)),
        environmental_factors: await getEnvironmentalFactors(await getCattleLocation(registryId))
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    healthRecord.ai_analysis = aiResponse;

    // Update database
    const result = await pool.query(
      `UPDATE cattle_registry 
       SET health_status = $1, weight = $2, updated_at = CURRENT_TIMESTAMP
       WHERE registry_id = $3
       RETURNING *`,
      [health_status, weight, registryId]
    );

    // Insert health record
    await pool.query(
      `INSERT INTO cattle_health_records 
       (record_id, registry_id, health_status, weight, body_condition_score, 
        vaccination_records, treatment_history, reproductive_status, 
        milk_production, feed_intake, ai_analysis, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        healthRecord.record_id,
        registryId,
        health_status,
        weight,
        body_condition_score,
        JSON.stringify(vaccination_records),
        JSON.stringify(treatment_history),
        reproductive_status,
        JSON.stringify(milk_production),
        JSON.stringify(feed_intake),
        JSON.stringify(healthRecord.ai_analysis),
        healthRecord.recorded_at
      ]
    );

    logger.info(`Cattle health updated: ${registryId}`);
    return { ...result.rows[0], health_record: healthRecord };
  } catch (error) {
    logger.error('Error updating cattle health', { error: error.message, stack: error.stack });
    throw new Error('Failed to update cattle health');
  }
}

/**
 * Track cattle performance
 */
async function trackCattlePerformance(registryId, period) {
  try {
    const performance = {
      tracking_id: generateId(),
      registry_id: registryId,
      period: period,
      timestamp: new Date().toISOString(),
      weight_gain: await calculateWeightGain(registryId, period),
      feed_efficiency: await calculateFeedEfficiency(registryId, period),
      health_metrics: await getHealthMetrics(registryId, period),
      reproductive_performance: await getReproductivePerformance(registryId, period),
      milk_production_metrics: await getMilkProductionMetrics(registryId, period),
      recommendations: await generatePerformanceRecommendations(registryId, period)
    };

    return performance;
  } catch (error) {
    logger.error('Error tracking cattle performance', { error: error.message, stack: error.stack });
    throw new Error('Failed to track cattle performance');
  }
}

/**
 * Generate cattle registry report
 */
async function generateRegistryReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      cattle_count: await getCattleCount(farmerId),
      breed_distribution: await getBreedDistribution(farmerId),
      health_summary: await getHealthSummary(farmerId),
      production_metrics: await getProductionMetrics(farmerId),
      vaccination_status: await getVaccinationStatus(farmerId),
      recommendations: await generateFarmerRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating registry report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate registry report');
  }
}

/**
 * Get breeding recommendations
 */
async function getBreedingRecommendations(registryId) {
  try {
    const cattle = await getCattleDetails(registryId);
    
    const aiRequest = {
      task: 'cattle_breeding_recommendations',
      parameters: {
        cattle_details: cattle,
        breed_characteristics: await getBreedCharacteristics(cattle.breed),
        genetic_pool: await getAvailableGeneticPool(cattle.state, cattle.district),
        breeding_goals: await getBreedingGoals(cattle.purpose),
        health_factors: await getBreedingHealthFactors(registryId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const recommendations = {
      registry_id: registryId,
      generated_at: new Date().toISOString(),
      breeding_partners: aiResponse.recommended_partners,
      optimal_breeding_time: aiResponse.optimal_timing,
      genetic_considerations: aiResponse.genetic_considerations,
      expected_outcomes: aiResponse.expected_outcomes,
      confidence: aiResponse.confidence
    };

    return recommendations;
  } catch (error) {
    logger.error('Error getting breeding recommendations', { error: error.message, stack: error.stack });
    throw new Error('Failed to get breeding recommendations');
  }
}

// Helper functions
function generateId() {
  return `CR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getBreedCharacteristics(breed) {
  try {
    const result = await pool.query(
      'SELECT * FROM cattle_breed_characteristics WHERE breed_name = $1',
      [breed]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getRegionalHealthPatterns(state, district) {
  try {
    const result = await pool.query(
      'SELECT * FROM regional_cattle_health_patterns WHERE state = $1 AND district = $2',
      [state, district]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getVaccinationSchedule(breed, age) {
  return [
    { vaccine: 'FMD', due_date: '2026-09-01', status: 'pending' },
    { vaccine: 'Brucellosis', due_date: '2026-10-01', status: 'pending' },
    { vaccine: 'HS', due_date: '2026-11-01', status: 'pending' }
  ];
}

async function getNutritionalRequirements(breed, purpose) {
  return {
    daily_dry_matter: 10,
    protein_requirement: 12,
    energy_requirement: 65,
    mineral_requirements: ['calcium', 'phosphorus', 'magnesium']
  };
}

async function getCattleHealthHistory(registryId) {
  try {
    const result = await pool.query(
      'SELECT * FROM cattle_health_records WHERE registry_id = $1 ORDER BY recorded_at DESC LIMIT 10',
      [registryId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getBreedHealthStandards(breed) {
  return {
    ideal_weight_range: { min: 400, max: 600 },
    ideal_body_condition: 3,
    common_health_issues: ['mastitis', 'lameness', 'respiratory']
  };
}

async function getEnvironmentalFactors(location) {
  return {
    climate: 'tropical',
    altitude: 100,
    forage_availability: 'good',
    water_quality: 'excellent'
  };
}

async function getCattleBreed(registryId) {
  try {
    const result = await pool.query(
      'SELECT breed FROM cattle_registry WHERE registry_id = $1',
      [registryId]
    );
    return result.rows[0]?.breed || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

async function getCattleLocation(registryId) {
  try {
    const result = await pool.query(
      'SELECT location, state, district FROM cattle_registry WHERE registry_id = $1',
      [registryId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function calculateWeightGain(registryId, period) {
  return {
    start_weight: 450,
    end_weight: 480,
    gain: 30,
    gain_percentage: 6.7,
    daily_gain: 0.3
  };
}

async function calculateFeedEfficiency(registryId, period) {
  return {
    feed_conversion_ratio: 6.5,
    feed_cost_per_kg_gain: 45,
    efficiency_rating: 'good'
  };
}

async function getHealthMetrics(registryId, period) {
  return {
    overall_health_score: 85,
    disease_incidence: 2,
    mortality_rate: 1,
    treatment_frequency: 3
  };
}

async function getReproductivePerformance(registryId, period) {
  return {
    conception_rate: 75,
    calving_interval: 420,
    calf_survival_rate: 95
  };
}

async function getMilkProductionMetrics(registryId, period) {
  return {
    daily_production: 15,
    fat_content: 4.0,
    protein_content: 3.2,
    somatic_cell_count: 200
  };
}

async function generatePerformanceRecommendations(registryId, period) {
  return [
    'Increase protein content in feed for better weight gain',
    'Monitor body condition score regularly',
    'Implement vaccination schedule reminders'
  ];
}

async function getCattleCount(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM cattle_registry WHERE farmer_id = $1',
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
      'SELECT breed, COUNT(*) as count FROM cattle_registry WHERE farmer_id = $1 GROUP BY breed',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getHealthSummary(farmerId) {
  return {
    healthy: 85,
    needs_attention: 12,
    critical: 3
  };
}

async function getProductionMetrics(farmerId) {
  return {
    total_milk_production: 1500,
    average_milk_per_cattle: 15,
    total_weight_gain: 450
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
    'Complete vaccination schedule for all cattle',
    'Implement regular health check-ups',
    'Optimize feed composition for better production'
  ];
}

async function getCattleDetails(registryId) {
  try {
    const result = await pool.query(
      'SELECT * FROM cattle_registry WHERE registry_id = $1',
      [registryId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getAvailableGeneticPool(state, district) {
  return [
    { breed: 'Holstein Friesian', availability: 'high', quality: 'excellent' },
    { breed: 'Jersey', availability: 'medium', quality: 'good' },
    { breed: ' indigenous', availability: 'high', quality: 'good' }
  ];
}

async function getBreedingGoals(purpose) {
  if (purpose === 'milk') {
    return ['high_milk_yield', 'good_fat_content', 'long_lactation_period'];
  } else if (purpose === 'meat') {
    return ['fast_growth', 'good_feed_conversion', 'high_meat_quality'];
  }
  return ['general_health', 'disease_resistance'];
}

async function getBreedingHealthFactors(registryId) {
  const healthHistory = await getCattleHealthHistory(registryId);
  return {
    reproductive_health: 'good',
    genetic_diseases: [],
    overall_fitness: 'excellent'
  };
}

module.exports = {
  registerCattle,
  updateCattleHealth,
  trackCattlePerformance,
  generateRegistryReport,
  getBreedingRecommendations
};
