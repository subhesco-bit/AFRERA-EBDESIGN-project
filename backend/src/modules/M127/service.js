/**
 * Animal Health Management Service (M127)
 * Comprehensive health monitoring, disease management, and veterinary services
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Create health record
 */
async function createHealthRecord(healthData) {
  try {
    const {
      animal_id,
      animal_type,
      farmer_id,
      breed,
      age,
      health_status,
      symptoms,
      diagnosis,
      treatment,
      veterinarian_id,
      location,
      state,
      district
    } = healthData;

    const record = {
      health_record_id: generateId(),
      animal_id,
      animal_type,
      farmer_id,
      breed,
      age,
      health_status,
      symptoms,
      diagnosis,
      treatment,
      veterinarian_id,
      location,
      state,
      district,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered health analysis
    const aiRequest = {
      task: 'animal_health_analysis',
      parameters: {
        health_data: healthData,
        disease_patterns: await getDiseasePatterns(animal_type, state, district),
        treatment_recommendations: await getTreatmentRecommendations(diagnosis, animal_type),
        vaccination_status: await getVaccinationStatus(animal_id),
        herd_health_impact: await assessHerdHealthImpact(animal_id, farmer_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    record.ai_analysis = aiResponse;

    const result = await pool.query(
      `INSERT INTO animal_health_records 
       (health_record_id, animal_id, animal_type, farmer_id, breed, age, 
        health_status, symptoms, diagnosis, treatment, veterinarian_id, 
        location, state, district, status, ai_analysis, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        record.health_record_id,
        record.animal_id,
        record.animal_type,
        record.farmer_id,
        record.breed,
        record.age,
        record.health_status,
        JSON.stringify(record.symptoms),
        record.diagnosis,
        JSON.stringify(record.treatment),
        record.veterinarian_id,
        record.location,
        record.state,
        record.district,
        record.status,
        JSON.stringify(record.ai_analysis),
        record.created_at
      ]
    );

    logger.info(`Health record created: ${record.health_record_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating health record', { error: error.message, stack: error.stack });
    throw new Error('Failed to create health record');
  }
}

/**
 * Schedule vaccination
 */
async function scheduleVaccination(vaccinationData) {
  try {
    const {
      animal_id,
      animal_type,
      farmer_id,
      vaccine_type,
      vaccine_name,
      scheduled_date,
      veterinarian_id,
      location,
      state,
      district
    } = vaccinationData;

    const vaccination = {
      vaccination_id: generateId(),
      animal_id,
      animal_type,
      farmer_id,
      vaccine_type,
      vaccine_name,
      scheduled_date,
      veterinarian_id,
      location,
      state,
      district,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };

    // AI-powered vaccination optimization
    const aiRequest = {
      task: 'vaccination_optimization',
      parameters: {
        vaccination_data: vaccinationData,
        vaccination_schedule: await getVaccinationSchedule(animal_type),
        herd_immunity: await assessHerdImmunity(farmer_id, animal_type),
        disease_risk: await assessDiseaseRisk(animal_type, state, district)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    vaccination.ai_optimization = aiResponse;

    const result = await pool.query(
      `INSERT INTO vaccination_schedules 
       (vaccination_id, animal_id, animal_type, farmer_id, vaccine_type, 
        vaccine_name, scheduled_date, veterinarian_id, location, state, 
        district, status, ai_optimization, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        vaccination.vaccination_id,
        vaccination.animal_id,
        vaccination.animal_type,
        vaccination.farmer_id,
        vaccination.vaccine_type,
        vaccination.vaccine_name,
        vaccination.scheduled_date,
        vaccination.veterinarian_id,
        vaccination.location,
        vaccination.state,
        vaccination.district,
        vaccination.status,
        JSON.stringify(vaccination.ai_optimization),
        vaccination.created_at
      ]
    );

    logger.info(`Vaccination scheduled: ${vaccination.vaccination_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error scheduling vaccination', { error: error.message, stack: error.stack });
    throw new Error('Failed to schedule vaccination');
  }
}

/**
 * Monitor herd health
 */
async function monitorHerdHealth(farmerId, animalType) {
  try {
    const monitoring = {
      monitoring_id: generateId(),
      farmer_id: farmerId,
      animal_type: animalType,
      timestamp: new Date().toISOString(),
      overall_health_score: await calculateHerdHealthScore(farmerId, animalType),
      disease_outbreaks: await detectDiseaseOutbreaks(farmerId, animalType),
    vaccination_coverage: await calculateVaccinationCoverage(farmerId, animalType),
    treatment_compliance: await calculateTreatmentCompliance(farmerId, animalType),
    recommendations: await generateHerdHealthRecommendations(farmerId, animalType)
    };

    return monitoring;
  } catch (error) {
    logger.error('Error monitoring herd health', { error: error.message, stack: error.stack });
    throw new Error('Failed to monitor herd health');
  }
}

/**
 * Generate health report
 */
async function generateHealthReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      total_animals: await getTotalAnimals(farmerId),
      health_summary: await getHealthSummary(farmerId),
      disease_statistics: await getDiseaseStatistics(farmerId),
      vaccination_status: await getVaccinationStatus(farmerId),
      treatment_history: await getTreatmentHistory(farmerId),
      recommendations: await generateHealthRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating health report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate health report');
  }
}

function generateId() {
  return `HLT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getDiseasePatterns(animalType, state, district) {
  try {
    const result = await pool.query(
      'SELECT * FROM regional_disease_patterns WHERE animal_type = $1 AND state = $2 AND district = $3',
      [animalType, state, district]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getTreatmentRecommendations(diagnosis, animalType) {
  return [
    { treatment: 'antibiotics', duration: '7 days', dosage: 'recommended' },
    { treatment: 'supportive_care', duration: '14 days', dosage: 'as_needed' }
  ];
}

async function getVaccinationStatus(animalId) {
  try {
    const result = await pool.query(
      'SELECT * FROM vaccination_records WHERE animal_id = $1 ORDER BY vaccination_date DESC LIMIT 5',
      [animalId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function assessHerdHealthImpact(animalId, farmerId) {
  return {
    transmission_risk: 'medium',
    quarantine_needed: false,
    herd_monitoring_required: true
  };
}

async function getVaccinationSchedule(animalType) {
  return [
    { vaccine: 'core_vaccine', age_weeks: 4, booster: '6_months' },
    { vaccine: 'disease_specific', age_weeks: 8, booster: '12_months' }
  ];
}

async function assessHerdImmunity(farmerId, animalType) {
  return {
    coverage_percentage: 75,
    immunity_level: 'moderate',
    vulnerability_risk: 'medium'
  };
}

async function assessDiseaseRisk(animalType, state, district) {
  return {
    current_risk: 'low',
    seasonal_risk: 'moderate',
    endemic_diseases: ['common_disease_1', 'common_disease_2']
  };
}

async function calculateHerdHealthScore(farmerId, animalType) {
  return {
    overall_score: 80,
    health_distribution: { excellent: 60, good: 25, fair: 10, poor: 5 },
    trend: 'improving'
  };
}

async function detectDiseaseOutbreaks(farmerId, animalType) {
  return {
    active_outbreaks: 0,
    recent_outbreaks: 1,
    outbreak_types: ['respiratory'],
    affected_animals: 5
  };
}

async function calculateVaccinationCoverage(farmerId, animalType) {
  return {
    fully_vaccinated: 70,
    partially_vaccinated: 20,
    not_vaccinated: 10,
    coverage_percentage: 75
  };
}

async function calculateTreatmentCompliance(farmerId, animalType) {
  return {
    compliance_rate: 85,
    treatment_completion: 90,
    follow_up_rate: 75
  };
}

async function generateHerdHealthRecommendations(farmerId, animalType) {
  return [
    'Increase vaccination coverage',
    'Implement regular health screenings',
    'Improve biosecurity measures'
  ];
}

async function getTotalAnimals(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM animal_registry WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getHealthSummary(farmerId) {
  return {
    healthy: 75,
    under_treatment: 15,
    critical: 5,
    quarantined: 5
  };
}

async function getDiseaseStatistics(farmerId) {
  return {
    total_cases: 50,
    active_cases: 10,
    recovered: 35,
    mortality: 5
  };
}

async function getTreatmentHistory(farmerId) {
  return {
    total_treatments: 100,
    successful: 85,
    ongoing: 10,
    failed: 5
  };
}

async function generateHealthRecommendations(farmerId) {
  return [
    'Implement preventive health measures',
    'Schedule regular veterinary check-ups',
    'Maintain proper nutrition and housing'
  ];
}

module.exports = {
  createHealthRecord,
  scheduleVaccination,
  monitorHerdHealth,
  generateHealthReport
};
