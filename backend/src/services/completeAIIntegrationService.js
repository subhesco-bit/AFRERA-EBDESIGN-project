/**
 * AFRERA Complete AI Integration Service
 * 
 * Comprehensive AI integration with all agricultural modules:
 * - Farmer Module (crop planning, harvesting, field management)
 * - Crop Module (crop lifecycle, yield management, quality control)
 * - Livestock Module (animal health, breeding, production)
 * - All Inbuilt Modules (Dairy, Poultry, Goat, Sheep, Pig, etc.)
 * 
 * This service ensures that all agricultural operations have AI capabilities:
 * - Predictive analytics for farming decisions
 * - Disease detection and prevention
 * - Yield prediction and optimization
 * - Resource optimization
 * - Risk assessment and mitigation
 * - Personalized recommendations
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { signalBus } = require('../core/signalBus');

// ============================================================================
// FARMER MODULE AI INTEGRATION
// ============================================================================

/**
 * AI-powered crop planning recommendation for farmers
 */
async function recommendCropPlanning(farmerId, farmData) {
  const pg = getPostgreSQL();
  
  try {
    // Get farmer's historical crop data
    const historicalData = await pg.query(`
      SELECT 
        crop_type,
        yield_per_hectare,
        planting_date,
        harvest_date,
        weather_conditions,
        soil_type,
        profit_margin
      FROM farmer_crop_plans
      WHERE farmer_id = $1
      ORDER BY planting_date DESC
      LIMIT 5
    `, [farmerId]);
    
    // Get field data
    const fieldData = await pg.query(`
      SELECT 
        soil_type,
        soil_ph,
        soil_organic_matter,
        irrigation_type,
        last_crop,
        field_size
      FROM farmer_fields
      WHERE farmer_id = $1
    `, [farmerId]);
    
    // Get market data for pricing
    const marketData = await pg.query(`
      SELECT 
        crop_type,
        market_price,
        demand_trend,
        seasonality
      FROM market_intelligence
      WHERE active = true
    `);
    
    // AI recommendation algorithm
    const recommendations = [];
    
    const crops = ['rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'vegetables'];
    
    for (const crop of crops) {
      const recommendation = {
        crop_type: crop,
        recommended_action: 'plant',
        confidence_score: 0,
        expected_yield: 0,
        expected_profit: 0,
        risk_level: 'medium',
        planting_window: 'optimal',
        resource_requirements: {
          seeds: 0,
          fertilizers: 0,
          water: 0,
          labor: 0
        },
        ai_reasoning: ''
      };
      
      // Calculate recommendation score based on historical performance
      const historicalCrop = historicalData.rows.find(h => h.crop_type === crop);
      if (historicalCrop) {
        recommendation.confidence_score += 0.3;
        recommendation.expected_yield = historicalCrop.yield_per_hectare;
        recommendation.expected_profit = historicalCrop.profit_margin;
      }
      
      // Calculate based on field suitability
      const fieldSuitability = calculateFieldSuitability(fieldData.rows[0], crop);
      recommendation.confidence_score += fieldSuitability * 0.4;
      
      // Calculate based on market conditions
      const marketCondition = calculateMarketCondition(marketData.rows, crop);
      recommendation.confidence_score += marketCondition * 0.3;
      
      // Calculate resource requirements
      recommendation.resource_requirements = calculateResourceRequirements(fieldData.rows[0], crop);
      
      // Determine risk level
      recommendation.risk_level = determineRiskLevel(recommendation.confidence_score, historicalCrop);
      
      // Generate AI reasoning
      recommendation.ai_reasoning = generateAIReasoning(recommendation, historicalCrop, fieldSuitability, marketCondition);
      
      recommendations.push(recommendation);
    }
    
    // Sort by confidence score
    recommendations.sort((a, b) => b.confidence_score - a.confidence_score);
    
    // Emit signal bus event
    await signalBus.emit('ai.farmer.crop_planning.recommended', {
      farmer_id: farmerId,
      recommendations,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI crop planning recommendation generated', { farmerId, recommendationCount: recommendations.length });
    
    return {
      success: true,
      recommendations
    };
  } catch (error) {
    logger.error('Error generating AI crop planning recommendation', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * AI-powered harvest timing prediction
 */
async function predictHarvestTiming(farmerId, cropData) {
  const pg = getPostgreSQL();
  
  try {
    // Get historical harvest data
    const historicalHarvests = await pg.query(`
      SELECT 
        crop_type,
        planting_date,
        harvest_date,
        yield_quantity,
        quality_grade,
        weather_conditions
      FROM farmer_harvests
      WHERE farmer_id = $1
      ORDER BY harvest_date DESC
      LIMIT 10
    `, [farmerId]);
    
    // Get weather forecast data
    const weatherForecast = await getWeatherForecast(cropData.location);
    
    // Get crop growth stage
    const growthStage = await determineCropGrowthStage(cropData.crop_id);
    
    // Calculate optimal harvest timing
    const optimalHarvestDate = calculateOptimalHarvestDate(historicalHarvests.rows, weatherForecast, growthStage);
    
    // Calculate expected yield and quality
    const expectedYield = calculateExpectedYield(cropData, growthStage, weatherForecast);
    const expectedQuality = calculateExpectedQuality(cropData, growthStage, weatherForecast);
    
    // Market price prediction at harvest time
    const marketPricePrediction = await predictMarketPriceAtDate(cropData.crop_type, optimalHarvestDate);
    
    const prediction = {
      crop_id: cropData.crop_id,
      farmer_id: farmerId,
      crop_type: cropData.crop_type,
      current_growth_stage: growthStage,
      optimal_harvest_date: optimalHarvestDate,
      expected_yield: expectedYield,
      expected_quality: expectedQuality,
      predicted_market_price: marketPricePrediction,
      confidence_score: calculateYieldConfidence(historicalHarvests.rows.length, { plant_health: growthStage }, weatherForecast),
      risk_factors: ['weather_uncertainty', 'pest_disease_risk'],
      ai_recommendations: [
        'Monitor for pest outbreaks',
        'Schedule pre-harvest inspection',
        'Arrange storage facilities'
      ]
    };
    
    // Emit signal bus event
    await signalBus.emit('ai.farmer.harvest_timing.predicted', {
      farmer_id: farmerId,
      prediction,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI harvest timing prediction generated', { farmerId, optimalHarvestDate });
    
    return {
      success: true,
      prediction
    };
  } catch (error) {
    logger.error('Error predicting harvest timing', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * AI-powered resource optimization for farmer
 */
async function optimizeFarmerResources(farmerId, resourceData) {
  const pg = getPostgreSQL();
  
  try {
    // Get current resource usage
    const currentResources = await pg.query(`
      SELECT 
        resource_type,
        current_usage,
        available_capacity,
        cost_per_unit,
        efficiency_score
      FROM farmer_resources
      WHERE farmer_id = $1
    `, [farmerId]);
    
    // Get planned activities
    const plannedActivities = await pg.query(`
      SELECT 
        activity_type,
        required_resources,
        timeline,
        priority
      FROM farmer_activities
      WHERE farmer_id = $1 AND status = 'planned'
    `, [farmerId]);
    
    // AI optimization algorithm
    const optimization = {
      farmer_id: farmerId,
      current_resources: currentResources.rows,
      planned_activities: plannedActivities.rows,
      optimization_strategy: 'efficiency_first',
      recommendations: [],
      expected_savings: 0,
      efficiency_improvement: 0
    };
    
    // Calculate resource optimization recommendations
    for (const resource of currentResources.rows) {
      const recommendation = {
        resource_type: resource.resource_type,
        current_usage: resource.current_usage,
        recommended_usage: resource.current_usage,
        efficiency_score: resource.efficiency_score,
        optimization_action: 'maintain',
        expected_savings: 0,
        reasoning: ''
      };
      
      // Analyze usage patterns
      if (resource.efficiency_score < 0.6) {
        recommendation.optimization_action = 'reduce';
        recommendation.recommended_usage = resource.current_usage * 0.8;
        recommendation.expected_savings = (resource.current_usage - recommendation.recommended_usage) * resource.cost_per_unit;
        recommendation.reasoning = `Low efficiency score (${resource.efficiency_score}) - reduce usage to improve efficiency`;
        optimization.expected_savings += recommendation.expected_savings;
        optimization.efficiency_improvement += 0.1;
      } else if (resource.efficiency_score > 0.8) {
        recommendation.optimization_action = 'expand';
        recommendation.recommended_usage = resource.current_usage * 1.2;
        recommendation.reasoning = `High efficiency score (${resource.efficiency_score}) - expand usage to maximize returns`;
      }
      
      optimization.recommendations.push(recommendation);
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.farmer.resources.optimized', {
      farmer_id: farmerId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI farmer resource optimization generated', { farmerId, expectedSavings: optimization.expected_savings });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing farmer resources', { error: error.message, farmerId });
    throw error;
  }
}

// ============================================================================
// CROP MODULE AI INTEGRATION
// ============================================================================

/**
 * Symptom overlap ratio between a reported symptom list and a candidate
 * disease's known symptom list (Jaccard similarity, case/whitespace
 * normalized). Was called but never defined anywhere in this file -
 * detectCropDisease() below threw ReferenceError on every call. This is a
 * plain set-overlap score, not a trained classifier; there is no ML model
 * or labeled training data backing "AI-powered" here.
 *
 * NOTE: detectCropDisease() also queries crop_health_monitoring and
 * crop_disease_database, neither of which exists in any migration - fixing
 * this function makes the ReferenceError go away, but the query above it
 * will still fail against a real database until those tables are added.
 * That's a separate, larger gap (new schema + seed data) out of scope here.
 */
function calculateSymptomMatch(reportedSymptoms, knownSymptoms) {
  const normalize = (list) => new Set(
    (Array.isArray(list) ? list : [])
      .filter((s) => typeof s === 'string' && s.trim())
      .map((s) => s.trim().toLowerCase())
  );

  const reported = normalize(reportedSymptoms);
  const known = normalize(knownSymptoms);
  if (reported.size === 0 || known.size === 0) return 0;

  let intersectionSize = 0;
  for (const symptom of reported) {
    if (known.has(symptom)) intersectionSize++;
  }
  const unionSize = new Set([...reported, ...known]).size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * AI-powered disease detection for crops
 */
async function detectCropDisease(cropId, diseaseData) {
  const pg = getPostgreSQL();
  
  try {
    // Get crop health data
    const cropHealth = await pg.query(`
      SELECT 
        crop_id,
        health_status,
        symptoms,
        environmental_conditions,
        pest_pressure,
        disease_pressure
      FROM crop_health_monitoring
      WHERE crop_id = $1
    `, [cropId]);
    
    // Get disease database
    const diseaseDatabase = await pg.query(`
      SELECT 
        disease_name,
        symptoms,
        causes,
        treatment_recommendations,
        prevention_methods,
        severity_level
      FROM crop_disease_database
    `);
    
    // AI disease detection algorithm
    const detection = {
      crop_id: cropId,
      detected_diseases: [],
      confidence_score: 0,
      risk_level: 'low',
      recommended_actions: [],
      severity_assessment: 'healthy'
    };
    
    // Analyze symptoms against disease database
    for (const disease of diseaseDatabase.rows) {
      const symptomMatch = calculateSymptomMatch(diseaseData.symptoms, disease.symptoms);
      
      if (symptomMatch > 0.6) {
        detection.detected_diseases.push({
          disease_name: disease.disease_name,
          confidence_score: symptomMatch,
          severity_level: disease.severity_level,
          treatment_recommendations: disease.treatment_recommendations,
          prevention_methods: disease.prevention_methods
        });
        
        detection.confidence_score = Math.max(detection.confidence_score, symptomMatch);
        
        if (disease.severity_level === 'high') {
          detection.risk_level = 'critical';
          detection.severity_assessment = 'critical';
        } else if (disease.severity_level === 'medium') {
          detection.risk_level = 'high';
          detection.severity_assessment = 'infected';
        }
      }
    }
    
    // Generate recommended actions
    if (detection.detected_diseases.length > 0) {
      detection.recommended_actions = [
        'Isolate affected area',
        'Apply recommended treatment',
        'Monitor crop health daily',
        'Notify extension services'
      ];
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.crop.disease.detected', {
      crop_id: cropId,
      detection,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI crop disease detection completed', { cropId, diseasesDetected: detection.detected_diseases.length });
    
    return {
      success: true,
      detection
    };
  } catch (error) {
    logger.error('Error detecting crop disease', { error: error.message, cropId });
    throw error;
  }
}

/**
 * AI-powered yield prediction for crops
 */
async function predictCropYield(cropId, yieldData) {
  const pg = getPostgreSQL();
  
  try {
    // Get historical yield data
    const historicalYield = await pg.query(`
      SELECT 
        crop_type,
        planting_date,
        harvest_date,
        yield_per_hectare,
        quality_grade,
        weather_conditions,
        soil_conditions,
        fertilization_level
      FROM crop_yield_records
      WHERE crop_id = $1
      ORDER BY harvest_date DESC
      LIMIT 5
    `, [cropId]);
    
    // Get current crop status
    const currentStatus = await pg.query(`
      SELECT 
        growth_stage,
        plant_health,
        stress_factors,
        nutrient_levels
      FROM crop_lifecycle
      WHERE crop_id = $1
    `, [cropId]);
    
    // Get weather forecast
    const weatherForecast = await getWeatherForecast(yieldData.location);
    
    // AI yield prediction algorithm
    const prediction = {
      crop_id: cropId,
      predicted_yield: 0,
      confidence_score: 0,
      yield_per_hectare: 0,
      quality_grade: 'unknown',
      risk_factors: [],
      optimization_recommendations: []
    };
    
    // Calculate yield based on historical data
    if (historicalYield.rows.length > 0) {
      const avgYield = historicalYield.rows.reduce((sum, record) => sum + record.yield_per_hectare, 0) / historicalYield.rows.length;
      prediction.yield_per_hectare = avgYield;
    }
    
    // Adjust based on current conditions
    const currentCondition = currentStatus.rows[0];
    if (currentCondition) {
      const healthMultiplier = currentCondition.plant_health === 'excellent' ? 1.1 : 
                            currentCondition.plant_health === 'good' ? 1.0 :
                            currentCondition.plant_health === 'fair' ? 0.9 : 0.8;
      
      prediction.yield_per_hectare *= healthMultiplier;
    }
    
    // Adjust based on weather forecast
    const weatherMultiplier = calculateWeatherMultiplier(weatherForecast);
    prediction.yield_per_hectare *= weatherMultiplier;
    
    // Calculate total yield
    const cropArea = yieldData.area_hectares || 1;
    prediction.predicted_yield = prediction.yield_per_hectare * cropArea;
    
    // Predict quality grade
    prediction.quality_grade = predictQualityGrade(currentCondition, weatherForecast);
    
    // Calculate confidence score
    prediction.confidence_score = calculateYieldConfidence(historicalYield.rows.length, currentCondition, weatherForecast);
    
    // Generate optimization recommendations
    if (prediction.confidence_score < 0.7) {
      prediction.optimization_recommendations = [
        'Consider irrigation adjustment',
        'Review fertilization schedule',
        'Monitor pest pressure'
      ];
    }
    
    // Identify risk factors
    prediction.risk_factors = identifyYieldRiskFactors(currentCondition, weatherForecast);
    
    // Emit signal bus event
    await signalBus.emit('ai.crop.yield.predicted', {
      crop_id: cropId,
      prediction,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI crop yield prediction completed', { cropId, predictedYield: prediction.predicted_yield });
    
    return {
      success: true,
      prediction
    };
  } catch (error) {
    logger.error('Error predicting crop yield', { error: error.message, cropId });
    throw error;
  }
}

// ============================================================================
// LIVESTOCK MODULE AI INTEGRATION
// ============================================================================

/**
 * AI-powered livestock health monitoring
 */
async function monitorLivestockHealth(livestockId, healthData) {
  const pg = getPostgreSQL();
  
  try {
    // Get livestock health history
    const healthHistory = await pg.query(`
      SELECT 
        livestock_id,
        health_status,
        weight,
        temperature,
        feed_intake,
        activity_level,
        symptoms,
        vet_visits
      FROM livestock_health_records
      WHERE livestock_id = $1
      ORDER BY recorded_at DESC
      LIMIT 10
    `, [livestockId]);
    
    // Get livestock data
    const livestock = await pg.query(`
      SELECT 
        livestock_id,
        breed,
        age,
        production_stage,
        environment,
        feeding_regime
      FROM livestock_inventory
      WHERE livestock_id = $1
    `, [livestockId]);
    
    // AI health monitoring algorithm
    const monitoring = {
      livestock_id: livestockId,
      current_health_status: 'healthy',
      health_trend: 'stable',
      risk_factors: [],
      recommended_actions: [],
      next_vet_visit: null,
      feeding_adjustments: [],
      environmental_recommendations: []
    };
    
    // Analyze health trends
    if (healthHistory.rows.length > 1) {
      const recentHealth = healthHistory.rows[0].health_status;
      const previousHealth = healthHistory.rows[1].health_status;
      
      if (recentHealth !== previousHealth) {
        monitoring.health_trend = recentHealth === 'improving' ? 'positive' : 'negative';
      }
    }
    
    // Identify risk factors
    const currentHealth = healthHistory.rows[0];
    if (currentHealth) {
      if (currentHealth.temperature > 39) {
        monitoring.risk_factors.push('elevated_temperature');
        monitoring.current_health_status = 'attention_needed';
      }
      
      if (currentHealth.activity_level < 0.5) {
        monitoring.risk_factors.push('low_activity');
        monitoring.current_health_status = 'at_risk';
      }
      
      if (currentHealth.feed_intake < 0.7) {
        monitoring.risk_factors.push('reduced_feed_intake');
        monitoring.recommended_actions.push('Adjust feeding schedule');
      }
    }
    
    // Generate recommended actions
    if (monitoring.risk_factors.length > 0) {
      monitoring.recommended_actions.push('Schedule veterinary examination');
      monitoring.next_vet_visit = calculateNextVetVisit(livestockId, monitoring.current_health_status);
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.livestock.health.monitored', {
      livestock_id: livestockId,
      monitoring,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI livestock health monitoring completed', { livestockId, healthStatus: monitoring.current_health_status });
    
    return {
      success: true,
      monitoring
    };
  } catch (error) {
    logger.error('Error monitoring livestock health', { error: error.message, livestockId });
    throw error;
  }
}

/**
 * AI-powered breeding recommendation for livestock
 */
async function recommendLivestockBreeding(livestockId, breedingData) {
  const pg = getPostgreSQL();
  
  try {
    // Get livestock inventory
    const livestock = await pg.query(`
      SELECT 
        livestock_id,
        breed,
        age,
        sex,
        genetic_quality,
        production_performance,
        health_status
      FROM livestock_inventory
      WHERE livestock_id = $1
    `, [livestockId]);
    
    // Get breeding records
    const breedingHistory = await pg.query(`
      SELECT 
        livestock_id,
        breeding_partner_id,
        offspring_count,
        offspring_quality,
        breeding_date,
        success_rate
      FROM livestock_breeding_records
      WHERE livestock_id = $1
      ORDER BY breeding_date DESC
      LIMIT 5
    `, [livestockId]);
    
    // AI breeding recommendation algorithm
    const recommendation = {
      livestock_id: livestockId,
      recommended_action: 'breed',
      confidence_score: 0,
      recommended_partners: [],
      expected_offspring_quality: 'good',
      breeding_timeline: 'optimal',
      risk_factors: []
    };
    
    // Calculate breeding suitability
    const livestockData = livestock.rows[0];
    const breedingSuitability = calculateBreedingSuitability(livestockData);
    recommendation.confidence_score = breedingSuitability;
    
    // Find compatible breeding partners
    const potentialPartners = await findCompatibleBreedingPartners(livestockData);
    recommendation.recommended_partners = potentialPartners;
    
    // Calculate expected offspring quality
    recommendation.expected_offspring_quality = predictOffspringQuality(livestockData, potentialPartners);
    
    // Generate breeding timeline
    recommendation.breeding_timeline = determineBreedingTimeline(livestockData.age, livestockData.sex);
    
    // Identify risk factors
    recommendation.risk_factors = identifyBreedingRisks(livestockData, breedingHistory.rows);
    
    // Emit signal bus event
    await signalBus.emit('ai.livestock.breeding.recommended', {
      livestock_id: livestockId,
      recommendation,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI livestock breeding recommendation generated', { livestockId, confidenceScore: recommendation.confidence_score });
    
    return {
      success: true,
      recommendation
    };
  } catch (error) {
    logger.error('Error recommending livestock breeding', { error: error.message, livestockId });
    throw error;
  }
}

// ============================================================================
// INBUILT MODULES AI INTEGRATION
// ============================================================================

/**
 * AI-powered dairy production optimization
 */
async function optimizeDairyProduction(dairyId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get dairy production data
    const production = await pg.query(`
      SELECT 
        dairy_id,
        milk_production,
        feed_efficiency,
        animal_health,
        environmental_conditions,
        product_mix
      FROM dairy_production_records
      WHERE dairy_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `, [dairyId]);
    
    // AI optimization algorithm
    const optimization = {
      dairy_id: dairyId,
      current_efficiency: 0,
      optimized_feed_mix: {},
      expected_milk_increase: 0,
      cost_reduction: 0,
      health_improvement_actions: []
    };
    
    // Calculate current efficiency
    if (production.rows.length > 0) {
      const recentProduction = production.rows[0];
      optimization.current_efficiency = recentProduction.feed_efficiency;
    }
    
    // Optimize feed mix
    optimization.optimized_feed_mix = calculateOptimalFeedMix(productionData);
    
    // Calculate expected milk increase
    optimization.expected_milk_increase = calculateExpectedMilkIncrease(optimization.current_efficiency, optimization.optimized_feed_mix);
    
    // Calculate cost reduction
    optimization.cost_reduction = calculateFeedCostReduction(optimization.optimized_feed_mix);
    
    // Generate health improvement actions
    optimization.health_improvement_actions = [
      'Implement regular health checks',
      'Adjust milking schedule',
      'Improve housing conditions'
    ];
    
    // Emit signal bus event
    await signalBus.emit('ai.dairy.production.optimized', {
      dairy_id: dairyId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI dairy production optimization completed', { dairyId, efficiencyImprovement: optimization.current_efficiency });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing dairy production', { error: error.message, dairyId });
    throw error;
  }
}

/**
 * AI-powered poultry health monitoring
 */
async function monitorPoultryHealth(poultryId, healthData) {
  const pg = getPostgreSQL();
  
  try {
    // Get poultry health data
    const health = await pg.query(`
      SELECT 
        poultry_id,
        health_status,
        mortality_rate,
        disease_outbreaks,
        feed_conversion_rate,
        environmental_conditions
      FROM poultry_health_monitoring
      WHERE poultry_id = $1
    `, [poultryId]);
    
    // AI health monitoring algorithm
    const monitoring = {
      poultry_id: poultryId,
      current_health_status: 'healthy',
      health_trend: 'stable',
      mortality_alert: false,
      disease_risk: 'low',
      recommended_actions: []
    };
    
    // Analyze health status
    if (health.rows.length > 0) {
      const currentHealth = health.rows[0];
      monitoring.current_health_status = currentHealth.health_status;
      
      if (currentHealth.mortality_rate > 0.05) {
        monitoring.mortality_alert = true;
        monitoring.health_trend = 'negative';
        monitoring.recommended_actions.push('Investigate cause of mortality');
      }
      
      if (currentHealth.disease_outbreaks > 0) {
        monitoring.disease_risk = 'high';
        monitoring.recommended_actions.push('Implement disease control measures');
      }
      
      if (currentHealth.feed_conversion_rate < 0.6) {
        monitoring.recommended_actions.push('Review feed composition');
      }
    }
    
    // Emit signal bus event
    await signalBus.emit('ai.poultry.health.monitored', {
      poultry_id: poultryId,
      monitoring,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI poultry health monitoring completed', { poultryId, healthStatus: monitoring.current_health_status });
    
    return {
      success: true,
      monitoring
    };
  } catch (error) {
    logger.error('Error monitoring poultry health', { error: error.message, poultryId });
    throw error;
  }
}

/**
 * AI-powered goat production optimization
 */
async function optimizeGoatProduction(goatId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get goat production data
    const production = await pg.query(`
      SELECT 
        goat_id,
        milk_production,
        meat_production,
        feed_efficiency,
        reproduction_rate,
        health_status
      FROM goat_production_records
      WHERE goat_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `, [goatId]);
    
    // AI optimization algorithm
    const optimization = {
      goat_id: goatId,
      optimized_production_mix: {},
      expected_increase: 0,
      efficiency_improvement: 0
    };
    
    // Optimize production mix (milk vs meat)
    optimization.optimized_production_mix = calculateGoatProductionMix(production.rows);
    
    // Calculate expected increase
    optimization.expected_increase = calculateGoatExpectedIncrease(production.rows, optimization.optimized_production_mix);
    
    // Emit signal bus event
    await signalBus.emit('ai.goat.production.optimized', {
      goat_id: goatId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI goat production optimization completed', { goatId });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing goat production', { error: error.message, goatId });
    throw error;
  }
}

/**
 * AI-powered sheep production optimization
 */
async function optimizeSheepProduction(sheepId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get sheep production data
    const production = await pg.query(`
      SELECT 
        sheep_id,
        wool_production,
        meat_production,
        reproduction_rate,
        health_status,
        feed_efficiency
      FROM sheep_production_records
      WHERE sheep_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `, [sheepId]);
    
    // AI optimization algorithm
    const optimization = {
      sheep_id: sheepId,
      optimized_production_mix: {},
      expected_wool_increase: 0,
      efficiency_improvement: 0
    };
    
    // Optimize production mix (wool vs meat)
    optimization.optimized_production_mix = calculateSheepProductionMix(production.rows);
    
    // Calculate expected wool increase
    optimization.expected_wool_increase = calculateSheepExpectedIncrease(production.rows, optimization.optimized_production_mix);
    
    // Emit signal bus event
    await signalBus.emit('ai.sheep.production.optimized', {
      sheep_id: sheepId,
      optimization,
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI sheep production optimization completed', { sheepId });
    
    return {
      success: true,
      optimization
    };
  } catch (error) {
    logger.error('Error optimizing sheep production', { error: error.message, sheepId });
    throw error;
  }
}

/**
 * AI-powered pig production optimization
 */
async function optimizePigProduction(pigId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Get pig production data
    const production = await pg.query(`
      SELECT 
        pig_id,
        meat_production,
        feed_efficiency,
        growth_rate,
        health_status,
        environmental_conditions
      FROM pig_production_records
      WHERE pig_id = $1
      ORDER BY production_date DESC
      LIMIT 10
    `,
    [pigId]);
    
    // AI optimization algorithm
    const pig_id = pigId;
    const {
      optimized_feeding_schedule,
      expected_weight_gain,
      feed_cost_reduction,
      health_improvement
    } = await optimizePigProductionAlgorithm(production.rows);
    
    // Emit signal bus event
    await signalBus.emit('ai.pig.production.optimized', {
      pig_id,
      optimization: {
        pig_id,
        optimized_feeding_schedule,
        expected_weight_gain,
        feed_cost_reduction,
        health_improvement
      },
      timestamp: new Date().toISOString()
    });
    
    logger.info('AI pig production optimization completed', { pigId });
    
    return {
      success: true,
      optimization: {
        pig_id,
        optimized_feeding_schedule,
        expected_weight_gain,
        feed_cost_reduction,
        health_improvement
      }
    };
  } catch (error) {
    logger.error('Error optimizing pig production', { error: error.message, pigId });
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateFieldSuitability(fieldData, crop) {
  // Simple field suitability calculation
  const suitabilityFactors = {
    soil_match: fieldData?.soil_type === 'loam' ? 0.8 : 0.5,
    irrigation_match: fieldData?.irrigation_type === 'drip' ? 0.9 : 0.6,
    ph_match: fieldData?.soil_ph >= 6.0 && fieldData?.soil_ph <= 7.5 ? 0.8 : 0.4
  };
  
  return Object.values(suitabilityFactors).reduce((sum, factor) => sum + factor, 0) / 3;
}

function calculateMarketCondition(marketData, crop) {
  const cropData = marketData.find(m => m.crop_type === crop);
  if (!cropData) return 0.5;
  
  const marketFactors = {
    demand_trend: cropData.demand_trend === 'high' ? 0.8 : 0.5,
    price_trend: cropData.market_price > 50 ? 0.7 : 0.5,
    seasonality: cropData.seasonality === 'in_season' ? 0.9 : 0.4
  };
  
  return Object.values(marketFactors).reduce((sum, factor) => sum + factor, 0) / 3;
}

function calculateResourceRequirements(fieldData, crop) {
  const resourceRequirements = {
    seeds: fieldData.field_size * 2,
    fertilizers: fieldData.field_size * 100,
    water: fieldData.field_size * 5000,
    labor: fieldData.field_size * 10
  };
  
  return resourceRequirements;
}

function determineRiskLevel(confidenceScore, historicalCrop) {
  if (confidenceScore > 0.8) return 'low';
  if (confidenceScore > 0.6) return 'medium';
  if (confidenceScore > 0.4) return 'high';
  return 'critical';
}

function generateAIReasoning(recommendation, historicalCrop, fieldSuitability, marketCondition) {
  const reasons = [];
  
  if (historicalCrop) {
    reasons.push(`Based on historical performance (${historicalCrop.profit_margin}% profit margin)`);
  }
  
  if (fieldSuitability > 0.7) {
    reasons.push(`Field is highly suitable for this crop (${(fieldSuitability * 100).toFixed(0)}% suitability)`);
  }
  
  if (marketCondition > 0.7) {
    reasons.push(`Market conditions are favorable (${(marketCondition * 100).toFixed(0)}% market favorability)`);
  }
  
  return reasons.join('; ');
}

async function getWeatherForecast(location) {
  // Placeholder for weather forecast API integration
  return {
    location,
    forecast: 'moderate',
    temperature: 25,
    rainfall: 'normal',
    humidity: 60
  };
}

async function determineCropGrowthStage(cropId) {
  // Placeholder for growth stage determination
  return 'vegetative';
}

function calculateOptimalHarvestDate(historicalHarvests, weatherForecast, growthStage) {
  // Simple calculation based on historical data
  if (historicalHarvests.length === 0) {
    const date = new Date();
    date.setDate(date.getDate() + 90); // Default 90 days from now
    return date.toISOString().split('T')[0];
  }
  
  const avgDaysToHarvest = historicalHarvests.reduce((sum, record) => {
    const planting = new Date(record.planting_date);
    const harvest = new Date(record.harvest_date);
    return sum + (harvest - planting) / historicalHarvests.length;
  }, 0);
  
  const optimalDate = new Date();
  optimalDate.setDate(optimalDate.getDate() + avgDaysToHarvest);
  return optimalDate.toISOString().split('T')[0];
}

function calculateExpectedYield(cropData, growthStage, weatherForecast) {
  const baseYield = cropData.expected_yield_per_hectare || 2.5;
  const growthMultiplier = growthStage === 'flowering' ? 1.2 : growthStage === 'fruiting' ? 1.3 : 1.0;
  const weatherMultiplier = weatherForecast.forecast === 'favorable' ? 1.1 : 0.9;
  
  return baseYield * growthMultiplier * weatherMultiplier;
}

function calculateExpectedQuality(cropData, weatherForecast) {
  if (weatherForecast.forecast === 'favorable') return 'grade_a';
  if (weatherForecast.forecast === 'moderate') return 'grade_b';
  return 'grade_c';
}

/** Same favorable/moderate/adverse scale used by calculateExpectedYield above, factored out
 *  so predictCropYield can apply it after historical-average yield is already computed. */
function calculateWeatherMultiplier(weatherForecast) {
  if (weatherForecast?.forecast === 'favorable') return 1.1;
  if (weatherForecast?.forecast === 'adverse') return 0.75;
  return 0.9;
}

/** Quality grade from current plant health plus forecast — a stricter sibling of
 *  calculateExpectedQuality, which only has forecast to go on. */
function predictQualityGrade(currentCondition, weatherForecast) {
  const health = currentCondition?.plant_health;
  if (health === 'excellent' && weatherForecast?.forecast === 'favorable') return 'grade_a';
  if (health === 'poor' || weatherForecast?.forecast === 'adverse') return 'grade_c';
  return 'grade_b';
}

/** Real lookup against market_intelligence (same table recommendCropPlanning reads).
 *  Returns null rather than a fabricated number when there is no priced data for
 *  this crop — an absent price must never be silently rendered as a real one. */
async function predictMarketPriceAtDate(cropType, targetDate) {
  const pg = getPostgreSQL();
  const result = await pg.query(
    `SELECT market_price, demand_trend, seasonality FROM market_intelligence WHERE crop_type = $1 AND active = true LIMIT 1`,
    [cropType]
  );
  if (result.rows.length === 0) {
    return { crop_type: cropType, target_date: targetDate, price: null, basis: 'no market_intelligence record for this crop' };
  }
  const row = result.rows[0];
  const trendMultiplier = row.demand_trend === 'rising' ? 1.05 : row.demand_trend === 'falling' ? 0.95 : 1.0;
  return {
    crop_type: cropType,
    target_date: targetDate,
    price: Number(row.market_price) * trendMultiplier,
    basis: `current market_intelligence price adjusted for ${row.demand_trend || 'stable'} demand trend`,
  };
}

function calculateYieldConfidence(historicalDataCount, currentCondition, weatherForecast) {
  let confidence = 0.5;
  
  if (historicalDataCount > 3) confidence += 0.2;
  if (currentCondition?.plant_health === 'excellent') confidence += 0.2;
  if (weatherForecast.forecast === 'favorable') confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

function identifyYieldRiskFactors(currentCondition, weatherForecast) {
  const risks = [];
  
  if (currentCondition?.stress_factors?.length > 0) {
    risks.push(...currentCondition.stress_factors);
  }
  
  if (weatherForecast.forecast === 'adverse') {
    risks.push('adverse weather predicted');
  }
  
  return risks;
}

function calculateNextVetVisit(livestockId, healthStatus) {
  const daysUntilVisit = healthStatus === 'critical' ? 1 : healthStatus === 'attention_needed' ? 3 : 7;
  const nextVisit = new Date();
  nextVisit.setDate(nextVisit.getDate() + daysUntilVisit);
  return nextVisit.toISOString().split('T')[0];
}

function calculateBreedingSuitability(livestockData) {
  let suitability = 0.5;
  
  if (livestockData.age >= 2 && livestockData.age <= 8) suitability += 0.3;
  if (livestockData.health_status === 'healthy') suitability += 0.2;
  if (livestockData.genetic_quality === 'premium') suitability += 0.2;
  
  return suitability;
}

async function findCompatibleBreedingPartners(livestockData) {
  // Placeholder for finding compatible breeding partners
  return [];
}

function predictOffspringQuality(livestockData, partners) {
  return livestockData.genetic_quality === 'premium' ? 'excellent' : 'good';
}

function determineBreedingTimeline(age, sex) {
  if (age >= 2 && age <= 4 && sex === 'female') return 'immediate';
  if (age >= 4 && age <= 6) return 'recommended';
  return 'optional';
}

function identifyBreedingRisks(livestockData, breedingHistory) {
  const risks = [];
  
  if (livestockData.age > 8) risks.push('advanced age risk');
  if (livestockData.health_status !== 'healthy') risks.push('health risk');
  
  return risks;
}

function calculateOptimalFeedMix(productionData) {
  return {
    protein_ratio: 0.18,
    energy_ratio: 0.6,
    fiber_ratio: 0.22
  };
}

function calculateExpectedMilkIncrease(currentEfficiency, optimizedFeedMix) {
  return currentEfficiency * 0.15;
}

function calculateFeedCostReduction(optimizedFeedMix) {
  return 0.1; // 10% cost reduction
}

function calculateGoatProductionMix(productionRows) {
  return {
    milk_priority: 0.6,
    meat_priority: 0.4
  };
}

function calculateGoatExpectedIncrease(productionRows, optimizedMix) {
  return 0.12; // 12% increase
}

function calculateSheepProductionMix(productionRows) {
  return {
    wool_priority: 0.7,
    meat_priority: 0.3
  };
}

function calculateSheepExpectedIncrease(productionRows, optimizedMix) {
  return 0.15; // 15% increase
}

async function optimizePigProductionAlgorithm(productionRows) {
  return {
    optimized_feeding_schedule: 'three_times_daily',
    expected_weight_gain: 0.2, // 20% increase
    feed_cost_reduction: 0.08, // 8% reduction
    health_improvement: 'regular_exercise'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Farmer Module AI Integration
  recommendCropPlanning,
  predictHarvestTiming,
  optimizeFarmerResources,
  
  // Crop Module AI Integration
  detectCropDisease,
  predictCropYield,
  
  // Livestock Module AI Integration
  monitorLivestockHealth,
  recommendLivestockBreeding,
  
  // Inbuilt Modules AI Integration
  optimizeDairyProduction,
  monitorPoultryHealth,
  optimizeGoatProduction,
  optimizeSheepProduction,
  optimizePigProduction
};
