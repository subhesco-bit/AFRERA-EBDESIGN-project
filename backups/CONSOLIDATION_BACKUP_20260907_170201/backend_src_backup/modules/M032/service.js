/**
 * Soil Analysis Service (M032)
 * Comprehensive soil testing and analysis with AI-powered recommendations
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

async function createSoilSample(sampleData) {
  try {
    const {
      farmer_id,
      parcel_id,
      sample_date,
      sample_depth,
      sample_location,
      soil_type,
      ph_level,
      organic_matter,
      nitrogen,
      phosphorus,
      potassium,
      calcium,
      magnesium,
      sulfur,
      iron,
      zinc,
      copper,
      manganese,
      boron,
      electrical_conductivity,
      cation_exchange_capacity,
      texture,
      structure,
      water_holding_capacity
    } = sampleData;

    const sample = {
      sample_id: generateId(),
      farmer_id,
      parcel_id,
      sample_date,
      sample_depth,
      sample_location: sample_location || {},
      soil_type,
      ph_level,
      organic_matter,
      nitrogen,
      phosphorus,
      potassium,
      calcium,
      magnesium,
      sulfur,
      iron,
      zinc,
      copper,
      manganese,
      boron,
      electrical_conductivity,
      cation_exchange_capacity,
      texture,
      structure,
      water_holding_capacity,
      created_at: new Date().toISOString()
    };

    // AI-powered soil health analysis
    const aiRequest = {
      task: 'soil_health_analysis',
      parameters: {
        sample_data: sampleData,
        nutrient_standards: await getNutrientStandards(soil_type),
        regional_benchmarks: await getRegionalBenchmarks(sample_location),
        crop_requirements: await getCropRequirements()
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    sample.ai_health_score = aiResponse.health_score;
    sample.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO soil_samples 
       (sample_id, farmer_id, parcel_id, sample_date, sample_depth, sample_location, 
        soil_type, ph_level, organic_matter, nitrogen, phosphorus, potassium, 
        calcium, magnesium, sulfur, iron, zinc, copper, manganese, boron, 
        electrical_conductivity, cation_exchange_capacity, texture, structure, 
        water_holding_capacity, ai_health_score, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
       RETURNING *`,
      [
        sample.sample_id, sample.farmer_id, sample.parcel_id, sample.sample_date,
        sample.sample_depth, JSON.stringify(sample.sample_location), sample.soil_type,
        sample.ph_level, sample.organic_matter, sample.nitrogen, sample.phosphorus,
        sample.potassium, sample.calcium, sample.magnesium, sample.sulfur, sample.iron,
        sample.zinc, sample.copper, sample.manganese, sample.boron,
        sample.electrical_conductivity, sample.cation_exchange_capacity, sample.texture,
        sample.structure, sample.water_holding_capacity, sample.ai_health_score,
        JSON.stringify(sample.ai_recommendations), sample.created_at
      ]
    );

    // Generate health report
    await generateSoilHealthReport(sample.sample_id, sampleData, aiResponse);

    logger.info(`Soil sample created: ${sample.sample_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating soil sample', { error: error.message, stack: error.stack });
    throw new Error('Failed to create soil sample');
  }
}

async function generateSoilHealthReport(sampleId, sampleData, aiAnalysis) {
  try {
    const report = {
      report_id: generateId(),
      sample_id: sampleId,
      overall_health: determineOverallHealth(aiAnalysis.health_score),
      fertility_rating: determineFertilityRating(sampleData),
      suitability_rating: aiAnalysis.suitability || {},
      nutrient_deficiencies: identifyDeficiencies(sampleData),
      recommended_amendments: aiAnalysis.amendments || [],
      recommended_crops: aiAnalysis.recommended_crops || [],
      irrigation_recommendations: aiAnalysis.irrigation || [],
      created_at: new Date().toISOString()
    };

    await pool.query(
      `INSERT INTO soil_health_reports 
       (report_id, sample_id, overall_health, fertility_rating, suitability_rating, 
        nutrient_deficiencies, recommended_amendments, recommended_crops, irrigation_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        report.report_id, report.sample_id, report.overall_health, report.fertility_rating,
        JSON.stringify(report.suitability_rating), JSON.stringify(report.nutrient_deficiencies),
        JSON.stringify(report.recommended_amendments), JSON.stringify(report.recommended_crops),
        JSON.stringify(report.irrigation_recommendations), report.created_at
      ]
    );

    return report;
  } catch (error) {
    logger.error('Error generating soil health report', { error: error.message });
  }
}

async function getSoilRecommendations(farmerId, parcelId) {
  try {
    const latestSample = await pool.query(
      `SELECT * FROM soil_samples 
       WHERE farmer_id = $1 AND parcel_id = $2 
       ORDER BY sample_date DESC LIMIT 1`,
      [farmerId, parcelId]
    );

    if (latestSample.rows.length === 0) {
      return { message: 'No soil samples found for this parcel' };
    }

    const sample = latestSample.rows[0];
    const report = await pool.query(
      'SELECT * FROM soil_health_reports WHERE sample_id = $1',
      [sample.sample_id]
    );

    return {
      sample: sample,
      health_report: report.rows[0] || null,
      ai_insights: sample.ai_recommendations
    };
  } catch (error) {
    logger.error('Error getting soil recommendations', { error: error.message, stack: error.stack });
    throw new Error('Failed to get soil recommendations');
  }
}

function generateId() {
  return `SOIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getNutrientStandards(soilType) {
  return {
    nitrogen: { optimal_min: 20, optimal_max: 40 },
    phosphorus: { optimal_min: 15, optimal_max: 30 },
    potassium: { optimal_min: 150, optimal_max: 250 },
    ph_level: { optimal_min: 6.0, optimal_max: 7.5 }
  };
}

async function getRegionalBenchmarks(location) {
  return {
    regional_average: {
      organic_matter: 2.5,
      nitrogen: 25,
      phosphorus: 20
    }
  };
}

async function getCropRequirements() {
  return {
    wheat: { nitrogen: 30, phosphorus: 20, potassium: 180 },
    rice: { nitrogen: 40, phosphorus: 20, potassium: 200 },
    vegetables: { nitrogen: 35, phosphorus: 25, potassium: 220 }
  };
}

function determineOverallHealth(healthScore) {
  if (healthScore >= 80) return 'excellent';
  if (healthScore >= 60) return 'good';
  if (healthScore >= 40) return 'moderate';
  return 'poor';
}

function determineFertilityRating(sampleData) {
  let score = 0;
  const nutrients = ['nitrogen', 'phosphorus', 'potassium', 'organic_matter'];
  
  nutrients.forEach(nutrient => {
    if (sampleData[nutrient] > 20) score += 25;
  });

  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function identifyDeficiencies(sampleData) {
  const deficiencies = [];
  const standards = {
    nitrogen: 20,
    phosphorus: 15,
    potassium: 150,
    organic_matter: 2.0
  };

  Object.keys(standards).forEach(nutrient => {
    if (sampleData[nutrient] < standards[nutrient]) {
      deficiencies.push({
        nutrient,
        current_level: sampleData[nutrient],
        recommended_level: standards[nutrient],
        severity: sampleData[nutrient] < standards[nutrient] * 0.5 ? 'severe' : 'moderate'
      });
    }
  });

  return deficiencies;
}

module.exports = {
  createSoilSample,
  generateSoilHealthReport,
  getSoilRecommendations
};
