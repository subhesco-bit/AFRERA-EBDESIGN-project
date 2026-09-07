/**
 * Water Quality Monitoring Service (M077)
 * Real-time water quality tracking, compliance monitoring, and alerts
 *
 * DATA-SOURCE DISCLOSURE (2026-08-29)
 * recordWaterQualityMeasurement/getMeasurements/getHistoricalQualityData/
 * getCurrentReadings/calculateComplianceScore/identifyViolations/
 * generateQualityAlerts/getSourceType are real: they read and write real
 * tables, and generateQualityAlerts genuinely evaluates the fetched reading.
 * getWaterStandards/getFiltrationRequirements-equivalent lookups are
 * legitimate static reference tables (WHO/regulatory thresholds), not
 * fabrication. But calculateQualityIndex fetches the current reading and then
 * IGNORES it, returning the same fixed index regardless; analyzeQualityTrends,
 * predictQualityChanges, getTreatmentCapacity, getBudgetConstraints and
 * getRegulatoryRequirements are static placeholders regardless of location.
 * Reachable live from `frontend/src/pages/WaterManagementPage.jsx`
 * (monitorQuality, getTreatmentRecommendations). Fixed the fabricated
 * confidence score below; the rest needs real integration (a lab/telemetry
 * feed, historical trend data), not better-looking fake numbers - tracked in
 * .ai/tasks/ACTIVE.md.
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Record water quality measurement
 */
async function recordWaterQualityMeasurement(measurementData) {
  try {
    const {
      location_id,
      source_type,
      sample_date,
      ph_level,
      turbidity,
      dissolved_oxygen,
      conductivity,
      temperature,
      total_dissolved_solids,
      bacterial_count,
      chemical_contaminants,
      location_name,
      state,
      district
    } = measurementData;

    const measurement = {
      measurement_id: generateId(),
      location_id,
      source_type,
      sample_date,
      parameters: {
        ph_level,
        turbidity,
        dissolved_oxygen,
        conductivity,
        temperature,
        total_dissolved_solids,
        bacterial_count,
        chemical_contaminants
      },
      location_name,
      state,
      district,
      compliance_status: 'pending',
      created_at: new Date().toISOString()
    };

    // AI-powered water quality assessment
    const aiRequest = {
      task: 'water_quality_assessment',
      parameters: {
        measurement_data: measurementData,
        water_standards: await getWaterStandards(source_type),
        historical_data: await getHistoricalQualityData(location_id),
        seasonal_patterns: await getSeasonalPatterns(state, district),
        usage_context: await getUsageContext(location_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    measurement.ai_assessment = aiResponse;
    measurement.compliance_status = aiResponse.compliance_status;
    measurement.health_risk_level = aiResponse.risk_level;

    // Insert into database
    const result = await pool.query(
      `INSERT INTO water_quality_measurements 
       (measurement_id, location_id, source_type, sample_date, ph_level, turbidity, 
        dissolved_oxygen, conductivity, temperature, total_dissolved_solids, 
        bacterial_count, chemical_contaminants, location_name, state, district, 
        compliance_status, health_risk_level, ai_assessment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        measurement.measurement_id,
        measurement.location_id,
        measurement.source_type,
        measurement.sample_date,
        ph_level,
        turbidity,
        dissolved_oxygen,
        conductivity,
        temperature,
        total_dissolved_solids,
        bacterial_count,
        JSON.stringify(chemical_contaminants),
        measurement.location_name,
        measurement.state,
        measurement.district,
        measurement.compliance_status,
        measurement.health_risk_level,
        JSON.stringify(measurement.ai_assessment),
        measurement.created_at
      ]
    );

    logger.info(`Water quality measurement recorded: ${measurement.measurement_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording water quality measurement', { error: error.message, stack: error.stack });
    throw new Error('Failed to record water quality measurement');
  }
}

/**
 * Get water quality compliance report
 */
async function getComplianceReport(locationId, period) {
  try {
    const report = {
      report_id: generateId(),
      location_id: locationId,
      period: period,
      generated_at: new Date().toISOString(),
      measurements: await getMeasurements(locationId, period),
      compliance_score: await calculateComplianceScore(locationId, period),
      violations: await identifyViolations(locationId, period),
      trends: await analyzeQualityTrends(locationId, period),
      recommendations: await generateComplianceRecommendations(locationId, period)
    };

    return report;
  } catch (error) {
    logger.error('Error generating compliance report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate compliance report');
  }
}

/**
 * Monitor water quality in real-time
 */
async function monitorWaterQuality(locationId) {
  try {
    const monitoring = {
      monitoring_id: generateId(),
      location_id: locationId,
      timestamp: new Date().toISOString(),
      current_readings: await getCurrentReadings(locationId),
      quality_index: await calculateQualityIndex(locationId),
      health_status: await determineHealthStatus(locationId),
      alerts: await generateQualityAlerts(locationId),
      predictions: await predictQualityChanges(locationId)
    };

    return monitoring;
  } catch (error) {
    logger.error('Error monitoring water quality', { error: error.message, stack: error.stack });
    throw new Error('Failed to monitor water quality');
  }
}

/**
 * Generate water quality treatment recommendations
 */
async function generateTreatmentRecommendations(locationId, qualityIssues) {
  try {
    const aiRequest = {
      task: 'water_treatment_recommendations',
      parameters: {
        location_id: locationId,
        quality_issues: qualityIssues,
        current_quality: await getCurrentReadings(locationId),
        source_type: await getSourceType(locationId),
        treatment_capacity: await getTreatmentCapacity(locationId),
        budget_constraints: await getBudgetConstraints(locationId),
        regulatory_requirements: await getRegulatoryRequirements(locationId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const recommendations = {
      recommendation_id: generateId(),
      location_id: locationId,
      timestamp: new Date().toISOString(),
      issues_identified: qualityIssues,
      treatment_options: aiResponse.treatment_options,
      implementation_plan: aiResponse.implementation_plan,
      cost_estimate: aiResponse.cost_estimate,
      expected_improvement: aiResponse.expected_improvement,
      priority: aiResponse.priority,
      confidence: aiResponse.confidence
    };

    return recommendations;
  } catch (error) {
    logger.error('Error generating treatment recommendations', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate treatment recommendations');
  }
}

// Helper functions
function generateId() {
  return `WQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getWaterStandards(sourceType) {
  const standards = {
    drinking_water: {
      ph: { min: 6.5, max: 8.5 },
      turbidity: { max: 5 },
      dissolved_oxygen: { min: 6 },
      bacterial_count: { max: 0 }
    },
    irrigation: {
      ph: { min: 6.0, max: 8.5 },
      turbidity: { max: 50 },
      dissolved_oxygen: { min: 3 },
      bacterial_count: { max: 100 }
    },
    industrial: {
      ph: { min: 5.5, max: 9.0 },
      turbidity: { max: 100 },
      dissolved_oxygen: { min: 2 },
      bacterial_count: { max: 500 }
    }
  };
  return standards[sourceType] || standards.drinking_water;
}

async function getHistoricalQualityData(locationId) {
  try {
    const result = await pool.query(
      'SELECT * FROM water_quality_measurements WHERE location_id = $1 ORDER BY sample_date DESC LIMIT 30',
      [locationId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getSeasonalPatterns(state, district) {
  return {
    monsoon: { ph: 'lower', turbidity: 'higher', bacterial: 'higher' },
    summer: { ph: 'higher', turbidity: 'lower', bacterial: 'lower' },
    winter: { ph: 'stable', turbidity: 'stable', bacterial: 'lower' }
  };
}

async function getUsageContext(locationId) {
  try {
    const result = await pool.query(
      'SELECT primary_use, secondary_use FROM water_usage_context WHERE location_id = $1',
      [locationId]
    );
    return result.rows[0] || { primary_use: 'domestic', secondary_use: 'irrigation' };
  } catch (error) {
    return { primary_use: 'domestic', secondary_use: 'irrigation' };
  }
}

async function getMeasurements(locationId, period) {
  try {
    const result = await pool.query(
      `SELECT * FROM water_quality_measurements 
       WHERE location_id = $1 AND sample_date >= $2 
       ORDER BY sample_date DESC`,
      [locationId, period]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function calculateComplianceScore(locationId, period) {
  const measurements = await getMeasurements(locationId, period);
  if (measurements.length === 0) return 0;
  
  const compliantCount = measurements.filter(m => m.compliance_status === 'compliant').length;
  return Math.round((compliantCount / measurements.length) * 100);
}

async function identifyViolations(locationId, period) {
  const measurements = await getMeasurements(locationId, period);
  const violations = measurements.filter(m => m.compliance_status !== 'compliant');
  
  return violations.map(v => ({
    measurement_id: v.measurement_id,
    sample_date: v.sample_date,
    violation_type: v.compliance_status,
    parameters_out_of_range: v.ai_assessment?.parameters_out_of_range || []
  }));
}

async function analyzeQualityTrends(locationId, period) {
  return {
    ph_trend: 'stable',
    turbidity_trend: 'increasing',
    dissolved_oxygen_trend: 'decreasing',
    overall_quality_trend: 'declining'
  };
}

async function generateComplianceRecommendations(locationId, period) {
  const violations = await identifyViolations(locationId, period);
  
  if (violations.length > 0) {
    return [
      'Implement regular water treatment',
      'Monitor contamination sources',
      'Increase sampling frequency',
      'Install water filtration systems'
    ];
  }
  
  return ['Maintain current monitoring practices'];
}

async function getCurrentReadings(locationId) {
  try {
    const result = await pool.query(
      'SELECT * FROM water_quality_measurements WHERE location_id = $1 ORDER BY sample_date DESC LIMIT 1',
      [locationId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function calculateQualityIndex(locationId) {
  const readings = await getCurrentReadings(locationId);
  return {
    overall_index: 75,
    ph_index: 80,
    turbidity_index: 70,
    biological_index: 75,
    chemical_index: 70
  };
}

async function determineHealthStatus(locationId) {
  const index = await calculateQualityIndex(locationId);
  if (index.overall_index >= 80) return 'excellent';
  if (index.overall_index >= 60) return 'good';
  if (index.overall_index >= 40) return 'fair';
  return 'poor';
}

async function generateQualityAlerts(locationId) {
  const readings = await getCurrentReadings(locationId);
  const alerts = [];
  
  if (readings.ph_level < 6.0 || readings.ph_level > 8.5) {
    alerts.push({ type: 'ph_anomaly', severity: 'high', message: 'pH level outside safe range' });
  }
  
  if (readings.bacterial_count > 100) {
    alerts.push({ type: 'bacterial_contamination', severity: 'high', message: 'High bacterial count detected' });
  }
  
  return alerts;
}

async function predictQualityChanges(locationId) {
  // Was a hardcoded confidence:75 dressing up a static guess as a scored
  // prediction. No real trend model exists yet - say so honestly.
  return {
    configured: false,
    reason: 'No water-quality prediction model is wired for this location. Needs historical trend data and a real forecasting method.',
    factors: ['seasonal_changes', 'increased_usage', 'potential_contamination'],
    recommended_actions: ['increase_monitoring', 'check_sources']
  };
}

async function getSourceType(locationId) {
  try {
    const result = await pool.query(
      'SELECT source_type FROM water_sources WHERE location_id = $1',
      [locationId]
    );
    return result.rows[0]?.source_type || 'drinking_water';
  } catch (error) {
    return 'drinking_water';
  }
}

async function getTreatmentCapacity(locationId) {
  return {
    current_capacity: 1000,
    utilized_capacity: 750,
    available_capacity: 250,
    treatment_types: ['filtration', 'disinfection', 'reverse_osmosis']
  };
}

async function getBudgetConstraints(locationId) {
  return {
    monthly_budget: 50000,
    current_spending: 35000,
    available_budget: 15000
  };
}

async function getRegulatoryRequirements(locationId) {
  return {
    standards: 'WHO_drinking_water',
    monitoring_frequency: 'daily',
    reporting_frequency: 'monthly',
    compliance_threshold: 95
  };
}

module.exports = {
  recordWaterQualityMeasurement,
  getComplianceReport,
  monitorWaterQuality,
  generateTreatmentRecommendations
};
