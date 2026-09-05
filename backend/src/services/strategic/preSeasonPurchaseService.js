/**
 * Pre-Season Purchase Service
 * Strategic implementation for advance agricultural purchase agreements
 * 
 * Business Concept: Pre-season purchase agreements allow buyers to commit to 
 * agricultural output before planting, providing farmers with guaranteed income 
 * and buyers with supply security.
 */

const { Pool } = require('pg');
const logger = require('../../utils/logger');

class PreSeasonPurchaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  /**
   * Create a new pre-season purchase agreement
   * @param {Object} agreementData - Agreement details
   * @returns {Object} Created agreement with ID
   */
  async createAgreement(agreementData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate farmer eligibility
      const farmerEligibility = await this.validateFarmerEligibility(
        client, 
        agreementData.farmer_id
      );
      
      if (!farmerEligibility.eligible) {
        throw new Error(`Farmer not eligible: ${farmerEligibility.reason}`);
      }
      
      // Calculate fair price based on historical data + risk premium
      const fairPrice = await this.calculateFairPrice(
        client,
        agreementData.crop_id,
        agreementData.variety_id,
        agreementData.quantity
      );
      
      // Generate agreement ID and create record
      const agreementResult = await client.query(
        `INSERT INTO pre_season_agreements 
         (farmer_id, buyer_id, crop_id, variety_id, agreed_quantity, agreed_price, 
          delivery_date, quality_standards, risk_sharing_model, price_floor, 
          revenue_share_percentage, input_financing_included, input_financing_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id, created_at`,
        [
          agreementData.farmer_id,
          agreementData.buyer_id,
          agreementData.crop_id,
          agreementData.variety_id,
          agreementData.quantity,
          fairPrice.finalPrice,
          agreementData.delivery_date,
          JSON.stringify(agreementData.quality_standards || {}),
          agreementData.risk_sharing_model || 'price_floor',
          fairPrice.priceFloor,
          agreementData.revenue_share_percentage || null,
          agreementData.input_financing_included || false,
          agreementData.input_financing_amount || null
        ]
      );
      
      const agreementId = agreementResult.rows[0].id;
      
      // Create initial milestones
      await this.createInitialMilestones(client, agreementId, agreementData);
      
      // Generate smart contract reference (placeholder for blockchain integration)
      const smartContractRef = await this.generateSmartContractReference(
        agreementId,
        agreementData
      );
      
      await client.query(
        `UPDATE pre_season_agreements 
         SET smart_contract_address = $1, blockchain_tx_hash = $2
         WHERE id = $3`,
        [smartContractRef.address, smartContractRef.txHash, agreementId]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Pre-season agreement created: ${agreementId}`);
      
      return {
        success: true,
        agreement: {
          id: agreementId,
          farmer_id: agreementData.farmer_id,
          buyer_id: agreementData.buyer_id,
          agreed_price: fairPrice.finalPrice,
          price_floor: fairPrice.priceFloor,
          smart_contract: smartContractRef,
          created_at: agreementResult.rows[0].created_at
        },
        price_breakdown: fairPrice
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating pre-season agreement: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate farmer eligibility for pre-season agreement
   * @param {Object} client - Database client
   * @param {string} farmerId - Farmer ID
   * @returns {Object} Eligibility result
   */
  async validateFarmerEligibility(client, farmerId) {
    try {
      // Check farmer credit score
      const creditResult = await client.query(
        `SELECT credit_score, land_verification_status, active_disputes
         FROM farmers 
         WHERE id = $1`,
        [farmerId]
      );
      
      if (creditResult.rows.length === 0) {
        return { eligible: false, reason: 'Farmer not found' };
      }
      
      const farmer = creditResult.rows[0];
      
      // Check credit score threshold
      if (farmer.credit_score < 600) {
        return { eligible: false, reason: 'Credit score below threshold (600)' };
      }
      
      // Check land verification
      if (farmer.land_verification_status !== 'verified') {
        return { eligible: false, reason: 'Land ownership not verified' };
      }
      
      // Check for active disputes
      if (farmer.active_disputes > 0) {
        return { eligible: false, reason: 'Active disputes exist' };
      }
      
      return { eligible: true, credit_score: farmer.credit_score };
      
    } catch (error) {
      logger.error(`Error validating farmer eligibility: ${error.message}`);
      return { eligible: false, reason: 'Validation error' };
    }
  }

  /**
   * Calculate fair price based on historical data and risk factors
   * @param {Object} client - Database client
   * @param {string} cropId - Crop ID
   * @param {string} varietyId - Variety ID
   * @param {number} quantity - Quantity in tons
   * @returns {Object} Price calculation result
   */
  async calculateFairPrice(client, cropId, varietyId, quantity) {
    try {
      // Get historical price data
      const historicalPriceResult = await client.query(
        `SELECT AVG(price_per_unit) as avg_price, 
                STDDEV(price_per_unit) as price_volatility,
                MIN(price_per_unit) as min_price,
                MAX(price_per_unit) as max_price
         FROM market_prices 
         WHERE crop_id = $1 AND variety_id = $2 
         AND price_date >= NOW() - INTERVAL '12 months'
         GROUP BY crop_id, variety_id`,
        [cropId, varietyId]
      );
      
      if (historicalPriceResult.rows.length === 0) {
        // Fallback to regional variety directory if no market data
        const varietyResult = await client.query(
          `SELECT indicative_price_min, indicative_price_max
           FROM regional_variety_directory 
           WHERE id = $1`,
          [varietyId]
        );
        
        if (varietyResult.rows.length > 0) {
          const variety = varietyResult.rows[0];
          const avgPrice = (variety.indicative_price_min + variety.indicative_price_max) / 2;
          const priceVolatility = (variety.indicative_price_max - variety.indicative_price_min) / 2;
          
          return this.calculateRiskAdjustedPrice(avgPrice, priceVolatility, quantity);
        }
        
        throw new Error('No price data available for this crop/variety');
      }
      
      const priceData = historicalPriceResult.rows[0];
      return this.calculateRiskAdjustedPrice(
        priceData.avg_price,
        priceData.price_volatility,
        quantity
      );
      
    } catch (error) {
      logger.error(`Error calculating fair price: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate risk-adjusted price with premium
   * @param {number} basePrice - Base price from historical data
   * @param {number} volatility - Price volatility
   * @param {number} quantity - Order quantity
   * @returns {Object} Risk-adjusted price structure
   */
  calculateRiskAdjustedPrice(basePrice, volatility, quantity) {
    // Risk premium based on volatility (typically 5-15% of base price)
    const riskPremiumRate = Math.min(volatility / basePrice * 100, 15) / 100;
    const riskPremium = basePrice * riskPremiumRate;
    
    // Volume discount for larger orders (2-5% discount for orders > 10 tons)
    let volumeDiscount = 0;
    if (quantity > 10) {
      volumeDiscount = Math.min((quantity - 10) * 0.001, 0.05);
    }
    
    const finalPrice = basePrice + riskPremium - (basePrice * volumeDiscount);
    const priceFloor = basePrice * 0.85; // 15% below base price as safety floor
    
    return {
      basePrice: Math.round(basePrice * 100) / 100,
      riskPremium: Math.round(riskPremium * 100) / 100,
      volumeDiscount: Math.round(volumeDiscount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      priceFloor: Math.round(priceFloor * 100) / 100,
      calculation: {
        risk_premium_rate: riskPremiumRate,
        volume_discount_rate: volumeDiscount
      }
    };
  }

  /**
   * Create initial milestones for agreement
   * @param {Object} client - Database client
   * @param {string} agreementId - Agreement ID
   * @param {Object} agreementData - Agreement data
   */
  async createInitialMilestones(client, agreementId, agreementData) {
    const milestones = [
      {
        type: 'planting',
        target_date: this.adjustDate(agreementData.delivery_date, -120), // ~4 months before delivery
        status: 'pending'
      },
      {
        type: 'input_application',
        target_date: this.adjustDate(agreementData.delivery_date, -90), // ~3 months before delivery
        status: 'pending'
      },
      {
        type: 'growth_stage',
        target_date: this.adjustDate(agreementData.delivery_date, -60), // ~2 months before delivery
        status: 'pending'
      },
      {
        type: 'harvest',
        target_date: this.adjustDate(agreementData.delivery_date, -30), // ~1 month before delivery
        status: 'pending'
      }
    ];
    
    for (const milestone of milestones) {
      await client.query(
        `INSERT INTO pre_season_milestones 
         (agreement_id, milestone_type, target_date, status)
         VALUES ($1, $2, $3, $4)`,
        [agreementId, milestone.type, milestone.target_date, milestone.status]
      );
    }
  }

  /**
   * Generate smart contract reference (placeholder for blockchain integration)
   * @param {string} agreementId - Agreement ID
   * @param {Object} agreementData - Agreement data
   * @returns {Object} Smart contract reference
   */
  async generateSmartContractReference(agreementId, agreementData) {
    // Placeholder for blockchain integration
    // In production, this would interact with Ethereum/similar blockchain
    return {
      address: `0x${agreementId.replace(/-/g, '').substring(0, 40)}`,
      txHash: null, // Will be populated after actual blockchain deployment
      network: 'ethereum',
      status: 'pending_deployment'
    };
  }

  /**
   * Track agreement progress and milestones
   * @param {string} agreementId - Agreement ID
   * @returns {Object} Agreement progress
   */
  async trackProgress(agreementId) {
    try {
      let client = await this.pool.connect();
      
      try {
        // Get agreement details
        let agreementResult = await client.query(
          `SELECT a.*, f.name as farmer_name, b.name as buyer_name,
                  c.name as crop_name, v.variety_name
           FROM pre_season_agreements a
           JOIN farmers f ON a.farmer_id = f.id
           JOIN buyers b ON a.buyer_id = b.id
           JOIN crops c ON a.crop_id = c.id
           JOIN regional_variety_directory v ON a.variety_id = v.id
           WHERE a.id = $1`,
          [agreementId]
        );
        
        if (agreementResult.rows.length === 0) {
          throw new Error('Agreement not found');
        }
        
        const agreement = agreementResult.rows[0];
        
        // Get milestones
        const milestonesResult = await client.query(
          `SELECT * FROM pre_season_milestones 
           WHERE agreement_id = $1 
           ORDER BY target_date ASC`,
          [agreementId]
        );
        
        // Calculate progress percentage
        const completedMilestones = milestonesResult.rows.filter(
          m => m.status === 'completed'
        ).length;
        const progressPercentage = (completedMilestones / milestonesResult.rows.length) * 100;
        
        client.release();
        
        return {
          agreement: {
            id: agreement.id,
            farmer_name: agreement.farmer_name,
            buyer_name: agreement.buyer_name,
            crop: agreement.crop_name,
            variety: agreement.variety_name,
            quantity: agreement.agreed_quantity,
            price: agreement.agreed_price,
            delivery_date: agreement.delivery_date,
            status: agreement.settlement_status || 'active'
          },
          milestones: milestonesResult.rows,
          progress: {
            percentage: Math.round(progressPercentage),
            completed: completedMilestones,
            total: milestonesResult.rows.length,
            next_milestone: milestonesResult.rows.find(m => m.status === 'pending') || null
          }
        };
        
      } finally {
        client.release();
    }
    } catch (error) {
      logger.error(`Error tracking agreement progress: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update milestone status
   * @param {string} milestoneId - Milestone ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated milestone
   */
  async updateMilestone(milestoneId, updateData) {
    try {
      const result = await this.pool.query(
        `UPDATE pre_season_milestones 
         SET status = $1, actual_date = $2, notes = $3, verification_data = $4
         WHERE id = $5
         RETURNING *`,
        [
          updateData.status,
          updateData.actual_date || new Date(),
          updateData.notes || null,
          JSON.stringify(updateData.verification_data || {}),
          milestoneId
        ]
      );
      
      logger.info(`Milestone updated: ${milestoneId}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error(`Error updating milestone: ${error.message}`);
      throw error;
    }
  }

  /**
   * Settle agreement - final payment and quality verification
   * @param {string} agreementId - Agreement ID
   * @param {Object} settlementData - Settlement data
   * @returns {Object} Settlement result
   */
  async settleAgreement(agreementId, settlementData) {
    let client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get agreement details
      let agreementResult = await client.query(
        `SELECT * FROM pre_season_agreements WHERE id = $1`,
        [agreementId]
      );
      
      if (agreementResult.rows.length === 0) {
        throw new Error('Agreement not found');
      }
      
      let agreement = agreementResult.rows[0];
      
      // Verify quality
      const qualityVerification = await this.verifyQuality(
        client,
        agreementId,
        settlementData.quality_data
      );
      
      // Calculate final price based on quality and market conditions
      let finalPrice = await this.calculateFinalPrice(
        client,
        agreement,
        qualityVerification,
        settlementData.actual_quantity
      );
      
      // Update agreement with settlement details
      await client.query(
        `UPDATE pre_season_agreements 
         SET settlement_status = 'completed',
             actual_yield = $1,
             quality_score = $2,
             final_price = $3,
             settlement_date = $4
         WHERE id = $5`,
        [
          settlementData.actual_quantity,
          qualityVerification.score,
          finalPrice.final_amount,
          new Date(),
          agreementId
        ]
      );
      
      // Process payment (integrate with payment service)
      const paymentResult = await this.processPayment(
        client,
        agreement.farmer_id,
        finalPrice.final_amount,
        agreementId
      );
      
      await client.query('COMMIT');
      
      logger.info(`Agreement settled: ${agreementId}`);
      
      return {
        success: true,
        settlement: {
          agreement_id: agreementId,
          final_amount: finalPrice.final_amount,
          quality_score: qualityVerification.score,
          actual_quantity: settlementData.actual_quantity,
          price_adjustment: finalPrice.adjustment,
          payment_reference: paymentResult.reference
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error settling agreement: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Verify quality against agreement standards
   * @param {Object} client - Database client
   * @param {string} agreementId - Agreement ID
   * @param {Object} qualityData - Quality data from testing
   * @returns {Object} Quality verification result
   */
  async verifyQuality(client, agreementId, qualityData) {
    try {
      // Get agreement quality standards
      let agreementResult = await client.query(
        `SELECT quality_standards FROM pre_season_agreements WHERE id = $1`,
        [agreementId]
      );
      
      const standards = agreementResult.rows[0].quality_standards;
      
      // Compare actual quality against standards
      let score = 100;
      const deviations = [];
      
      for (const [parameter, standard] of Object.entries(standards)) {
        if (qualityData[parameter]) {
          const actual = qualityData[parameter];
          const deviation = Math.abs((actual - standard) / standard);
          
          if (deviation > 0.1) { // 10% tolerance
            score -= (deviation * 50); // Penalize significantly
            deviations.push({
              parameter,
              standard,
              actual,
              deviation: (deviation * 100).toFixed(2) + '%'
            });
          }
        }
      }
      
      return {
        score: Math.max(0, Math.round(score)),
        passed: score >= 70, // 70% threshold
        deviations,
        verified_at: new Date()
      };
      
    } catch (error) {
      logger.error(`Error verifying quality: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate final price with quality and market adjustments
   * @param {Object} client - Database client
   * @param {Object} agreement - Agreement data
   * @param {Object} qualityVerification - Quality verification result
   * @param {number} actualQuantity - Actual delivered quantity
   * @returns {Object} Final price calculation
   */
  async calculateFinalPrice(client, agreement, qualityVerification, actualQuantity) {
    try {
      let finalAmount = agreement.agreed_price * actualQuantity;
      const adjustments = [];
      
      // Quality adjustment
      if (qualityVerification.score < 90) {
        const qualityPenalty = (90 - qualityVerification.score) / 100;
        const qualityAdjustment = finalAmount * qualityPenalty;
        finalAmount -= qualityAdjustment;
        adjustments.push({
          type: 'quality_penalty',
          amount: -qualityAdjustment,
          reason: `Quality score ${qualityVerification.score}% below 90% threshold`
        });
      } else if (qualityVerification.score > 95) {
        const qualityBonus = (qualityVerification.score - 95) / 100;
        let qualityAdjustment = finalAmount * qualityBonus;
        finalAmount += qualityAdjustment;
        adjustments.push({
          type: 'quality_bonus',
          amount: qualityAdjustment,
          reason: `Quality score ${qualityVerification.score}% exceeded 95% threshold`
        });
      }
      
      // Market price adjustment (if price floor is triggered)
      const currentMarketPrice = await this.getCurrentMarketPrice(
        client,
        agreement.crop_id,
        agreement.variety_id
      );
      
      if (currentMarketPrice < agreement.price_floor) {
        const marketAdjustment = (agreement.price_floor - currentMarketPrice) * actualQuantity;
        finalAmount += marketAdjustment;
        adjustments.push({
          type: 'price_floor_protection',
          amount: marketAdjustment,
          reason: `Market price ₹${currentMarketPrice} below floor ₹${agreement.price_floor}`
        });
      }
      
      return {
        base_amount: agreement.agreed_price * actualQuantity,
        final_amount: Math.round(finalAmount * 100) / 100,
        adjustment: Math.round((finalAmount - (agreement.agreed_price * actualQuantity)) * 100) / 100,
        adjustments,
        per_unit_price: Math.round((finalAmount / actualQuantity) * 100) / 100
      };
      
    } catch (error) {
      logger.error(`Error calculating final price: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current market price for crop/variety
   * @param {Object} client - Database client
   * @param {string} cropId - Crop ID
   * @param {string} varietyId - Variety ID
   * @returns {number} Current market price
   */
  async getCurrentMarketPrice(client, cropId, varietyId) {
    try {
      let result = await client.query(
        `SELECT AVG(price_per_unit) as current_price
         FROM market_prices 
         WHERE crop_id = $1 AND variety_id = $2 
         AND price_date >= NOW() - INTERVAL '7 days'
         GROUP BY crop_id, variety_id`,
        [cropId, varietyId]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0].current_price;
      }
      
      // Fallback to agreed price if no current market data
      return null;
      
    } catch (error) {
      logger.error(`Error getting current market price: ${error.message}`);
      return null;
    }
  }

  /**
   * Process payment to farmer
   * @param {Object} client - Database client
   * @param {string} farmerId - Farmer ID
   * @param {number} amount - Payment amount
   * @param {string} agreementId - Agreement ID
   * @returns {Object} Payment result
   */
  async processPayment(client, farmerId, amount, agreementId) {
    try {
      // Get farmer bank details
      const farmerResult = await client.query(
        `SELECT bank_account_number, bank_ifsc_code FROM farmers WHERE id = $1`,
        [farmerId]
      );
      
      if (farmerResult.rows.length === 0) {
        throw new Error('Farmer bank details not found');
      }
      
      let farmer = farmerResult.rows[0];
      
      // Integrate with payment service (placeholder)
      // In production, this would call actual payment gateway API
      const paymentReference = `PAY-${Date.now()}-${agreementId.substring(0, 8)}`;
      
      // Record payment transaction
      await client.query(
        `INSERT INTO payment_transactions 
         (farmer_id, amount, payment_reference, transaction_type, status, related_agreement_id)
         VALUES ($1, $2, $3, 'settlement', 'completed', $4)`,
        [farmerId, amount, paymentReference, agreementId]
      );
      
      return {
        success: true,
        reference: paymentReference,
        amount: amount,
        bank_account: farmer.bank_account_number,
        processed_at: new Date()
      };
      
    } catch (error) {
      logger.error(`Error processing payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper function to adjust date by days
   * @param {Date} date - Original date
   * @param {number} days - Days to adjust (negative for past)
   * @returns {Date} Adjusted date
   */
  adjustDate(date, days) {
    const adjusted = new Date(date);
    adjusted.setDate(adjusted.getDate() + days);
    return adjusted;
  }

  /**
   * Get available pre-season opportunities for farmers
   * @param {string} farmerId - Farmer ID
   * @returns {Array} Available opportunities
   */
  async getAvailableOpportunities(farmerId) {
    try {
      let result = await this.pool.query(
        `SELECT o.id, o.buyer_id, b.name as buyer_name, o.crop_id, 
                c.name as crop_name, o.variety_id, v.variety_name,
                o.quantity_required, o.offered_price, o.delivery_date,
                o.quality_requirements, o.deadline
         FROM pre_season_opportunities o
         JOIN buyers b ON o.buyer_id = b.id
         JOIN crops c ON o.crop_id = c.id
         JOIN regional_variety_directory v ON o.variety_id = v.id
         WHERE o.status = 'open' 
         AND o.deadline > NOW()
         ORDER BY o.deadline ASC
         LIMIT 20`
      );
      
      return result.rows;
      
    } catch (error) {
      logger.error(`Error getting available opportunities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get buyer's pre-season portfolio
   * @param {string} buyerId - Buyer ID
   * @returns {Object} Buyer portfolio summary
   */
  async getBuyerPortfolio(buyerId) {
    try {
      let client = await this.pool.connect();
      
      try {
        // Get portfolio summary
        const summaryResult = await client.query(
          `SELECT COUNT(*) as total_agreements,
                  SUM(agreed_quantity) as total_quantity,
                  SUM(agreed_price * agreed_quantity) as total_value,
                  AVG(CASE WHEN settlement_status = 'completed' THEN quality_score END) as avg_quality_score
           FROM pre_season_agreements 
           WHERE buyer_id = $1`,
          [buyerId]
        );
        
        // Get status breakdown
        const statusResult = await client.query(
          `SELECT settlement_status, COUNT(*) as count, 
                  SUM(agreed_quantity) as quantity,
                  SUM(agreed_price * agreed_quantity) as value
           FROM pre_season_agreements 
           WHERE buyer_id = $1
           GROUP BY settlement_status`
        );
        
        // Get regional distribution
        const regionResult = await client.query(
          `SELECT f.district, f.state, 
                  COUNT(*) as agreement_count,
                  SUM(a.agreed_quantity) as total_quantity
           FROM pre_season_agreements a
           JOIN farmers f ON a.farmer_id = f.id
           WHERE a.buyer_id = $1
           GROUP BY f.district, f.state
           ORDER BY total_quantity DESC`
        );
        
        client.release();
        
        return {
          summary: summaryResult.rows[0],
          status_breakdown: statusResult.rows,
          regional_distribution: regionResult.rows
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error getting buyer portfolio: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PreSeasonPurchaseService;