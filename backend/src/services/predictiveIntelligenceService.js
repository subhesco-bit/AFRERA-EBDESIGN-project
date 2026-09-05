/**
 * M026: Predictive Intelligence Service
 * Provides AI-powered predictive analytics and forecasting
 * for agricultural decision making
 */

const db = require('../database/connection');
const logger = require('../utils/logger');
const analyticsService = require('./advancedAnalyticsService');

class PredictiveIntelligenceService {
  constructor() {
    this.serviceName = 'PredictiveIntelligenceService';
    this.models = {
      demand: this.loadDemandModel(),
      pricing: this.loadPricingModel(),
      yield: this.loadYieldModel()
    };
  }

  /**
   * Predict crop demand forecast
   */
  async predictCropDemand(cropType, region, forecastDays = 30) {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalDemandData(cropType, region, 90);
      
      if (historicalData.length < 10) {
        return {
          success: false,
          error: 'Insufficient historical data for prediction',
          dataPoints: historicalData.length
        };
      }

      // Apply predictive model
      const forecast = this.applyDemandModel(historicalData, forecastDays);
      
      return {
        success: true,
        data: {
          cropType,
          region,
          forecastDays,
          forecast: forecast,
          confidence: this.calculateConfidence(historicalData),
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - predictCropDemand error:`, error);
      return {
        success: false,
        error: 'Failed to predict crop demand',
        details: error.message
      };
    }
  }

  /**
   * Predict optimal pricing
   */
  async predictOptimalPricing(cropType, region, qualityGrade) {
  // Validate inputs
  if (!cropType) throw new Error('Missing required parameter');

    try {
      const marketData = await this.getMarketPricingData(cropType, region, 60);
      
      if (marketData.length < 5) {
        return {
          success: false,
          error: 'Insufficient market data for pricing prediction',
          dataPoints: marketData.length
        };
      }

      const pricePrediction = this.applyPricingModel(marketData, qualityGrade);
      
      return {
        success: true,
        data: {
          cropType,
          region,
          qualityGrade,
          predictedPrice: pricePrediction.price,
          priceRange: pricePrediction.range,
          marketFactors: pricePrediction.factors,
          confidence: pricePrediction.confidence,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - predictOptimalPricing error:`, error);
      return {
        success: false,
        error: 'Failed to predict optimal pricing',
        details: error.message
      };
    }
  }

  /**
   * Predict crop yield based on conditions
   */
  async predictCropYield(farmerId, cropId, conditions) {
    try {
      const farmerHistory = await this.getFarmerYieldHistory(farmerId);
      const cropData = await this.getCropCharacteristics(cropId);
      const environmentalData = await this.getEnvironmentalConditions(conditions.location);
      
      const yieldPrediction = this.applyYieldModel({
        farmerHistory,
        cropData,
        environmentalData,
        conditions
      });
      
      return {
        success: true,
        data: {
          farmerId,
          cropId,
          predictedYield: yieldPrediction.yield,
          yieldRange: yieldPrediction.range,
          factors: yieldPrediction.factors,
          recommendations: yieldPrediction.recommendations,
          confidence: yieldPrediction.confidence,
          environmentalDataConfigured: environmentalData.configured !== false,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - predictCropYield error:`, error);
      return {
        success: false,
        error: 'Failed to predict crop yield',
        details: error.message
      };
    }
  }

  /**
   * Get seasonal recommendations
   */
  async getSeasonalRecommendations(region, season) {
    try {
      const query = `
        SELECT 
          c.crop_type,
          c.variety,
          AVG(h.yield_kg) as avg_yield,
          AVG(h.profit_per_kg) as avg_profit,
          COUNT(h.id) as sample_count
        FROM harvests h
        JOIN crops c ON h.crop_id = c.id
        WHERE h.region = $1 
          AND h.season = $2
          AND h.harvest_date >= NOW() - INTERVAL '3 years'
        GROUP BY c.crop_type, c.variety
        ORDER BY avg_profit DESC
        LIMIT 10
      `;

      const result = await db.query(query, [region, season]);
      
      const recommendations = result.rows.map(row => ({
        cropType: row.crop_type,
        variety: row.variety,
        expectedYield: parseFloat(row.avg_yield),
        expectedProfit: parseFloat(row.avg_profit),
        confidence: this.calculateSeasonalConfidence(row.sample_count)
      }));

      return {
        success: true,
        data: {
          region,
          season,
          recommendations,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - getSeasonalRecommendations error:`, error);
      return {
        success: false,
        error: 'Failed to get seasonal recommendations',
        details: error.message
      };
    }
  }

  /**
   * Get historical demand data
   */
  async getHistoricalDemandData(cropType, region, days) {
    const safeDays = Math.max(1, Math.min(3650, parseInt(days, 10) || 90));
    const query = `
      SELECT
        DATE_TRUNC('day', o.created_at) as date,
        COUNT(oi.id) as demand_quantity,
        COALESCE(SUM(oi.quantity), 0) as total_quantity
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN crops c ON oi.crop_id = c.id
      WHERE c.crop_type = $1
        AND o.region = $2
        AND o.created_at >= NOW() - INTERVAL '${safeDays} days'
      GROUP BY DATE_TRUNC('day', o.created_at)
      ORDER BY date ASC
    `;

    const result = await db.query(query, [cropType, region]);
    return result.rows;
  }

  /**
   * Get market pricing data
   */
  async getMarketPricingData(cropType, region, days) {
    const safeDays = Math.max(1, Math.min(3650, parseInt(days, 10) || 60));
    const query = `
      SELECT
        DATE_TRUNC('day', o.created_at) as date,
        c.quality_grade,
        AVG(oi.price_per_kg) as avg_price,
        STDDEV(oi.price_per_kg) as price_stddev
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN crops c ON oi.crop_id = c.id
      WHERE c.crop_type = $1
        AND o.region = $2
        AND o.created_at >= NOW() - INTERVAL '${safeDays} days'
      GROUP BY DATE_TRUNC('day', o.created_at), c.quality_grade
      ORDER BY date ASC
    `;

    const result = await db.query(query, [cropType, region]);
    return result.rows;
  }

  /**
   * Get farmer yield history
   */
  async getFarmerYieldHistory(farmerId) {
    const query = `
      SELECT 
        h.crop_id,
        h.yield_kg,
        h.season,
        h.harvest_date,
        c.crop_type
      FROM harvests h
      JOIN crops c ON h.crop_id = c.id
      WHERE h.farmer_id = $1
        AND h.harvest_date >= NOW() - INTERVAL '5 years'
      ORDER BY h.harvest_date DESC
    `;

    const result = await db.query(query, [farmerId]);
    return result.rows;
  }

  /**
   * Get crop characteristics
   */
  async getCropCharacteristics(cropId) {
    const query = `
      SELECT 
        c.crop_type,
        c.variety,
        c.expected_yield_kg,
        c.growing_period_days,
        c.climate_requirements
      FROM crops c
      WHERE c.id = $1
    `;

    const result = await db.query(query, [cropId]);
    return result.rows[0];
  }

  /**
   * Get environmental conditions
   */
  async getEnvironmentalConditions(location) {
    // No weather API is configured. These are NOT real readings for `location` - every
    // caller gets the identical fixed values regardless of where the farm actually is.
    // `configured: false` must be surfaced to callers (predictCropYield) rather than treated
    // as real data, per this repo's established not_configured convention.
    return {
      temperature: 25,
      humidity: 70,
      rainfall: 120,
      soilType: 'loam',
      location,
      configured: false,
      dataSource: 'placeholder_no_weather_api_configured'
    };
  }

  /**
   * Apply demand prediction model
   */
  applyDemandModel(historicalData, forecastDays) {
    // Simplified linear regression model
    const values = historicalData.map(d => parseFloat(d.total_quantity));
    const days = historicalData.map((_, i) => i);
    
    // Calculate trend
    const n = values.length;
    const sumX = days.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = days.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = days.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate forecast
    const forecast = [];
    for (let i = 0; i < forecastDays; i++) {
      const predictedValue = slope * (n + i) + intercept;
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedDemand: Math.max(0, predictedValue),
        trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
      });
    }
    
    return forecast;
  }

  /**
   * Apply pricing prediction model
   */
  applyPricingModel(marketData, qualityGrade) {
    const prices = marketData.map(d => parseFloat(d.avg_price));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const priceStdDev = Math.sqrt(
      prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length
    );
    
    // Quality adjustment
    const qualityMultiplier = this.getQualityMultiplier(qualityGrade);
    const predictedPrice = avgPrice * qualityMultiplier;
    
    return {
      price: parseFloat(predictedPrice.toFixed(2)),
      range: {
        min: parseFloat((predictedPrice - priceStdDev).toFixed(2)),
        max: parseFloat((predictedPrice + priceStdDev).toFixed(2))
      },
      factors: {
        marketAverage: parseFloat(avgPrice.toFixed(2)),
        qualityAdjustment: qualityMultiplier,
        marketVolatility: parseFloat(priceStdDev.toFixed(2))
      },
      confidence: this.calculatePricingConfidence(marketData.length)
    };
  }

  /**
   * Apply yield prediction model
   */
  applyYieldModel(data) {
    const { farmerHistory, cropData, environmentalData, conditions } = data;
    
    // Base yield from crop characteristics
    let predictedYield = cropData.expected_yield_kg || 1000;
    
    // Adjust based on farmer history
    if (farmerHistory.length > 0) {
      const avgFarmerYield = farmerHistory.reduce((sum, h) => sum + h.yield_kg, 0) / farmerHistory.length;
      predictedYield = (predictedYield + avgFarmerYield) / 2;
    }
    
    // Environmental adjustments
    const tempFactor = this.getTemperatureFactor(environmentalData.temperature);
    const humidityFactor = this.getHumidityFactor(environmentalData.humidity);
    const rainfallFactor = this.getRainfallFactor(environmentalData.rainfall);
    
    predictedYield *= tempFactor * humidityFactor * rainfallFactor;
    
    return {
      yield: Math.round(predictedYield),
      range: {
        min: Math.round(predictedYield * 0.8),
        max: Math.round(predictedYield * 1.2)
      },
      factors: {
        baseYield: cropData.expected_yield_kg,
        farmerPerformance: farmerHistory.length > 0,
        environmentalScore: (tempFactor + humidityFactor + rainfallFactor) / 3
      },
      recommendations: this.generateYieldRecommendations(environmentalData),
      // Confidence is capped when environmental data is a placeholder, not a real weather
      // reading - the model's other inputs (farmer/crop history) may still be real.
      confidence: environmentalData.configured === false ? 0.4 : 0.75
    };
  }

  /**
   * Get quality multiplier for pricing
   */
  getQualityMultiplier(qualityGrade) {
    const multipliers = {
      'premium': 1.3,
      'grade_a': 1.15,
      'grade_b': 1.0,
      'grade_c': 0.85,
      'standard': 1.0
    };
    return multipliers[qualityGrade] || 1.0;
  }

  /**
   * Calculate confidence based on data availability
   */
  calculateConfidence(data) {
    const dataPoints = data.length;
    if (dataPoints >= 30) return 0.9;
    if (dataPoints >= 20) return 0.8;
    if (dataPoints >= 10) return 0.7;
    return 0.5;
  }

  /**
   * Calculate seasonal confidence
   */
  calculateSeasonalConfidence(sampleCount) {
    if (sampleCount >= 50) return 0.9;
    if (sampleCount >= 30) return 0.8;
    if (sampleCount >= 10) return 0.7;
    return 0.5;
  }

  /**
   * Calculate pricing confidence
   */
  calculatePricingConfidence(dataPoints) {
    if (dataPoints >= 20) return 0.85;
    if (dataPoints >= 10) return 0.75;
    return 0.6;
  }

  /**
   * Environmental factor calculations
   */
  getTemperatureFactor(temp) {
    if (temp >= 20 && temp <= 30) return 1.0;
    if (temp >= 15 && temp < 20) return 0.9;
    if (temp > 30 && temp <= 35) return 0.85;
    return 0.7;
  }

  getHumidityFactor(humidity) {
    if (humidity >= 60 && humidity <= 80) return 1.0;
    if (humidity >= 50 && humidity < 60) return 0.9;
    if (humidity > 80 && humidity <= 90) return 0.85;
    return 0.75;
  }

  getRainfallFactor(rainfall) {
    if (rainfall >= 100 && rainfall <= 150) return 1.0;
    if (rainfall >= 80 && rainfall < 100) return 0.9;
    if (rainfall > 150 && rainfall <= 200) return 0.85;
    return 0.7;
  }

  /**
   * Generate yield recommendations
   */
  generateYieldRecommendations(environmentalData) {
    const recommendations = [];
    
    if (environmentalData.temperature < 20) {
      recommendations.push('Consider temperature control measures');
    }
    if (environmentalData.humidity < 60) {
      recommendations.push('Increase irrigation frequency');
    }
    if (environmentalData.rainfall < 100) {
      recommendations.push('Implement supplemental irrigation');
    }
    
    return recommendations;
  }

  /**
   * Load demand model (placeholder for ML model)
   */
  loadDemandModel() {
    return { type: 'linear_regression', version: '1.0' };
  }

  /**
   * Load pricing model (placeholder for ML model)
   */
  loadPricingModel() {
    return { type: 'market_based', version: '1.0' };
  }

  /**
   * Load yield model (placeholder for ML model)
   */
  loadYieldModel() {
    return { type: 'environmental_factors', version: '1.0' };
  }
}

module.exports = new PredictiveIntelligenceService();