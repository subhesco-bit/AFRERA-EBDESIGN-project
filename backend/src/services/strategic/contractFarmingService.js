/**
 * Contract Farming Service
 * Strategic implementation for contract farming agreements with technical guidance
 * 
 * Business Concept: Contract farming involves agreements between farmers and buyers
 * for agricultural production with specified technical guidance, input supply, and 
 * output purchase guarantees.
 */

const { Pool } = require('pg');
const logger = require('../../utils/logger');

class ContractFarmingService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  /**
   * Create a new contract farming agreement
   * @param {Object} contractData - Contract details
   * @returns {Object} Created contract with ID
   */
  async createContract(contractData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate farmer eligibility for contract farming
      const farmerEligibility = await this.validateContractEligibility(
        client, 
        contractData.farmer_id
      );
      
      if (!farmerEligibility.eligible) {
        throw new Error(`Farmer not eligible for contract farming: ${farmerEligibility.reason}`);
      }
      
      // Create technical package if not provided
      const technicalPackage = contractData.technical_package_id 
        ? await this.getTechnicalPackage(client, contractData.technical_package_id)
        : await this.generateDefaultTechnicalPackage(client, contractData);
      
      // Calculate quality bonus structure
      const qualityBonusStructure = this.calculateQualityBonusStructure(
        contractData.quality_standards || {}
      );
      
      // Create contract record
      const contractResult = await client.query(
        `INSERT INTO contract_farming_agreements 
         (farmer_id, buyer_id, technical_package_id, crop_variety, area_hectares,
          expected_yield_tons, contract_period_start, contract_period_end,
          seed_variety, fertilizer_schedule, irrigation_schedule, pest_management_protocol,
          quality_standards, input_supplier_id, input_credit_amount, input_delivery_schedule,
          technical_advisor_id, assistance_schedule, training_programs,
          base_price, quality_bonus_structure, payment_schedule)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         RETURNING id, created_at`,
        [
          contractData.farmer_id,
          contractData.buyer_id,
          contractData.technical_package_id || null,
          contractData.crop_variety,
          contractData.area_hectares,
          contractData.expected_yield_tons,
          contractData.contract_period_start,
          contractData.contract_period_end,
          technicalPackage.seed_variety,
          JSON.stringify(technicalPackage.fertilizer_schedule || {}),
          JSON.stringify(technicalPackage.irrigation_schedule || {}),
          JSON.stringify(technicalPackage.pest_management_protocol || {}),
          JSON.stringify(contractData.quality_standards || {}),
          contractData.input_supplier_id || null,
          contractData.input_credit_amount || null,
          JSON.stringify(contractData.input_delivery_schedule || {}),
          contractData.technical_advisor_id || null,
          JSON.stringify(contractData.assistance_schedule || {}),
          JSON.stringify(contractData.training_programs || []),
          contractData.base_price,
          JSON.stringify(qualityBonusStructure),
          JSON.stringify(contractData.payment_schedule || {})
        ]
      );
      
      const contractId = contractResult.rows[0].id;
      
      // Create quality testing schedule
      await this.createQualityTestingSchedule(client, contractId, contractData);
      
      // Generate smart contract reference
      const smartContractRef = await this.generateSmartContractReference(
        contractId,
        contractData
      );
      
      await client.query(
        `UPDATE contract_farming_agreements 
         SET smart_contract_address = $1, blockchain_tx_hash = $2
         WHERE id = $3`,
        [smartContractRef.address, smartContractRef.txHash, contractId]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Contract farming agreement created: ${contractId}`);
      
      return {
        success: true,
        contract: {
          id: contractId,
          farmer_id: contractData.farmer_id,
          buyer_id: contractData.buyer_id,
          technical_package: technicalPackage,
          quality_bonus_structure: qualityBonusStructure,
          smart_contract: smartContractRef,
          created_at: contractResult.rows[0].created_at
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating contract farming agreement: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate farmer eligibility for contract farming
   * @param {Object} client - Database client
   * @param {string} farmerId - Farmer ID
   * @returns {Object} Eligibility result
   */
  async validateContractEligibility(client, farmerId) {
    try {
      // Check farmer's land and resources
      const farmerResult = await client.query(
        `SELECT total_land_hectares, irrigation_access, 
                equipment_availability, previous_contract_performance
         FROM farmers 
         WHERE id = $1`,
        [farmerId]
      );
      
      if (farmerResult.rows.length === 0) {
        return { eligible: false, reason: 'Farmer not found' };
      }
      
      const farmer = farmerResult.rows[0];
      
      // Minimum land requirement (typically 2 hectares for commercial contracts)
      if (farmer.total_land_hectares < 2) {
        return { eligible: false, reason: 'Land holding below minimum requirement (2 hectares)' };
      }
      
      // Irrigation access requirement
      if (!farmer.irrigation_access) {
        return { eligible: false, reason: 'No irrigation access available' };
      }
      
      // Check previous contract performance if exists
      if (farmer.previous_contract_performance && farmer.previous_contract_performance < 70) {
        return { eligible: false, reason: 'Previous contract performance below threshold (70%)' };
      }
      
      return { 
        eligible: true, 
        land_hectares: farmer.total_land_hectares,
        irrigation_available: farmer.irrigation_access
      };
      
    } catch (error) {
      logger.error(`Error validating contract eligibility: ${error.message}`);
      return { eligible: false, reason: 'Validation error' };
    }
  }

  /**
   * Get technical package details
   * @param {Object} client - Database client
   * @param {string} packageId - Technical package ID
   * @returns {Object} Technical package details
   */
  async getTechnicalPackage(client, packageId) {
    try {
      const result = await client.query(
        `SELECT * FROM technical_packages WHERE id = $1`,
        [packageId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Technical package not found');
      }
      
      return result.rows[0];
      
    } catch (error) {
      logger.error(`Error getting technical package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate default technical package based on crop and region
   * @param {Object} client - Database client
   * @param {Object} contractData - Contract data
   * @returns {Object} Default technical package
   */
  async generateDefaultTechnicalPackage(client, contractData) {
    try {
      // Get crop-specific recommendations
      const cropResult = await client.query(
        `SELECT recommended_seed_variety, standard_fertilizer_schedule,
                standard_irrigation_schedule, standard_pest_management
         FROM crop_recommendations 
         WHERE crop_name = $1 AND region = $2`,
        [contractData.crop_variety, contractData.region || 'default']
      );
      
      if (cropResult.rows.length > 0) {
        return cropResult.rows[0];
      }
      
      // Fallback to generic recommendations
      return {
        seed_variety: contractData.crop_variety,
        fertilizer_schedule: {
          basal: { n: 50, p: 25, k: 25, unit: 'kg_per_hectare' },
          top_dressing: { n: 25, p: 12, k: 12, unit: 'kg_per_hectare' }
        },
        irrigation_schedule: {
          frequency: 'weekly',
          water_requirement: '5cm_per_week',
          critical_stages: ['germination', 'flowering', 'grain_filling']
        },
        pest_management_protocol: {
          monitoring_frequency: 'weekly',
          threshold_based_action: true,
          integrated_pest_management: true
        }
      };
      
    } catch (error) {
      logger.error(`Error generating default technical package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate quality bonus structure
   * @param {Object} qualityStandards - Quality standards
   * @returns {Object} Quality bonus structure
   */
  calculateQualityBonusStructure(qualityStandards) {
    return {
      moisture_content: {
        target: qualityStandards.moisture_content || 12,
        tolerance: 2,
        bonus_per_point: 0.5, // 0.5% bonus per point within tolerance
        penalty_per_point: 1.0  // 1.0% penalty per point outside tolerance
      },
      protein_content: {
        target: qualityStandards.protein_content || 10,
        tolerance: 1,
        bonus_per_point: 1.0,
        penalty_per_point: 0.5
      },
      foreign_matter: {
        target: qualityStandards.foreign_matter || 1,
        tolerance: 0.5,
        bonus_per_point: 0.3,
        penalty_per_point: 2.0
      },
      overall_grade: {
        'A': { bonus_percentage: 10 },
        'B': { bonus_percentage: 5 },
        'C': { bonus_percentage: 0 },
        'D': { penalty_percentage: -5 }
      }
    };
  }

  /**
   * Create quality testing schedule
   * @param {Object} client - Database client
   * @param {string} contractId - Contract ID
   * @param {Object} contractData - Contract data
   */
  async createQualityTestingSchedule(client, contractId, contractData) {
    const qualityTests = [
      {
        test_type: 'soil',
        test_date: this.adjustDate(contractData.contract_period_start, 7),
        status: 'scheduled'
      },
      {
        test_type: 'water',
        test_date: this.adjustDate(contractData.contract_period_start, 14),
        status: 'scheduled'
      },
      {
        test_type: 'plant',
        test_date: this.adjustDate(contractData.contract_period_start, 60),
        status: 'scheduled'
      },
      {
        test_type: 'harvest',
        test_date: this.adjustDate(contractData.contract_period_end, -7),
        status: 'scheduled'
      }
    ];
    
    for (const test of qualityTests) {
      await client.query(
        `INSERT INTO contract_quality_tests 
         (contract_id, test_type, test_date, status)
         VALUES ($1, $2, $3, $4)`,
        [contractId, test.test_type, test.test_date, test.status]
      );
    }
  }

  /**
   * Generate smart contract reference
   * @param {string} contractId - Contract ID
   * @param {Object} contractData - Contract data
   * @returns {Object} Smart contract reference
   */
  async generateSmartContractReference(contractId, contractData) {
    // Placeholder for blockchain integration
    return {
      address: `0xcontract-${contractId.replace(/-/g, '').substring(0, 36)}`,
      txHash: null,
      network: 'ethereum',
      status: 'pending_deployment'
    };
  }

  /**
   * Track technical compliance
   * @param {string} contractId - Contract ID
   * @returns {Object} Compliance tracking result
   */
  async trackCompliance(contractId) {
    try {
      let client = await this.pool.connect();
      
      try {
        // Get contract details
        let contractResult = await client.query(
          `SELECT c.*, f.name as farmer_name, b.name as buyer_name
           FROM contract_farming_agreements c
           JOIN farmers f ON c.farmer_id = f.id
           JOIN buyers b ON c.buyer_id = b.id
           WHERE c.id = $1`,
          [contractId]
        );
        
        if (contractResult.rows.length === 0) {
          throw new Error('Contract not found');
        }
        
        const contract = contractResult.rows[0];
        
        // Get quality test results
        const qualityTestsResult = await client.query(
          `SELECT * FROM contract_quality_tests 
           WHERE contract_id = $1 
           ORDER BY test_date ASC`,
          [contractId]
        );
        
        // Calculate compliance score
        const completedTests = qualityTestsResult.rows.filter(t => t.status === 'completed');
        const passedTests = completedTests.filter(t => t.passed_standards);
        const complianceScore = completedTests.length > 0 
          ? (passedTests.length / completedTests.length) * 100 
          : null;
        
        // Get input usage tracking
        const inputUsageResult = await client.query(
          `SELECT input_type, planned_quantity, actual_quantity, usage_date
           FROM contract_input_usage 
           WHERE contract_id = $1
           ORDER BY usage_date DESC`,
          [contractId]
        );
        
        client.release();
        
        return {
          contract: {
            id: contract.id,
            farmer_name: contract.farmer_name,
            buyer_name: contract.buyer_name,
            crop_variety: contract.crop_variety,
            area_hectares: contract.area_hectares,
            expected_yield: contract.expected_yield_tons,
            contract_period: {
              start: contract.contract_period_start,
              end: contract.contract_period_end
            }
          },
          compliance: {
            score: complianceScore ? Math.round(complianceScore) : null,
            quality_tests: {
              total: qualityTestsResult.rows.length,
              completed: completedTests.length,
              passed: passedTests.length
            },
            input_usage: inputUsageResult.rows
          },
          status: this.determineContractStatus(contract, complianceScore)
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error tracking compliance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Determine contract status based on compliance and progress
   * @param {Object} contract - Contract data
   * @param {number} complianceScore - Compliance score
   * @returns {string} Contract status
   */
  determineContractStatus(contract, complianceScore) {
    const now = new Date();
    const startDate = new Date(contract.contract_period_start);
    const endDate = new Date(contract.contract_period_end);
    
    if (now < startDate) {
      return 'upcoming';
    } else if (now > endDate) {
      return complianceScore >= 80 ? 'completed_success' : 'completed_issues';
    } else {
      if (complianceScore === null) {
        return 'in_progress';
      } else if (complianceScore >= 80) {
        return 'on_track';
      } else if (complianceScore >= 60) {
        return 'attention_needed';
      } else {
        return 'at_risk';
      }
    }
  }

  /**
   * Record input usage
   * @param {string} contractId - Contract ID
   * @param {Object} usageData - Input usage data
   * @returns {Object} Recorded usage
   */
  async recordInputUsage(contractId, usageData) {
    try {
      let result = await this.pool.query(
        `INSERT INTO contract_input_usage 
         (contract_id, input_type, planned_quantity, actual_quantity, 
          usage_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          contractId,
          usageData.input_type,
          usageData.planned_quantity,
          usageData.actual_quantity,
          usageData.usage_date || new Date(),
          usageData.notes || null
        ]
      );
      
      logger.info(`Input usage recorded for contract ${contractId}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error(`Error recording input usage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit quality test result
   * @param {string} testId - Test ID
   * @param {Object} testResult - Test result data
   * @returns {Object} Updated test record
   */
  async submitQualityTestResult(testId, testResult) {
    try {
      let client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Update test record
        const updateResult = await client.query(
          `UPDATE contract_quality_tests 
           SET test_results = $1, quality_score = $2, passed_standards = $3,
               tester_id = $4, laboratory_id = $5, status = 'completed'
           WHERE id = $6
           RETURNING *`,
          [
            JSON.stringify(testResult.results || {}),
            testResult.quality_score || null,
            testResult.passed_standards || false,
            testResult.tester_id || null,
            testResult.laboratory_id || null,
            testId
          ]
        );
        
        // Update contract compliance score
        let contractId = updateResult.rows[0].contract_id;
        await this.updateContractComplianceScore(client, contractId);
        
        await client.query('COMMIT');
        
        logger.info(`Quality test result submitted: ${testId}`);
        return updateResult.rows[0];
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error submitting quality test result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update contract compliance score based on test results
   * @param {Object} client - Database client
   * @param {string} contractId - Contract ID
   */
  async updateContractComplianceScore(client, contractId) {
    try {
      let result = await client.query(
        `SELECT AVG(quality_score) as avg_score, 
                COUNT(*) as total_tests,
                SUM(CASE WHEN passed_standards THEN 1 ELSE 0 END) as passed_tests
         FROM contract_quality_tests 
         WHERE contract_id = $1 AND status = 'completed'`,
        [contractId]
      );
      
      if (result.rows.length > 0 && result.rows[0].total_tests > 0) {
        const { avg_score, passed_tests, total_tests } = result.rows[0];
        let complianceScore = (passed_tests / total_tests) * 100;
        
        await client.query(
          `UPDATE contract_farming_agreements 
           SET compliance_score = $1, quality_score = $2
           WHERE id = $3`,
          [complianceScore, avg_score, contractId]
        );
      }
      
    } catch (error) {
      logger.error(`Error updating compliance score: ${error.message}`);
      throw error;
    }
  }

  /**
   * Amend contract terms
   * @param {string} contractId - Contract ID
   * @param {Object} amendmentData - Amendment details
   * @returns {Object} Amendment result
   */
  async amendContract(contractId, amendmentData) {
    let client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current contract
      let contractResult = await client.query(
        `SELECT * FROM contract_farming_agreements WHERE id = $1`,
        [contractId]
      );
      
      if (contractResult.rows.length === 0) {
        throw new Error('Contract not found');
      }
      
      let contract = contractResult.rows[0];
      
      // Record amendment
      await client.query(
        `INSERT INTO contract_amendments 
         (contract_id, amendment_type, original_value, new_value, 
          reason, requested_by, approved_by, amendment_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          contractId,
          amendmentData.amendment_type,
          JSON.stringify(amendmentData.original_value),
          JSON.stringify(amendmentData.new_value),
          amendmentData.reason,
          amendmentData.requested_by,
          amendmentData.approved_by || null,
          new Date()
        ]
      );
      
      // Update contract based on amendment type
      switch (amendmentData.amendment_type) {
        case 'quantity':
          await client.query(
            `UPDATE contract_farming_agreements 
             SET expected_yield_tons = $1 WHERE id = $2`,
            [amendmentData.new_value, contractId]
          );
          break;
        case 'price':
          await client.query(
            `UPDATE contract_farming_agreements 
             SET base_price = $1 WHERE id = $2`,
            [amendmentData.new_value, contractId]
          );
          break;
        case 'timeline':
          await client.query(
            `UPDATE contract_farming_agreements 
             SET contract_period_end = $1 WHERE id = $2`,
            [amendmentData.new_value, contractId]
          );
          break;
        case 'quality_standards':
          await client.query(
            `UPDATE contract_farming_agreements 
             SET quality_standards = $1 WHERE id = $2`,
            [JSON.stringify(amendmentData.new_value), contractId]
          );
          break;
      }
      
      // Update smart contract if blockchain integration exists
      if (contract.smart_contract_address) {
        await this.updateSmartContract(contractId, amendmentData);
      }
      
      await client.query('COMMIT');
      
      logger.info(`Contract amended: ${contractId}`);
      
      return {
        success: true,
        contract_id: contractId,
        amendment: amendmentData,
        amended_at: new Date()
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error amending contract: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update smart contract on blockchain
   * @param {string} contractId - Contract ID
   * @param {Object} amendmentData - Amendment data
   */
  async updateSmartContract(contractId, amendmentData) {
    // Placeholder for blockchain integration
    logger.info(`Smart contract update requested for ${contractId}: ${amendmentData.amendment_type}`);
    // In production, this would interact with blockchain smart contract
  }

  /**
   * Get buyer's contract farming portfolio
   * @param {string} buyerId - Buyer ID
   * @returns {Object} Buyer portfolio summary
   */
  async getBuyerContractPortfolio(buyerId) {
    try {
      let client = await this.pool.connect();
      
      try {
        // Get portfolio summary
        const summaryResult = await client.query(
          `SELECT COUNT(*) as total_contracts,
                  SUM(area_hectares) as total_area,
                  SUM(expected_yield_tons) as total_expected_yield,
                  AVG(compliance_score) as avg_compliance_score,
                  AVG(quality_score) as avg_quality_score
           FROM contract_farming_agreements 
           WHERE buyer_id = $1`,
          [buyerId]
        );
        
        // Get status breakdown
        const statusResult = await client.query(
          `SELECT 
              CASE 
                WHEN contract_period_start > NOW() THEN 'upcoming'
                WHEN contract_period_end < NOW() THEN 'completed'
                ELSE 'active'
              END as period_status,
              COUNT(*) as count,
              SUM(expected_yield_tons) as total_yield
           FROM contract_farming_agreements 
           WHERE buyer_id = $1
           GROUP BY period_status`
        );
        
        // Get regional distribution
        const regionResult = await client.query(
          `SELECT f.district, f.state, 
                  COUNT(*) as contract_count,
                  SUM(c.area_hectares) as total_area,
                  SUM(c.expected_yield_tons) as total_yield
           FROM contract_farming_agreements c
           JOIN farmers f ON c.farmer_id = f.id
           WHERE c.buyer_id = $1
           GROUP BY f.district, f.state
           ORDER BY total_yield DESC`
        );
        
        // Get crop variety distribution
        let cropResult = await client.query(
          `SELECT crop_variety, 
                  COUNT(*) as contract_count,
                  SUM(expected_yield_tons) as total_yield
           FROM contract_farming_agreements 
           WHERE buyer_id = $1
           GROUP BY crop_variety
           ORDER BY total_yield DESC`
        );
        
        client.release();
        
        return {
          summary: summaryResult.rows[0],
          status_breakdown: statusResult.rows,
          regional_distribution: regionResult.rows,
          crop_distribution: cropResult.rows
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error getting buyer contract portfolio: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get available contract farming opportunities for farmers
   * @param {string} farmerId - Farmer ID
   * @returns {Array} Available opportunities
   */
  async getAvailableContractOpportunities(farmerId) {
    try {
      // Get farmer's region and capabilities
      let farmerResult = await this.pool.query(
        `SELECT district, state, total_land_hectares, irrigation_access
         FROM farmers WHERE id = $1`,
        [farmerId]
      );
      
      if (farmerResult.rows.length === 0) {
        throw new Error('Farmer not found');
      }
      
      let farmer = farmerResult.rows[0];
      
      // Get matching opportunities
      let result = await this.pool.query(
        `SELECT o.id, o.buyer_id, b.name as buyer_name, o.crop_variety,
                o.minimum_hectares, o.maximum_hectares, o.base_price,
                o.quality_bonus_structure, o.contract_duration_months,
                o.technical_support_included, o.deadline
         FROM contract_farming_opportunities o
         JOIN buyers b ON o.buyer_id = b.id
         WHERE o.status = 'open' 
         AND o.deadline > NOW()
         AND o.minimum_hectares <= $1
         AND (o.required_irrigation = false OR $2 = true)
         ORDER BY o.base_price DESC
         LIMIT 20`,
        [farmer.total_land_hectares, farmer.irrigation_access]
      );
      
      return result.rows;
      
    } catch (error) {
      logger.error(`Error getting contract opportunities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper function to adjust date by days
   * @param {Date} date - Original date
   * @param {number} days - Days to adjust
   * @returns {Date} Adjusted date
   */
  adjustDate(date, days) {
    const adjusted = new Date(date);
    adjusted.setDate(adjusted.getDate() + days);
    return adjusted;
  }
}

module.exports = ContractFarmingService;