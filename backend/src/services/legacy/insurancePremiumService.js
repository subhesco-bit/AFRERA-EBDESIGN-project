/**
 * Insurance Premium Calculation Service
 * Handles premium calculation for various insurance types
 */

const { logger } = require('../../../utils/logger');

class InsurancePremiumService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../../database/pool');
  }

  /**
   * Calculate crop insurance premium (PMFBY)
   */
  async calculateCropPremium(cropData) {
    const {
      cropType,
      areaInHectares,
      sumInsuredPerHectare,
      location,
      farmerId,
      season
    } = cropData;

    try {
      // Get risk factors for location and crop
      const riskFactors = await this.getLocationRiskFactors(location, cropType);

      // Base premium rate (typically 2-15% of sum insured)
      const baseRate = 0.05; // 5% base rate

      // Adjust based on risk factors
      const riskMultiplier = 1 + (riskFactors.floodRisk * 0.3) +
                               (riskFactors.droughtRisk * 0.4) +
                               (riskFactors.pestRisk * 0.2);

      // Seasonal adjustment
      const seasonalAdjustment = season === 'kharif' ? 1.1 : 1.0;

      // Government subsidy (typically 50% for PMFBY)
      const subsidyRate = 0.5;

      const sumInsured = areaInHectares * sumInsuredPerHectare;
      const grossPremium = sumInsured * baseRate * riskMultiplier * seasonalAdjustment;
      const subsidyAmount = grossPremium * subsidyRate;
      const netPremium = grossPremium - subsidyAmount;

      return {
        cropType,
        areaInHectares,
        sumInsured,
        baseRate: (baseRate * 100).toFixed(2) + '%',
        riskMultiplier: riskMultiplier.toFixed(2),
        grossPremium: grossPremium.toFixed(2),
        subsidyRate: (subsidyRate * 100).toFixed(2) + '%',
        subsidyAmount: subsidyAmount.toFixed(2),
        netPremium: netPremium.toFixed(2),
        riskFactors,
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error calculating crop premium', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Calculate transit insurance premium
   */
  async calculateTransitPremium(transitData) {
    const {
      shipmentValue,
      origin,
      destination,
      transportMode,
      distance,
      goodsType,
      duration
    } = transitData;

    try {
      // Base rates by transport mode
      const transportRates = {
        'road': 0.008,    // 0.8% of value
        'rail': 0.006,    // 0.6% of value
        'air': 0.015,     // 1.5% of value
        'sea': 0.004,     // 0.4% of value
        'multimodal': 0.01 // 1.0% of value
      };

      let baseRate = transportRates[transportMode] || 0.01;

      // Risk factors based on route
      const routeRisk = await this.getRouteRisk(origin, destination);

      // Duration risk (longer duration = higher risk)
      const durationRisk = Math.min(duration / 30, 2); // Max 2x for 30+ days

      // Goods type risk
      const goodsRiskFactors = {
        'perishable': 1.5,
        'fragile': 1.3,
        'hazardous': 2.0,
        'high_value': 1.8,
        'general': 1.0
      };
      const goodsRisk = goodsRiskFactors[goodsType] || 1.0;

      let grossPremium = shipmentValue * baseRate * routeRisk * durationRisk * goodsRisk;

      return {
        shipmentValue,
        transportMode,
        distance,
        duration,
        baseRate: (baseRate * 100).toFixed(2) + '%',
        routeRisk: routeRisk.toFixed(2),
        durationRisk: durationRisk.toFixed(2),
        goodsRisk: goodsRisk.toFixed(2),
        grossPremium: grossPremium.toFixed(2),
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error calculating transit premium', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Calculate warehouse insurance premium
   */
  async calculateWarehousePremium(warehouseData) {
    const {
      warehouseValue,
      location,
      buildingType,
      contentsValue,
      fireProtection,
      securityLevel
    } = warehouseData;

    try {
      // Base rate for building
      const buildingRates = {
        'concrete': 0.003,  // 0.3%
        'brick': 0.004,     // 0.4%
        'mixed': 0.005,    // 0.5%
        'temporary': 0.008 // 0.8%
      };

      const buildingRate = buildingRates[buildingType] || 0.005;

      // Location risk
      const locationRisk = await this.getLocationRisk(location);

      // Fire protection discount
      const fireDiscount = fireProtection === 'yes' ? 0.85 : 1.0;

      // Security discount
      const securityDiscount = securityLevel === 'high' ? 0.9 :
                              securityLevel === 'medium' ? 0.95 : 1.0;

      const buildingPremium = warehouseValue * buildingRate * locationRisk * fireDiscount * securityDiscount;
      const contentsPremium = contentsValue * 0.006 * locationRisk; // 0.6% for contents

      const totalPremium = buildingPremium + contentsPremium;

      return {
        warehouseValue,
        contentsValue,
        buildingType,
        buildingRate: (buildingRate * 100).toFixed(2) + '%',
        locationRisk: locationRisk.toFixed(2),
        fireDiscount: (fireDiscount * 100).toFixed(0) + '%',
        securityDiscount: (securityDiscount * 100).toFixed(0) + '%',
        buildingPremium: buildingPremium.toFixed(2),
        contentsPremium: contentsPremium.toFixed(2),
        totalPremium: totalPremium.toFixed(2),
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error calculating warehouse premium', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Calculate livestock insurance premium
   */
  async calculateLivestockPremium(livestockData) {
    const {
      animalType,
      count,
      valuePerAnimal,
      age,
      healthStatus,
      location
    } = livestockData;

    try {
      // Base rates by animal type
      const animalRates = {
        'cattle': 0.04,     // 4%
        'buffalo': 0.045,   // 4.5%
        'goat': 0.05,      // 5%
        'sheep': 0.055,    // 5.5%
        'poultry': 0.08,   // 8%
        'pig': 0.06        // 6%
      };

      let baseRate = animalRates[animalType] || 0.05;

      // Age factor (older animals = higher risk)
      const ageFactor = age > 5 ? 1.3 : age > 3 ? 1.1 : 1.0;

      // Health status
      const healthFactor = healthStatus === 'excellent' ? 0.9 :
                          healthStatus === 'good' ? 1.0 :
                          healthStatus === 'fair' ? 1.2 : 1.5;

      // Location risk
      let locationRisk = await this.getLocationRisk(location);

      const totalValue = count * valuePerAnimal;
      let grossPremium = totalValue * baseRate * ageFactor * healthFactor * locationRisk;

      return {
        animalType,
        count,
        valuePerAnimal,
        totalValue,
        age,
        healthStatus,
        baseRate: (baseRate * 100).toFixed(2) + '%',
        ageFactor: ageFactor.toFixed(2),
        healthFactor: healthFactor.toFixed(2),
        locationRisk: locationRisk.toFixed(2),
        grossPremium: grossPremium.toFixed(2),
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error calculating livestock premium', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get location risk factors
   */
  async getLocationRiskFactors(location, cropType) {
    try {
      // In production, this would query a risk database
      // For now, return simulated risk factors
      const riskDatabase = {
        'assam': {
          floodRisk: 0.8,
          droughtRisk: 0.3,
          pestRisk: 0.6
        },
        'meghalaya': {
          floodRisk: 0.6,
          droughtRisk: 0.2,
          pestRisk: 0.5
        },
        'manipur': {
          floodRisk: 0.5,
          droughtRisk: 0.4,
          pestRisk: 0.4
        },
        'nagaland': {
          floodRisk: 0.4,
          droughtRisk: 0.3,
          pestRisk: 0.3
        },
        'tripura': {
          floodRisk: 0.7,
          droughtRisk: 0.2,
          pestRisk: 0.5
        }
      };

      const state = location.toLowerCase().split(' ')[0];
      return riskDatabase[state] || {
        floodRisk: 0.5,
        droughtRisk: 0.3,
        pestRisk: 0.4
      };
    } catch (error) {
      logger.error('Error getting location risk factors', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get route risk for transit
   */
  async getRouteRisk(origin, destination) {
    try {
      // Simulated route risk calculation
      // In production, use actual route data and historical incident rates
      const highRiskRoutes = [
        { from: 'assam', to: 'meghalaya', risk: 1.3 },
        { from: 'manipur', to: 'nagaland', risk: 1.4 }
      ];

      const routeKey = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
      const route = highRiskRoutes.find(r => routeKey.includes(r.from) && routeKey.includes(r.to));

      return route ? route.risk : 1.0;
    } catch (error) {
      logger.error('Error getting route risk', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get location risk for warehouse
   */
  async getLocationRisk(location) {
    try {
      const highRiskLocations = ['assam', 'meghalaya', 'manipur'];
      let state = location.toLowerCase().split(' ')[0];

      return highRiskLocations.includes(state) ? 1.2 : 1.0;
    } catch (error) {
      logger.error('Error getting location risk', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Generate premium quote
   */
  async generateQuote(quoteData) {
    const { insuranceType, policyholderId, ...riskData } = quoteData;

    try {
      let premiumCalculation;

      switch (insuranceType) {
        case 'crop':
          premiumCalculation = await this.calculateCropPremium(riskData);
          break;
        case 'transit':
          premiumCalculation = await this.calculateTransitPremium(riskData);
          break;
        case 'warehouse':
          premiumCalculation = await this.calculateWarehousePremium(riskData);
          break;
        case 'livestock':
          premiumCalculation = await this.calculateLivestockPremium(riskData);
          break;
        default:
          throw new Error('Unknown insurance type');
      }

      // Save quote to database
      const quoteQuery = `
        INSERT INTO insurance_quotes 
        (policyholder_id, insurance_type, premium_data, status, valid_until)
        VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '30 days')
        RETURNING *
      `;

      const result = await this.pool.query(quoteQuery, [
        policyholderId,
        insuranceType,
        JSON.stringify(premiumCalculation)
      ]);

      return {
        quoteId: result.rows[0].id,
        insuranceType,
        policyholderId,
        premiumCalculation,
        validUntil: result.rows[0].valid_until,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error generating quote', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get quote by ID
   */
  async getQuote(quoteId) {
    try {
      const query = `
        SELECT 
          iq.*,
          u.name as policyholder_name
        FROM insurance_quotes iq
        JOIN users u ON iq.policyholder_id = u.id
        WHERE iq.id = $1
      `;

      let result = await this.pool.query(query, [quoteId]);

      if (result.rows.length === 0) {
        throw new Error('Quote not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting quote', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new InsurancePremiumService();

