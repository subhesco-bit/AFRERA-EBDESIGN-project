/**
 * Agricultural Intelligence Service
 * AI-powered agricultural decision support and analytics
 * Crop prediction, soil analysis, weather intelligence, and farming optimization
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const aiGateway = require('./aiGatewayService');
const analytics = require('./analyticsService');

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
    const recommendations = [];
    
    if (prediction.predicted_yield < 3) {
      recommendations.push('Consider soil amendment to improve yield potential');
    }
    
    if (prediction.factors?.includes('soil_quality')) {
      recommendations.push('Implement soil testing and targeted fertilization');
    }
    
    if (prediction.factors?.includes('weather')) {
      recommendations.push('Install weather monitoring systems for better predictions');
    }
    
    return recommendations;
  }

  /**
   * Generate fertilizer recommendations
   */
  generateFertilizerRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.nutrient_levels?.nitrogen < 50) {
      recommendations.push({
        nutrient: 'nitrogen',
        recommendation: 'Apply nitrogen-rich fertilizer',
        type: 'urea',
        rate: '50kg/ha'
      });
    }
    
    if (analysis.nutrient_levels?.phosphorus < 30) {
      recommendations.push({
        nutrient: 'phosphorus',
        recommendation: 'Apply phosphorus-rich fertilizer',
        type: 'DAP',
        rate: '25kg/ha'
      });
    }
    
    if (analysis.nutrient_levels?.potassium < 40) {
      recommendations.push({
        nutrient: 'potassium',
        recommendation: 'Apply potassium-rich fertilizer',
        type: 'MOP',
        rate: '30kg/ha'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate irrigation recommendations
   */
  generateIrrigationRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.soil_health_score < 60) {
      recommendations.push('Implement drip irrigation for water conservation');
    }
    
    if (analysis.ph_level < 6 || analysis.ph_level > 7.5) {
      recommendations.push('Monitor soil moisture levels to optimize irrigation schedule');
    }
    
    return recommendations;
  }

  /**
   * Generate weather advisory
   */
  async generateWeatherAdvisory(weatherPrediction) {
    const advisory = {
      level: 'normal',
      actions: [],
      alerts: []
    };

    if (weatherPrediction.temperature > 35) {
      advisory.level = 'high';
      advisory.actions.push('Increase irrigation frequency');
      advisory.alerts.push('High temperature alert');
    }

    if (weatherPrediction.rainfall < 10) {
      advisory.actions.push('Prepare for drought conditions');
    }

    if (weatherPrediction.rainfall > 100) {
      advisory.level = 'high';
      advisory.actions.push('Ensure proper drainage');
      advisory.alerts.push('Heavy rainfall alert');
    }

    return advisory;
  }

  /**
   * Assess weather risks
   */
  assessWeatherRisks(weatherPrediction) {
    const risks = {
      overall: 'low',
      factors: []
    };

    if (weatherPrediction.temperature > 38) {
      risks.overall = 'high';
      risks.factors.push('heat_stress');
    }

    if (weatherPrediction.rainfall > 150) {
      risks.overall = 'high';
      risks.factors.push('flooding');
    }

    if (weatherPrediction.humidity > 90) {
      risks.factors.push('disease_risk');
    }

    return risks;
  }

  /**
   * Generate weather recommendations
   */
  generateWeatherRecommendations(weatherPrediction) {
    const recommendations = [];

    if (weatherPrediction.temperature > 30) {
      recommendations.push('Provide shade for sensitive crops');
    }

    if (weatherPrediction.rainfall < 20) {
      recommendations.push('Plan supplemental irrigation');
    }

    if (weatherPrediction.rainfall > 80) {
      recommendations.push('Ensure proper drainage systems');
    }

    return recommendations;
  }

  /**
   * Generate pest preventive measures
   */
  generatePestPreventiveMeasures(prediction) {
    return [
      'Implement crop rotation',
      'Use resistant varieties',
      'Maintain proper field sanitation',
      'Monitor pest populations regularly',
      'Use biological control methods'
    ];
  }

  /**
   * Generate pest treatment recommendations
   */
  generatePestTreatmentRecommendations(prediction) {
    return {
      chemical: {
        recommended: false,
        alternatives: ['biopesticides', 'organic_methods']
      },
      biological: {
        recommended: true,
        methods: ['predatory_insects', 'pathogens', 'parasites']
      },
      cultural: {
        recommended: true,
        methods: ['crop_rotation', 'trap_crops', 'timing_adjustments']
      }
    };
  }

  /**
   * Generate pest monitoring protocol
   */
  generatePestMonitoringProtocol(prediction) {
    return {
      frequency: 'weekly',
      methods: ['visual_inspection', 'pheromone_traps', 'scouting'],
      threshold_levels: {
        economic: '5%_damage',
        action: '10%_infestation'
      },
      reporting: 'immediate_for_critical_pests'
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
        status: aiHealth.status === 'healthy' && analyticsHealth.status === 'healthy' ? 'healthy' : 'degraded',
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