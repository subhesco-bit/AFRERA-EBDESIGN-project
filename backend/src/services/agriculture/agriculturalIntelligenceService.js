/**
 * Agricultural Intelligence Service
 * AI-powered agricultural decision support and analytics
 * Crop prediction, soil analysis, weather intelligence, and farming optimization
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const aiGateway = require('../ai/aiGatewayService');
const analytics = require('../platform/analyticsService');

class AgriculturalIntelligenceService {
  constructor() {
    this.aiGateway = aiGateway;
    this.analytics = analytics;
  }

  /**
   * Crop yield prediction
   */
  async predictCropYield(parameters) {
    try {
      const prediction = await this.aiGateway.predict('crop_yield', parameters, {
        location: parameters.location,
        crop_type: parameters.crop_type,
        soil_data: parameters.soil_data,
        weather_data: parameters.weather_data
      });

      return {
        crop_type: parameters.crop_type,
        location: parameters.location,
        prediction: prediction,
        confidence: prediction.confidence,
        factors: prediction.factors,
        recommendations: this.generateYieldRecommendations(prediction),
        predicted_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error predicting crop yield:', error);
      throw error;
    }
  }

  /**
   * Soil analysis and recommendations
   */
  async analyzeSoil(soilData) {
    try {
      const analysis = await this.aiGateway.analyze('soil', soilData, 'comprehensive');

      return {
        soil_id: soilData.id || 'unknown',
        analysis_type: 'comprehensive',
        health_score: analysis.soil_health_score,
        nutrient_levels: analysis.nutrient_levels,
        ph_level: analysis.ph_level,
        organic_matter: analysis.organic_matter || 2.5,
        texture: analysis.texture || 'loam',
        recommendations: analysis.recommendations,
        fertilizer_recommendations: this.generateFertilizerRecommendations(analysis),
        irrigation_recommendations: this.generateIrrigationRecommendations(analysis),
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error analyzing soil:', error);
      throw error;
    }
  }

  /**
   * Weather intelligence and forecasting
   */
  async getWeatherIntelligence(location, timeframe = '7d') {
    try {
      const weatherPrediction = await this.aiGateway.predict('weather', { location, timeframe });
      
      const advisory = await this.generateWeatherAdvisory(weatherPrediction);

      return {
        location: location,
        timeframe: timeframe,
        current_conditions: weatherPrediction.current_conditions || {},
        forecast: weatherPrediction,
        advisory: advisory,
        risk_assessment: this.assessWeatherRisks(weatherPrediction),
        recommendations: this.generateWeatherRecommendations(weatherPrediction),
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting weather intelligence:', error);
      throw error;
    }
  }

  /**
   * Pest and disease prediction
   */
  async predictPestOutbreak(parameters) {
    try {
      const prediction = await this.aiGateway.predict('pest_outbreak', parameters, {
        crop_type: parameters.crop_type,
        location: parameters.location,
        current_conditions: parameters.current_conditions,
        historical_data: parameters.historical_data
      });

      return {
        crop_type: parameters.crop_type,
        location: parameters.location,
        risk_level: prediction.risk_level,
        confidence: prediction.confidence,
        affected_area: prediction.affected_area,
        likely_pests: prediction.likely_pests || [],
        preventive_measures: this.generatePestPreventiveMeasures(prediction),
        treatment_recommendations: this.generatePestTreatmentRecommendations(prediction),
        monitoring_protocol: this.generatePestMonitoringProtocol(prediction),
        predicted_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error predicting pest outbreak:', error);
      throw error;
    }
  }

  /**
   * Crop selection recommendations
   */
  async recommendCrops(parameters) {
    try {
      const recommendations = await this.aiGateway.recommend('crop_selection', parameters, {
        soil_data: parameters.soil_data,
        location: parameters.location,
        season: parameters.season,
        market_data: parameters.market_data,
        resources: parameters.resources
      });

      return {
        location: parameters.location,
        season: parameters.season,
        recommended_crops: recommendations.recommended_crops,
        confidence: recommendations.confidence,
        reasoning: recommendations.reasoning,
        expected_yields: recommendations.expected_yields || {},
        market_outlook: recommendations.market_outlook || {},
        resource_requirements: recommendations.resource_requirements || {},
        risk_factors: recommendations.risk_factors || [],
        alternatives: recommendations.alternatives || [],
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error recommending crops:', error);
      throw error;
    }
  }

  /**
   * Irrigation optimization
   */
  async optimizeIrrigation(parameters) {
    try {
      const optimization = await this.aiGateway.optimize('irrigation', parameters, {
        crop_type: parameters.crop_type,
        soil_type: parameters.soil_type,
        weather_forecast: parameters.weather_forecast,
        water_availability: parameters.water_availability,
        field_size: parameters.field_size
      });

      return {
        field_id: parameters.field_id,
        crop_type: parameters.crop_type,
        current_irrigation: parameters.current_irrigation,
        optimized_schedule: optimization.optimized_schedule,
        water_savings: optimization.water_savings,
        efficiency_improvement: optimization.efficiency_improvement,
        cost_savings: optimization.cost_savings,
        implementation_guide: optimization.implementation_guide,
        monitoring_requirements: optimization.monitoring_requirements,
        optimized_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error optimizing irrigation:', error);
      throw error;
    }
  }

  /**
   * Fertilizer recommendations
   */
  async recommendFertilizer(parameters) {
    try {
      const recommendations = await this.aiGateway.recommend('fertilizer', parameters, {
        crop_type: parameters.crop_type,
        soil_analysis: parameters.soil_analysis,
        growth_stage: parameters.growth_stage,
        yield_target: parameters.yield_target
      });

      return {
        crop_type: parameters.crop_type,
        growth_stage: parameters.growth_stage,
        fertilizer_type: recommendations.fertilizer_type,
        application_rate: recommendations.application_rate,
        timing: recommendations.timing,
        method: recommendations.method,
        nutrient_breakdown: recommendations.nutrient_breakdown || {},
        cost_estimate: recommendations.cost_estimate,
        environmental_impact: recommendations.environmental_impact || {},
        alternatives: recommendations.alternatives || [],
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error recommending fertilizer:', error);
      throw error;
    }
  }

  /**
   * Agricultural analytics report
   */
  async getAgriculturalAnalytics(parameters) {
    try {
      const report = await this.analytics.generateReport('agricultural_overview', parameters);

      return {
        report_type: 'agricultural_overview',
        period: parameters.period || 'monthly',
        summary: report.summary,
        crop_performance: report.crop_performance,
        farmer_demographics: report.farmer_demographics,
        production_trends: report.production_trends,
        regional_breakdown: report.regional_breakdown,
        recommendations: report.recommendations,
        generated_at: report.generated_at
      };
    } catch (error) {
      logger.error('Error getting agricultural analytics:', error);
      throw error;
    }
  }

  /**
   * Generate yield recommendations
   */
  generateYieldRecommendations(prediction) {
    if (!prediction || prediction.implemented !== true) return [];
    return Array.isArray(prediction.recommendations) ? prediction.recommendations : [];
  }

  /**
   * Pass through only validated, engine-supplied fertilizer recommendations.
   * No generic dosage or product is invented here.
   */
  generateFertilizerRecommendations(analysis) {
    if (!analysis || analysis.implemented !== true) return [];
    return Array.isArray(analysis.fertilizer_recommendations) ? analysis.fertilizer_recommendations : [];
  }

  /**
   * Pass through only validated, engine-supplied irrigation recommendations.
   */
  generateIrrigationRecommendations(analysis) {
    if (!analysis || analysis.implemented !== true) return [];
    return Array.isArray(analysis.irrigation_recommendations) ? analysis.irrigation_recommendations : [];
  }

  async generateWeatherAdvisory(weatherPrediction) {
    if (!weatherPrediction || weatherPrediction.implemented !== true) {
      return {
        status: 'unavailable',
        level: null,
        actions: [],
        alerts: [],
        reason: weatherPrediction?.reason || 'No validated weather intelligence engine is connected.',
        requiresQualifiedReview: true,
      };
    }
    return weatherPrediction.advisory || {
      status: 'engine_output_missing_advisory',
      level: null,
      actions: [],
      alerts: [],
      requiresQualifiedReview: true,
    };
  }

  assessWeatherRisks(weatherPrediction) {
    if (!weatherPrediction || weatherPrediction.implemented !== true) {
      return { overall: null, factors: [], status: 'unavailable', requiresQualifiedReview: true };
    }
    return weatherPrediction.risk_assessment || {
      overall: null, factors: [], status: 'engine_output_missing_risk_assessment', requiresQualifiedReview: true,
    };
  }

  generateWeatherRecommendations(weatherPrediction) {
    if (!weatherPrediction || weatherPrediction.implemented !== true) return [];
    return Array.isArray(weatherPrediction.recommendations) ? weatherPrediction.recommendations : [];
  }

  generatePestPreventiveMeasures(prediction) {
    if (!prediction || prediction.implemented !== true) return [];
    return Array.isArray(prediction.preventive_measures) ? prediction.preventive_measures : [];
  }

  generatePestTreatmentRecommendations(prediction) {
    if (!prediction || prediction.implemented !== true) {
      return {
        status: 'unavailable',
        chemical: null,
        biological: null,
        cultural: null,
        requiresQualifiedReview: true,
      };
    }
    return prediction.treatment_recommendations || {
      status: 'engine_output_missing_treatment_recommendations',
      chemical: null, biological: null, cultural: null, requiresQualifiedReview: true,
    };
  }

  generatePestMonitoringProtocol(prediction) {
    if (!prediction || prediction.implemented !== true) {
      return {
        status: 'unavailable',
        frequency: null, methods: [], threshold_levels: null, reporting: null, requiresQualifiedReview: true,
      };
    }
    return prediction.monitoring_protocol || {
      status: 'engine_output_missing_monitoring_protocol',
      frequency: null, methods: [], threshold_levels: null, reporting: null, requiresQualifiedReview: true,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const aiHealth = await this.aiGateway.healthCheck();
      const analyticsHealth = await this.analytics.healthCheck();

      return {
        status: ['healthy','configured'].includes(aiHealth.status) && analyticsHealth.status === 'healthy' ? 'healthy' : 'degraded',
        services: {
          ai_gateway: aiHealth,
          analytics: analyticsHealth
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Agricultural intelligence health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new AgriculturalIntelligenceService();