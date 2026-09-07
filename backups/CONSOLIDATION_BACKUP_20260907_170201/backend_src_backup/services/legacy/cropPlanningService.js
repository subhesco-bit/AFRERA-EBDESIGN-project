/**
 * Crop Planning Service
 * Intelligent crop planning based on land records, weather, and market demand
 */

const { logger } = require('../../utils/logger');

class CropPlanningService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../database/pool');
  }

  /**
   * Create crop plan for a farmer
   */
  async createCropPlan(farmerId, planData) {
    const {
      landRecordId,
      cropType,
      variety,
      season,
      plantingDate,
      expectedHarvestDate,
      estimatedYield,
      seedSource,
      fertilizerPlan,
      irrigationSchedule,
      marketStrategy
    } = planData;

    try {
      // Validate land record belongs to farmer
      const landQuery = `
        SELECT * FROM land_records 
        WHERE id = $1 AND farmer_id = $2
      `;
      const landResult = await this.pool.query(landQuery, [landRecordId, farmerId]);

      if (landResult.rows.length === 0) {
        throw new Error('Land record not found or unauthorized');
      }

      const land = landResult.rows[0];

      // Calculate resource requirements
      const resourceRequirements = this.calculateResourceRequirements(
        cropType,
        land.area_in_hectares,
        estimatedYield
      );

      const query = `
        INSERT INTO crop_plans 
        (farmer_id, land_record_id, crop_type, variety, season, planting_date,
         expected_harvest_date, estimated_yield, seed_source, fertilizer_plan,
         irrigation_schedule, market_strategy, resource_requirements, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'planned')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        farmerId,
        landRecordId,
        cropType,
        variety,
        season,
        plantingDate,
        expectedHarvestDate,
        estimatedYield,
        seedSource,
        JSON.stringify(fertilizerPlan),
        JSON.stringify(irrigationSchedule),
        JSON.stringify(marketStrategy),
        JSON.stringify(resourceRequirements)
      ]);

      logger.info(`Crop plan created for farmer ${farmerId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating crop plan', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get crop plans for a farmer
   */
  async getFarmerCropPlans(farmerId, filters = {}) {
    const { season, status, cropType, page = 1, limit = 20 } = filters;

    try {
      let query = `
        SELECT 
          cp.*,
          lr.village,
          lr.district,
          lr.area_in_hectares,
          lr.soil_type
        FROM crop_plans cp
        JOIN land_records lr ON cp.land_record_id = lr.id
        WHERE cp.farmer_id = $1
      `;

      const params = [farmerId];
      let paramCount = 1;

      if (season) {
        paramCount++;
        query += ` AND cp.season = $${paramCount}`;
        params.push(season);
      }

      if (status) {
        paramCount++;
        query += ` AND cp.status = $${paramCount}`;
        params.push(status);
      }

      if (cropType) {
        paramCount++;
        query += ` AND cp.crop_type = $${paramCount}`;
        params.push(cropType);
      }

      query += ' ORDER BY cp.planting_date DESC';

      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await this.pool.query(query, params);

      return {
        plans: result.rows,
        pagination: { page, limit }
      };
    } catch (error) {
      logger.error('Error getting farmer crop plans', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get AI-recommended crop plan
   */
  async getRecommendedCropPlan(farmerId, landRecordId) {
    try {
      // Get land details
      const landQuery = `
        SELECT * FROM land_records 
        WHERE id = $1 AND farmer_id = $2
      `;
      const landResult = await this.pool.query(landQuery, [landRecordId, farmerId]);
      const land = landResult.rows[0];

      if (!land) {
        throw new Error('Land record not found');
      }

      // Get current season
      const currentSeason = this.getCurrentSeason();

      // Get suitable crops for soil type and region
      const suitableCrops = await this.getSuitableCrops(
        land.soil_type,
        land.state,
        land.district,
        currentSeason
      );

      // Get market demand data
      const marketDemand = await this.getMarketDemand(currentSeason);

      // Get weather forecast
      const weatherForecast = await this.getWeatherForecast(
        land.district,
        currentSeason
      );

      // Rank crops by suitability and market demand
      const rankedCrops = this.rankCrops(suitableCrops, marketDemand, weatherForecast);

      // Generate recommendations
      const recommendations = rankedCrops.slice(0, 5).map(crop => ({
        cropType: crop.cropType,
        variety: crop.recommendedVariety,
        expectedYield: crop.expectedYield,
        marketPrice: crop.marketPrice,
        profitability: crop.profitability,
        riskLevel: crop.riskLevel,
        recommendationScore: crop.score
      }));

      return {
        landRecordId,
        currentSeason,
        landDetails: {
          area: land.area_in_hectares,
          soilType: land.soilType,
          irrigationType: land.irrigationType
        },
        recommendations,
        weatherForecast,
        marketInsights: marketDemand,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error getting recommended crop plan', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get suitable crops for given conditions
   */
  async getSuitableCrops(soilType, state, district, season) {
    try {
      // In production, this would query agricultural database
      // For now, return predefined suitability data

      const cropDatabase = {
        'alluvial': ['rice', 'wheat', 'maize', 'sugarcane', 'mustard', 'vegetables'],
        'red_loamy': ['rice', 'millets', 'pulses', 'oilseeds', 'vegetables'],
        'black-soil': ['cotton', 'sugarcane', 'soybean', 'wheat', 'gram'],
        'laterite': ['rice', 'coconut', 'arecanut', 'cashew', 'spices'],
        'sandy': ['groundnut', 'millets', 'vegetables', 'fruits']
      };

      const seasonalCrops = {
        'kharif': ['rice', 'maize', 'cotton', 'soybean', 'groundnut', 'sugarcane'],
        'rabi': ['wheat', 'barley', 'gram', 'mustard', 'vegetables'],
        'zaid': ['cucumber', 'watermelon', 'muskmelon', 'vegetables']
      };

      const soilSuitable = cropDatabase[soilType] || cropDatabase['alluvial'];
      const seasonalSuitable = seasonalCrops[season] || seasonalCrops['kharif'];

      // Intersection of soil-suitable and season-suitable crops
      const suitableCrops = [...new Set([...soilSuitable, ...seasonalSuitable])];

      return suitableCrops.map(crop => ({
        cropType: crop,
        soilSuitability: soilSuitable.includes(crop) ? 'high' : 'medium',
        seasonSuitability: seasonalSuitable.includes(crop) ? 'high' : 'medium'
      }));
    } catch (error) {
      logger.error('Error getting suitable crops', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get market demand data
   */
  async getMarketDemand(season) {
    try {
      // In production, this would query market data APIs
      // For now, return simulated market data

      const marketData = {
        'rice': { demand: 'high', price: 2500, trend: 'stable' },
        'wheat': { demand: 'high', price: 2200, trend: 'increasing' },
        'maize': { demand: 'medium', price: 1800, trend: 'stable' },
        'cotton': { demand: 'high', price: 6000, trend: 'increasing' },
        'soybean': { demand: 'medium', price: 4000, trend: 'stable' },
        'groundnut': { demand: 'medium', price: 5500, trend: 'increasing' },
        'sugarcane': { demand: 'high', price: 3000, trend: 'stable' },
        'vegetables': { demand: 'high', price: 3500, trend: 'increasing' }
      };

      return marketData;
    } catch (error) {
      logger.error('Error getting market demand', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get weather forecast
   */
  async getWeatherForecast(district, season) {
    try {
      // In production, this would call weather APIs
      // For now, return simulated forecast

      return {
        district,
        season,
        rainfall: 'normal',
        temperature: 'moderate',
        humidity: 'high',
        riskFactors: ['pests', 'diseases'],
        favorableConditions: ['good soil moisture', 'adequate sunlight']
      };
    } catch (error) {
      logger.error('Error getting weather forecast', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Rank crops by suitability and market demand
   */
  rankCrops(suitableCrops, marketDemand, weatherForecast) {
    return suitableCrops.map(crop => {
      const marketData = marketDemand[crop.cropType] || { demand: 'medium', price: 2000, trend: 'stable' };

      let score = 0;
      score += crop.soilSuitability === 'high' ? 30 : 15;
      score += crop.seasonSuitability === 'high' ? 30 : 15;
      score += marketData.demand === 'high' ? 25 : 10;
      score += marketData.trend === 'increasing' ? 15 : 5;

      return {
        ...crop,
        marketPrice: marketData.price,
        marketDemand: marketData.demand,
        marketTrend: marketData.trend,
        expectedYield: this.getExpectedYield(crop.cropType),
        profitability: this.calculateProfitability(crop.cropType, marketData.price),
        riskLevel: this.assessRiskLevel(crop.cropType, weatherForecast),
        score
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Get expected yield for crop
   */
  getExpectedYield(cropType) {
    const yields = {
      'rice': 4.5,
      'wheat': 3.5,
      'maize': 5.0,
      'cotton': 1.5,
      'soybean': 2.0,
      'groundnut': 1.8,
      'sugarcane': 70,
      'vegetables': 25
    };

    return yields[cropType] || 3.0; // tons per hectare
  }

  /**
   * Calculate profitability
   */
  calculateProfitability(cropType, marketPrice) {
    const yields = this.getExpectedYield(cropType);
    const costs = {
      'rice': 15000,
      'wheat': 12000,
      'maize': 10000,
      'cotton': 25000,
      'soybean': 18000,
      'groundnut': 20000,
      'sugarcane': 50000,
      'vegetables': 30000
    };

    const cost = costs[cropType] || 15000;
    const revenue = yields * marketPrice;
    const profit = revenue - cost;
    const roi = (profit / cost) * 100;

    return {
      expectedRevenue: revenue,
      expectedCost: cost,
      expectedProfit: profit,
      roi: roi.toFixed(2) + '%'
    };
  }

  /**
   * Assess risk level
   */
  assessRiskLevel(cropType, weatherForecast) {
    const riskFactors = {
      'rice': 'medium',
      'wheat': 'low',
      'maize': 'low',
      'cotton': 'high',
      'soybean': 'medium',
      'groundnut': 'medium',
      'sugarcane': 'low',
      'vegetables': 'high'
    };

    return riskFactors[cropType] || 'medium';
  }

  /**
   * Calculate resource requirements
   */
  calculateResourceRequirements(cropType, areaInHectares, estimatedYield) {
    const baseRequirements = {
      'rice': {
        seeds: 20, // kg per hectare
        fertilizer: 100, // kg per hectare
        water: 5000, // cubic meters per hectare
        labor: 150 // man-days per hectare
      },
      'wheat': {
        seeds: 100,
        fertilizer: 120,
        water: 4000,
        labor: 120
      },
      'maize': {
        seeds: 25,
        fertilizer: 80,
        water: 3500,
        labor: 100
      }
    };

    const base = baseRequirements[cropType] || {
      seeds: 50,
      fertilizer: 100,
      water: 4000,
      labor: 120
    };

    return {
      seeds: (base.seeds * areaInHectares).toFixed(2) + ' kg',
      fertilizer: (base.fertilizer * areaInHectares).toFixed(2) + ' kg',
      water: (base.water * areaInHectares).toFixed(2) + ' cubic meters',
      labor: (base.labor * areaInHectares).toFixed(0) + ' man-days',
      areaInHectares
    };
  }

  /**
   * Get current season
   */
  getCurrentSeason() {
    const month = new Date().getMonth();

    if (month >= 6 && month <= 9) return 'kharif';
    if (month >= 10 && month <= 2) return 'rabi';
    return 'zaid';
  }

  /**
   * Update crop plan status
   */
  async updateCropPlanStatus(planId, farmerId, status, updateData = {}) {
    try {
      const query = `
        UPDATE crop_plans
        SET 
          status = $1,
          actual_yield = COALESCE($2, actual_yield),
          harvest_date = COALESCE($3, harvest_date),
          notes = COALESCE($4, notes),
          updated_at = NOW()
        WHERE id = $5 AND farmer_id = $6
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        status,
        updateData.actualYield,
        updateData.harvestDate,
        updateData.notes,
        planId,
        farmerId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Crop plan not found or unauthorized');
      }

      logger.info(`Crop plan ${planId} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating crop plan status', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get crop planning analytics
   */
  async getCropPlanningAnalytics(farmerId) {
    try {
      const query = `
        SELECT 
          crop_type,
          season,
          COUNT(*) as plan_count,
          AVG(estimated_yield) as avg_estimated_yield,
          AVG(COALESCE(actual_yield, 0)) as avg_actual_yield,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_plans,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_plans
        FROM crop_plans
        WHERE farmer_id = $1
        GROUP BY crop_type, season
        ORDER BY plan_count DESC
      `;

      const result = await this.pool.query(query, [farmerId]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting crop planning analytics', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new CropPlanningService();

// Merged from backend/src/modules/M069
{
  const m069 = require("../../modules/M069/service");
  const { ...rest } = m069;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M079
{
  const m079 = require("../../modules/M079/service");
  const { ...rest } = m079;
  Object.assign(module.exports, rest);
}
