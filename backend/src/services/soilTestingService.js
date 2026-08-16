/**
 * Soil Testing and Custom Fertilizer Recommendation Service
 * AI-powered soil analysis and personalized fertilizer recommendations
 */

const { logger } = require('../utils/logger');
const { aiAPI } = require('./aiService');
const { authMiddleware } = require('../middleware/auth');
const { getPostgreSQL } = require('../database/connection');

/**
 * Submit soil sample for testing
 */
async function submitSoilSample(sampleData) {
  try {
    const {
      farmer_id,
      farm_id,
      location,
      state,
      district,
      sample_depth,
      sample_type,
      crop_planned,
      irrigation_type,
      collection_date,
      collector_name,
      lab_preference
    } = sampleData;

    const sample = {
      sample_id: generateId(),
      farmer_id: farmer_id,
      farm_id: farm_id,
      location: location,
      state: state,
      district: district,
      sample_depth: sample_depth,
      sample_type: sample_type,
      crop_planned: crop_planned,
      irrigation_type: irrigation_type,
      collection_date: collection_date,
      collector_name: collector_name,
      lab_preference: lab_preference,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      tracking_number: generateTrackingNumber()
    };

    // Assign to lab
    const assignedLab = await assignToLab(sample);
    sample.assigned_lab = assignedLab;
    sample.estimated_completion_date = calculateEstimatedCompletion();

    logger.info(`Soil sample submitted: ${sample.sample_id}`);
    return sample;
  } catch (error) {
    logger.error('Error submitting soil sample', { error: error.message, stack: error.stack });
    throw new Error('Failed to submit soil sample');
  }
}

/**
 * Process soil test results with AI analysis
 */
async function processSoilTestResults(sampleId, labResults) {
  try {
    const sample = await getSoilSample(sampleId);
    
    // AI-powered soil analysis
    const aiRequest = {
      task: 'soil_analysis',
      parameters: {
        sample_id: sampleId,
        sample_data: sample,
        lab_results: labResults,
        crop_planned: sample.crop_planned,
        irrigation_type: sample.irrigation_type,
        location: sample.location,
        soil_standards: await getSoilStandards(sample.state),
        regional_recommendations: await getRegionalRecommendations(sample.state, sample.district)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const analysis = {
      sample_id: sampleId,
      analysis_id: generateId(),
      timestamp: new Date().toISOString(),
      lab_results: labResults,
      ai_analysis: {
        overall_soil_health: aiResponse.soil_health_score,
        nutrient_status: aiResponse.nutrient_status,
        ph_status: aiResponse.ph_status,
        organic_matter_status: aiResponse.organic_matter_status,
        deficiencies: aiResponse.deficiencies,
        toxicities: aiResponse.toxicities,
        recommendations: aiResponse.recommendations
      },
      nutrient_levels: {
        nitrogen: {
          measured: labResults.nitrogen,
          status: aiResponse.nitrogen_status,
          optimal_range: aiResponse.nitrogen_optimal,
          recommendation: aiResponse.nitrogen_recommendation
        },
        phosphorus: {
          measured: labResults.phosphorus,
          status: aiResponse.phosphorus_status,
          optimal_range: aiResponse.phosphorus_optimal,
          recommendation: aiResponse.phosphorus_recommendation
        },
        potassium: {
          measured: labResults.potassium,
          status: aiResponse.potassium_status,
          optimal_range: aiResponse.potassium_optimal,
          recommendation: aiResponse.potassium_recommendation
        },
        calcium: {
          measured: labResults.calcium,
          status: aiResponse.calcium_status,
          optimal_range: aiResponse.calcium_optimal,
          recommendation: aiResponse.calcium_recommendation
        },
        magnesium: {
          measured: labResults.magnesium,
          status: aiResponse.magnesium_status,
          optimal_range: aiResponse.magnesium_optimal,
          recommendation: aiResponse.magnesium_recommendation
        },
        sulfur: {
          measured: labResults.sulfur,
          status: aiResponse.sulfur_status,
          optimal_range: aiResponse.sulfur_optimal,
          recommendation: aiResponse.sulfur_recommendation
        },
        iron: {
          measured: labResults.iron,
          status: aiResponse.iron_status,
          optimal_range: aiResponse.iron_optimal,
          recommendation: aiResponse.iron_recommendation
        },
        zinc: {
          measured: labResults.zinc,
          status: aiResponse.zinc_status,
          optimal_range: aiResponse.zinc_optimal,
          recommendation: aiResponse.zinc_recommendation
        },
        boron: {
          measured: labResults.boron,
          status: aiResponse.boron_status,
          optimal_range: aiResponse.boron_optimal,
          recommendation: aiResponse.boron_recommendation
        },
        manganese: {
          measured: labResults.manganese,
          status: aiResponse.manganese_status,
          optimal_range: aiResponse.manganese_optimal,
          recommendation: aiResponse.manganese_recommendation
        },
        copper: {
          measured: labResults.copper,
          status: aiResponse.copper_status,
          optimal_range: aiResponse.copper_optimal,
          recommendation: aiResponse.copper_recommendation
        }
      },
      ph_analysis: {
        measured: labResults.ph,
        status: aiResponse.ph_status,
        optimal_range: aiResponse.ph_optimal,
        amendment_needed: aiResponse.ph_amendment_needed,
        amendment_recommendation: aiResponse.ph_amendment
      },
      organic_matter: {
        measured: labResults.organic_matter,
        status: aiResponse.organic_matter_status,
        optimal_range: aiResponse.organic_matter_optimal,
        improvement_needed: aiResponse.organic_improvement_needed,
        improvement_recommendation: aiResponse.organic_improvement
      },
      soil_texture: {
        sand: labResults.sand_percentage,
        silt: labResults.silt_percentage,
        clay: labResults.clay_percentage,
        texture_class: aiResponse.texture_class,
        water_holding_capacity: aiResponse.water_holding_capacity,
        drainage: aiResponse.drainage
      },
      confidence: aiResponse.confidence
    };

    // Update sample status
    sample.status = 'analyzed';
    sample.analysis = analysis;
    sample.analyzed_at = new Date().toISOString();

    logger.info(`Soil test results processed: ${sampleId}`);
    return analysis;
  } catch (error) {
    logger.error('Error processing soil test results', { error: error.message, stack: error.stack });
    throw new Error('Failed to process soil test results');
  }
}

/**
 * Generate custom fertilizer recommendation
 */
async function generateFertilizerRecommendation(sampleId, additionalParams) {
  try {
    const sample = await getSoilSample(sampleId);
    const analysis = sample.analysis;

    const {
      crop_type,
      variety,
      planting_date,
      expected_yield,
      farming_method, // organic, conventional, integrated
      budget_constraint,
      availability_preference
    } = additionalParams;

    // AI-powered fertilizer recommendation
    const aiRequest = {
      task: 'fertilizer_recommendation',
      parameters: {
        sample_id: sampleId,
        soil_analysis: analysis,
        crop_type: crop_type,
        variety: variety,
        planting_date: planting_date,
        expected_yield: expected_yield,
        farming_method: farming_method,
        budget_constraint: budget_constraint,
        availability_preference: availability_preference,
        crop_nutrient_requirements: await getCropNutrientRequirements(crop_type),
        regional_fertilizer_availability: await getFertilizerAvailability(sample.state),
        government_subsidies: await getFertilizerSubsidies(sample.state),
        organic_alternatives: await getOrganicAlternatives(crop_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const recommendation = {
      recommendation_id: generateId(),
      sample_id: sampleId,
      timestamp: new Date().toISOString(),
      crop_details: {
        crop_type: crop_type,
        variety: variety,
        expected_yield: expected_yield,
        farming_method: farming_method
      },
      fertilizer_plan: aiResponse.fertilizer_plan.map(stage => ({
        stage: stage.stage,
        timing: stage.timing,
        fertilizers: stage.fertilizers.map(fert => ({
          fertilizer_name: fert.name,
          brand: fert.brand,
          quantity_per_hectare: fert.quantity,
          total_quantity: fert.total_quantity,
          cost_per_unit: fert.cost,
          total_cost: fert.total_cost,
          nutrient_content: fert.nutrient_content,
          application_method: fert.application_method,
          subsidy_eligible: fert.subsidy_eligible,
          subsidy_amount: fert.subsidy_amount,
          net_cost: fert.net_cost
        })),
        stage_cost: stage.stage_cost,
        stage_subsidy: stage.stage_subsidy
      })),
      total_cost: aiResponse.total_cost,
      total_subsidy: aiResponse.total_subsidy,
      net_cost: aiResponse.net_cost,
      nutrient_balance: aiResponse.nutrient_balance,
      application_schedule: aiResponse.application_schedule,
      precautions: aiResponse.precautions,
      expected_yield_impact: aiResponse.yield_impact,
      cost_benefit_analysis: aiResponse.cost_benefit,
      alternatives: aiResponse.alternatives,
      confidence: aiResponse.confidence
    };

    logger.info(`Fertilizer recommendation generated: ${recommendation.recommendation_id}`);
    return recommendation;
  } catch (error) {
    logger.error('Error generating fertilizer recommendation', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate fertilizer recommendation');
  }
}

/**
 * Track soil sample status
 */
async function trackSoilSample(sampleId) {
  try {
    const sample = await getSoilSample(sampleId);

    const status = {
      sample_id: sampleId,
      tracking_number: sample.tracking_number,
      current_status: sample.status,
      submitted_at: sample.submitted_at,
      timeline: [
        {
          stage: 'submitted',
          date: sample.submitted_at,
          completed: true
        },
        {
          stage: 'lab_received',
          date: sample.lab_received_at,
          completed: !!sample.lab_received_at
        },
        {
          stage: 'testing',
          date: sample.testing_started_at,
          completed: !!sample.testing_started_at
        },
        {
          stage: 'analyzed',
          date: sample.analyzed_at,
          completed: !!sample.analyzed_at
        },
        {
          stage: 'report_ready',
          date: sample.report_ready_at,
          completed: !!sample.report_ready_at
        }
      ],
      assigned_lab: sample.assigned_lab,
      estimated_completion: sample.estimated_completion_date,
      current_stage: getCurrentStage(sample),
      next_milestone: getNextMilestone(sample)
    };

    return status;
  } catch (error) {
    logger.error('Error tracking soil sample', { error: error.message, stack: error.stack });
    throw new Error('Failed to track soil sample');
  }
}

/**
 * Get soil health card
 */
async function getSoilHealthCard(farmerId, farmId) {
  try {
    const healthCard = {
      farmer_id: farmerId,
      farm_id: farmId,
      issued_date: new Date().toISOString(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      soil_samples: await getFarmerSoilSamples(farmerId, farmId),
      overall_health_score: 0,
      recommendations: [],
      historical_trends: await getSoilHealthTrends(farmerId, farmId)
    };

    // Calculate overall health score from recent samples
    if (healthCard.soil_samples.length > 0) {
      const latestSample = healthCard.soilSamples[0];
      if (latestSample.analysis) {
        healthCard.overall_health_score = latestSample.analysis.ai_analysis.overall_soil_health;
        healthCard.recommendations = latestSample.analysis.ai_analysis.recommendations;
      }
    }

    return healthCard;
  } catch (error) {
    logger.error('Error getting soil health card', { error: error.message, stack: error.stack });
    throw new Error('Failed to get soil health card');
  }
}

/**
 * Get integrated nutrient management plan
 */
async function getIntegratedNutrientManagementPlan(sampleId, cropDetails) {
  try {
    const sample = await getSoilSample(sampleId);
    const fertilizerRec = await generateFertilizerRecommendation(sampleId, cropDetails);

    const inpPlan = {
      plan_id: generateId(),
      sample_id: sampleId,
      timestamp: new Date().toISOString(),
      soil_analysis: sample.analysis,
      fertilizer_recommendation: fertilizerRec,
      integrated_approach: {
        organic_amendments: await getOrganicAmendments(sample.state, cropDetails.crop_type),
        biofertilizers: await getBiofertilizers(cropDetails.crop_type),
        green_manuring: await getGreenManuringOptions(cropDetails.crop_type),
        crop_rotation: await getCropRotationRecommendations(sample.state, cropDetails.crop_type),
        water_management: await getWaterManagementRecommendations(sample.irrigation_type)
      },
      sustainability_metrics: {
        carbon_footprint: await calculateCarbonFootprint(fertilizerRec),
        soil_health_impact: await assessSoilHealthImpact(fertilizerRec),
        water_efficiency: await assessWaterEfficiency(cropDetails.irrigation_type),
        biodiversity_impact: await assessBiodiversityImpact(fertilizerRec)
      },
      monitoring_schedule: await getMonitoringSchedule(cropDetails.crop_type),
      confidence: fertilizerRec.confidence
    };

    return inpPlan;
  } catch (error) {
    logger.error('Error getting INM plan', { error: error.message, stack: error.stack });
    throw new Error('Failed to get integrated nutrient management plan');
  }
}

// Helper functions
function generateId() {
  return `SOIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTrackingNumber() {
  return `ST-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

async function assignToLab(sample) {
  // Assign to nearest NABL accredited lab
  return {
    lab_id: 'LAB-001',
    lab_name: 'North East Soil Testing Laboratory',
    location: 'Guwahati',
    nabl_accredited: true,
    contact: '+91-9876543210'
  };
}

function calculateEstimatedCompletion() {
  // Typically 7-10 days
  return new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
}

async function getSoilSample(sampleId) {
  // Fetch from database
  return {};
}

async function getSoilStandards(state) {
  // Get regional soil standards
  return {};
}

async function getRegionalRecommendations(state, district) {
  // Get regional recommendations
  return {};
}

async function getCropNutrientRequirements(cropType) {
  // Get crop-specific nutrient requirements
  return {};
}

async function getFertilizerAvailability(state) {
  // Get fertilizer availability in state
  return {};
}

async function getFertilizerSubsidies(state) {
  // Get fertilizer subsidy schemes
  return [];
}

async function getOrganicAlternatives(cropType) {
  // Get organic alternatives
  return [];
}

async function getFarmerSoilSamples(farmerId, farmId) {
  // Get farmer's soil samples
  return [];
}

async function getSoilHealthTrends(farmerId, farmId) {
  // Get soil health trends over time
  return [];
}

function getCurrentStage(sample) {
  // Get current stage
  return 'submitted';
}

function getNextMilestone(sample) {
  // Get next milestone
  return 'lab_received';
}

async function getOrganicAmendments(state, cropType) {
  // Get organic amendments
  return [];
}

/**
 * compostPlan wrapper — circular-economy organic-input planning, real data.
 *
 * Ported from v42 (docs/MISSING_BUSINESS_LOGIC_EXTRACTION.md #6). The
 * prototype scaled a hardcoded COMPOST_RATES object (Vermicompost/Farmyard
 * Manure/Neem Cake/Bone Meal/Rock Phosphate) by acreage and a soil-condition
 * multiplier. Real per-acre base rates are organic_input_rates
 * (992_v42_recovered_intelligence.sql) — decisionSupportService.compostPlan()
 * hardcodes its COMPOST_RATES internally with no way to inject real rates,
 * and per instruction decisionSupportService.js is not touched, so the rate
 * lookup happens here directly rather than through that function. What is
 * NOT allowed to drift — the soil-condition multiplier logic — is
 * reproduced verbatim from the original/decisionSupportService copy: same
 * three conditions, same 1.15 / 1.0 / 0.85 multipliers, same
 * round-to-2-decimals arithmetic. Only the source of the base per-acre
 * quantities changes (real organic_input_rates rows instead of the mock
 * COMPOST_RATES list), which is why the returned item set differs from the
 * original five (Vermicompost/Neem cake/Jeevamrut/Biopesticide, per the
 * actual seeded rows) — same shape, same math, real inventory.
 */
async function getOrganicInputPlan(crop, acres, soilCond) {
  const SOIL_ADJUST = {
    'Looks tired / low yield': { mult: 1.15, note: 'Slightly higher organic matter dressing' },
    'Normal / average': { mult: 1.0, note: 'Standard base dressing' },
    'Recently fallow / rested': { mult: 0.85, note: 'Lower dressing — residual fertility likely still present' }
  };

  const acreage = Number(acres) || 0;
  const soilAdjustment = SOIL_ADJUST[soilCond] || SOIL_ADJUST['Normal / average'];
  const mult = soilAdjustment.mult;

  try {
    const pg = getPostgreSQL();
    const { rows } = await pg.query(
      'SELECT input_name, quantity, unit, agronomic_role, basis FROM organic_input_rates ORDER BY input_name'
    );

    const plan = rows.map((r) => ({
      name: r.input_name,
      qty: Math.round(Number(r.quantity) * acreage * mult * 100) / 100,
      unit: r.unit,
      role: r.agronomic_role,
      basis: r.basis
    }));

    return {
      crop: crop || null,
      acres: acreage,
      soilCond: soilCond || 'Normal / average',
      soilAdjustmentNote: soilAdjustment.note,
      multiplier: mult,
      plan
    };
  } catch (error) {
    logger.error('Error building organic input plan', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function getBiofertilizers(cropType) {
  // Get biofertilizers
  return [];
}

async function getGreenManuringOptions(cropType) {
  // Get green manuring options
  return [];
}

async function getCropRotationRecommendations(state, cropType) {
  // Get crop rotation recommendations
  return [];
}

async function getWaterManagementRecommendations(irrigationType) {
  // Get water management recommendations
  return {};
}

async function calculateCarbonFootprint(fertilizerRec) {
  // Calculate carbon footprint
  return {};
}

async function assessSoilHealthImpact(fertilizerRec) {
  // Assess soil health impact
  return {};
}

async function assessWaterEfficiency(irrigationType) {
  // Assess water efficiency
  return {};
}

async function assessBiodiversityImpact(fertilizerRec) {
  // Assess biodiversity impact
  return {};
}

async function getMonitoringSchedule(cropType) {
  // Get monitoring schedule
  return {};
}

// Express routes setup
function setupRoutes(app) {
  app.post('/api/v1/soil-testing/samples', authMiddleware, async (req, res) => {
    try {
      const sample = await submitSoilSample(req.body);
      res.json({ success: true, data: sample });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/soil-testing/samples/:id/results', authMiddleware, async (req, res) => {
    try {
      const analysis = await processSoilTestResults(req.params.id, req.body);
      res.json({ success: true, data: analysis });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/soil-testing/samples/:id/fertilizer-recommendation', authMiddleware, async (req, res) => {
    try {
      const recommendation = await generateFertilizerRecommendation(req.params.id, req.body);
      res.json({ success: true, data: recommendation });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/soil-testing/samples/:id/track', async (req, res) => {
    try {
      const status = await trackSoilSample(req.params.id);
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/soil-testing/health-card', async (req, res) => {
    try {
      const healthCard = await getSoilHealthCard(req.query.farmer_id, req.query.farm_id);
      res.json({ success: true, data: healthCard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/soil-testing/inm-plan/:sampleId', async (req, res) => {
    try {
      const inpPlan = await getIntegratedNutrientManagementPlan(req.params.sampleId, req.query);
      res.json({ success: true, data: inpPlan });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Circular-economy organic-input plan — real organic_input_rates data (see getOrganicInputPlan above)
  app.get('/api/v1/soil-testing/organic-input-plan', async (req, res) => {
    try {
      const { crop, acres, soil_condition: soilCondition } = req.query;
      const plan = await getOrganicInputPlan(crop, acres, soilCondition);
      res.json({ success: true, data: plan });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  submitSoilSample,
  processSoilTestResults,
  generateFertilizerRecommendation,
  trackSoilSample,
  getSoilHealthCard,
  getIntegratedNutrientManagementPlan,
  getOrganicInputPlan,
  setupRoutes
};
