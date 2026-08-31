/**
 * Government Subsidy Management Service
 * Strategic implementation for government subsidy tracking, distribution, and monitoring
 * 
 * Business Concept: Government subsidy management involves tracking, distributing, and 
 * monitoring agricultural subsidies, DBT payments, and support programs to ensure efficient 
 * resource allocation and prevent leakage.
 */

const { Pool } = require('pg');
const logger = require('../../utils/logger');

class GovernmentSubsidyService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  /**
   * Create a new government subsidy program
   * @param {Object} programData - Program details
   * @returns {Object} Created subsidy program
   */
  async createSubsidyProgram(programData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate ministry and fiscal year
      const validationResult = await this.validateProgramDetails(client, programData);
      
      if (!validationResult.valid) {
        throw new Error(`Program validation failed: ${validationResult.reason}`);
      }
      
      // Create subsidy program
      const programResult = await client.query(
        `INSERT INTO government_subsidy_programs 
         (program_name, ministry, budget_allocation, fiscal_year,
          land_ownership_requirement, minimum_land_hectares, maximum_income_threshold,
          eligible_crops, eligible_regions, subsidy_type, subsidy_amount, 
          subsidy_percentage, maximum_subsidy_per_farmer, application_period_start,
          application_period_end, disbursement_schedule, utilization_target, leak_detection_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         RETURNING id, created_at`,
        [
          programData.program_name,
          programData.ministry,
          programData.budget_allocation,
          programData.fiscal_year,
          programData.land_ownership_requirement !== false,
          programData.minimum_land_hectares || null,
          programData.maximum_income_threshold || null,
          JSON.stringify(programData.eligible_crops || []),
          JSON.stringify(programData.eligible_regions || []),
          programData.subsidy_type,
          programData.subsidy_amount || null,
          programData.subsidy_percentage || null,
          programData.maximum_subsidy_per_farmer || null,
          programData.application_period_start,
          programData.application_period_end,
          JSON.stringify(programData.disbursement_schedule || {}),
          programData.utilization_target || 80.0,
          programData.leak_detection_threshold || 10.0
        ]
      );
      
      const programId = programResult.rows[0].id;
      
      // Generate program monitoring dashboard
      await this.initializeProgramMonitoring(client, programId);
      
      await client.query('COMMIT');
      
      logger.info(`Government subsidy program created: ${programId}`);
      
      return {
        success: true,
        program: {
          id: programId,
          program_name: programData.program_name,
          ministry: programData.ministry,
          fiscal_year: programData.fiscal_year,
          budget_allocation: programData.budget_allocation,
          created_at: programResult.rows[0].created_at
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error creating subsidy program: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Validate program details
   * @param {Object} client - Database client
   * @param {Object} programData - Program data
   * @returns {Object} Validation result
   */
  async validateProgramDetails(client, programData) {
    try {
      // Check for duplicate program name in same fiscal year
      const duplicateResult = await client.query(
        `SELECT id FROM government_subsidy_programs 
         WHERE program_name = $1 AND fiscal_year = $2`,
        [programData.program_name, programData.fiscal_year]
      );
      
      if (duplicateResult.rows.length > 0) {
        return { valid: false, reason: 'Program with same name already exists in this fiscal year' };
      }
      
      // Validate budget allocation is positive
      if (programData.budget_allocation <= 0) {
        return { valid: false, reason: 'Budget allocation must be positive' };
      }
      
      // Validate application period
      if (new Date(programData.application_period_start) >= new Date(programData.application_period_end)) {
        return { valid: false, reason: 'Application period end must be after start' };
      }
      
      // Validate subsidy type has corresponding amount/percentage
      if (programData.subsidy_type === 'fixed_amount' && !programData.subsidy_amount) {
        return { valid: false, reason: 'Fixed amount subsidy requires subsidy_amount' };
      }
      
      if (programData.subsidy_type === 'percentage' && !programData.subsidy_percentage) {
        return { valid: false, reason: 'Percentage subsidy requires subsidy_percentage' };
      }
      
      return { valid: true };
      
    } catch (error) {
      logger.error(`Error validating program details: ${error.message}`);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Initialize program monitoring
   * @param {Object} client - Database client
   * @param {string} programId - Program ID
   */
  async initializeProgramMonitoring(client, programId) {
    // Placeholder for monitoring initialization
    // In production, this would set up tracking dashboards, alerts, etc.
    logger.info(`Program monitoring initialized for: ${programId}`);
  }

  /**
   * Calculate subsidy eligibility for farmer
   * @param {string} farmerId - Farmer ID
   * @param {string} programId - Program ID
   * @returns {Object} Eligibility result
   */
  async calculateEligibility(farmerId, programId) {
    try {
      const client = await this.pool.connect();
      
      try {
        // Get farmer details
        const farmerResult = await client.query(
          `SELECT f.*, l.total_hectares as land_hectares
           FROM farmers f
           LEFT JOIN land_records l ON f.id = l.farmer_id
           WHERE f.id = $1`,
          [farmerId]
        );
        
        if (farmerResult.rows.length === 0) {
          return { eligible: false, reason: 'Farmer not found' };
        }
        
        const farmer = farmerResult.rows[0];
        
        // Get program details
        const programResult = await client.query(
          `SELECT * FROM government_subsidy_programs WHERE id = $1`,
          [programId]
        );
        
        if (programResult.rows.length === 0) {
          return { eligible: false, reason: 'Program not found' };
        }
        
        const program = programResult.rows[0];
        
        // Check eligibility criteria
        const eligibilityChecks = [];
        
        // Land ownership check
        if (program.land_ownership_requirement) {
          const landVerified = farmer.land_verification_status === 'verified';
          eligibilityChecks.push({
            criterion: 'land_ownership',
            required: true,
            actual: landVerified,
            passed: landVerified
          });
          
          if (!landVerified) {
            return { 
              eligible: false, 
              reason: 'Land ownership not verified',
              checks: eligibilityChecks
            };
          }
        }
        
        // Land size check
        if (program.minimum_land_hectares) {
          const landHectares = farmer.land_hectares || 0;
          const landCheck = landHectares >= program.minimum_land_hectares;
          eligibilityChecks.push({
            criterion: 'minimum_land',
            required: program.minimum_land_hectares,
            actual: landHectares,
            passed: landCheck
          });
          
          if (!landCheck) {
            return { 
              eligible: false, 
              reason: `Land holding (${landHectares} hectares) below minimum (${program.minimum_land_hectares} hectares)`,
              checks: eligibilityChecks
            };
          }
        }
        
        // Income threshold check
        if (program.maximum_income_threshold) {
          const farmerIncome = farmer.annual_income || 0;
          const incomeCheck = farmerIncome <= program.maximum_income_threshold;
          eligibilityChecks.push({
            criterion: 'income_threshold',
            maximum: program.maximum_income_threshold,
            actual: farmerIncome,
            passed: incomeCheck
          });
          
          if (!incomeCheck) {
            return { 
              eligible: false, 
              reason: `Annual income (₹${farmerIncome}) exceeds maximum threshold (₹${program.maximum_income_threshold})`,
              checks: eligibilityChecks
            };
          }
        }
        
        // Crop eligibility check
        if (program.eligible_crops && program.eligible_crops.length > 0) {
          const farmerCrops = await this.getFarmerCrops(client, farmerId);
          const cropMatch = farmerCrops.some(crop => 
            program.eligible_crops.includes(crop)
          );
          
          eligibilityChecks.push({
            criterion: 'crop_eligibility',
            required_crops: program.eligible_crops,
            farmer_crops: farmerCrops,
            passed: cropMatch
          });
          
          if (!cropMatch) {
            return { 
              eligible: false, 
              reason: 'Farmer does not grow any eligible crops for this program',
              checks: eligibilityChecks
            };
          }
        }
        
        // Regional eligibility check
        if (program.eligible_regions && program.eligible_regions.length > 0) {
          const regionMatch = program.eligible_regions.includes(farmer.state) || 
                           program.eligible_regions.includes(farmer.district);
          
          eligibilityChecks.push({
            criterion: 'regional_eligibility',
            eligible_regions: program.eligible_regions,
            farmer_region: `${farmer.district}, ${farmer.state}`,
            passed: regionMatch
          });
          
          if (!regionMatch) {
            return { 
              eligible: false, 
              reason: 'Farmer region not eligible for this program',
              checks: eligibilityChecks
            };
          }
        }
        
        client.release();
        
        // Calculate subsidy amount if eligible
        const subsidyAmount = await this.calculateSubsidyAmount(
          program,
          farmer
        );
        
        return {
          eligible: true,
          subsidy_amount: subsidyAmount,
          checks: eligibilityChecks,
          program_details: {
            program_name: program.program_name,
            subsidy_type: program.subsidy_type,
            application_deadline: program.application_period_end
          }
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error calculating eligibility: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get farmer's crops
   * @param {Object} client - Database client
   * @param {string} farmerId - Farmer ID
   * @returns {Array} Farmer's crops
   */
  async getFarmerCrops(client, farmerId) {
    try {
      const result = await client.query(
        `SELECT DISTINCT crop_name FROM crop_plantings 
         WHERE farmer_id = $1 AND status = 'active'`,
        [farmerId]
      );
      
      return result.rows.map(row => row.crop_name);
      
    } catch (error) {
      logger.error(`Error getting farmer crops: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate subsidy amount for eligible farmer
   * @param {Object} program - Program details
   * @param {Object} farmer - Farmer details
   * @returns {number} Subsidy amount
   */
  async calculateSubsidyAmount(program, farmer) {
    try {
      let subsidyAmount = 0;
      
      switch (program.subsidy_type) {
        case 'fixed_amount':
          subsidyAmount = program.subsidy_amount;
          break;
          
        case 'percentage':
          // Calculate based on farmer's input costs or production value
          const baseValue = farmer.estimated_annual_input_cost || 50000; // Default fallback
          subsidyAmount = baseValue * (program.subsidy_percentage / 100);
          break;
          
        case 'input':
          // Calculate based on actual input purchases
          subsidyAmount = await this.calculateInputBasedSubsidy(farmer.id);
          break;
          
        case 'output':
          // Calculate based on production
          subsidyAmount = await this.calculateOutputBasedSubsidy(farmer.id);
          break;
          
        default:
          subsidyAmount = program.subsidy_amount || 0;
      }
      
      // Apply maximum cap if specified
      if (program.maximum_subsidy_per_farmer && subsidyAmount > program.maximum_subsidy_per_farmer) {
        subsidyAmount = program.maximum_subsidy_per_farmer;
      }
      
      return Math.round(subsidyAmount);
      
    } catch (error) {
      logger.error(`Error calculating subsidy amount: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate input-based subsidy
   * @param {string} farmerId - Farmer ID
   * @returns {number} Subsidy amount
   */
  async calculateInputBasedSubsidy(farmerId) {
    try {
      const result = await this.pool.query(
        `SELECT SUM(purchase_amount) as total_input_cost
         FROM farmer_input_purchases 
         WHERE farmer_id = $1 
         AND purchase_date >= NOW() - INTERVAL '12 months'`,
        [farmerId]
      );
      
      const totalInputCost = result.rows[0].total_input_cost || 0;
      return totalInputCost * 0.5; // 50% subsidy on inputs
      
    } catch (error) {
      logger.error(`Error calculating input-based subsidy: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate output-based subsidy
   * @param {string} farmerId - Farmer ID
   * @returns {number} Subsidy amount
   */
  async calculateOutputBasedSubsidy(farmerId) {
    try {
      const result = await this.pool.query(
        `SELECT SUM(sales_value) as total_output_value
         FROM farmer_sales 
         WHERE farmer_id = $1 
         AND sale_date >= NOW() - INTERVAL '12 months'`,
        [farmerId]
      );
      
      const totalOutputValue = result.rows[0].total_output_value || 0;
      return totalOutputValue * 0.1; // 10% subsidy on output
      
    } catch (error) {
      logger.error(`Error calculating output-based subsidy: ${error.message}`);
      return 0;
    }
  }

  /**
   * Submit subsidy application
   * @param {Object} applicationData - Application data
   * @returns {Object} Application result
   */
  async submitSubsidyApplication(applicationData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check eligibility first
      const eligibility = await this.calculateEligibility(
        applicationData.farmer_id,
        applicationData.program_id
      );
      
      if (!eligibility.eligible) {
        await client.query('ROLLBACK');
        return {
          success: false,
          reason: eligibility.reason,
          eligibility_checks: eligibility.checks
        };
      }
      
      // Check if application already exists for this program and farmer
      const existingApplication = await client.query(
        `SELECT id FROM subsidy_applications 
         WHERE farmer_id = $1 AND program_id = $2 
         AND status IN ('submitted', 'under_review', 'approved')
         AND application_date >= NOW() - INTERVAL '1 year'`,
        [applicationData.farmer_id, applicationData.program_id]
      );
      
      if (existingApplication.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          reason: 'Application already exists for this program in current fiscal year'
        };
      }
      
      // Create application
      const applicationResult = await client.query(
        `INSERT INTO subsidy_applications 
         (program_id, farmer_id, application_date, land_hectares, crop_variety,
          estimated_production, income_declaration, land_document_url, aadhaar_number,
          bank_account_number, bank_ifsc_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'submitted')
         RETURNING id, created_at`,
        [
          applicationData.program_id,
          applicationData.farmer_id,
          new Date(),
          applicationData.land_hectares,
          applicationData.crop_variety,
          applicationData.estimated_production,
          applicationData.income_declaration,
          applicationData.land_document_url || null,
          applicationData.aadhaar_number,
          applicationData.bank_account_number,
          applicationData.bank_ifsc_code
        ]
      );
      
      const applicationId = applicationResult.rows[0].id;
      
      // Initiate verification processes
      await this.initiateVerifications(client, applicationId, applicationData);
      
      await client.query('COMMIT');
      
      logger.info(`Subsidy application submitted: ${applicationId}`);
      
      return {
        success: true,
        application: {
          id: applicationId,
          farmer_id: applicationData.farmer_id,
          program_id: applicationData.program_id,
          subsidy_amount: eligibility.subsidy_amount,
          status: 'submitted',
          created_at: applicationResult.rows[0].created_at
        },
        next_steps: [
          'Land verification in progress',
          'Aadhaar verification pending',
          'Bank account verification pending',
          'Expected processing time: 15-30 working days'
        ]
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error submitting subsidy application: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Initiate verification processes
   * @param {Object} client - Database client
   * @param {string} applicationId - Application ID
   * @param {Object} applicationData - Application data
   */
  async initiateVerifications(client, applicationId, applicationData) {
    try {
      // Update verification statuses
      await client.query(
        `UPDATE subsidy_applications 
         SET land_verification_status = 'pending',
             aadhaar_verification_status = 'pending',
             bank_verification_status = 'pending'
         WHERE id = $1`,
        [applicationId]
      );
      
      // In production, this would trigger actual verification processes:
      // - Land record verification with revenue department
      // - Aadhaar verification with UIDAI
      // - Bank account verification with NPCI
      
      logger.info(`Verifications initiated for application: ${applicationId}`);
      
    } catch (error) {
      logger.error(`Error initiating verifications: ${error.message}`);
    }
  }

  /**
   * Process subsidy disbursement
   * @param {string} applicationId - Application ID
   * @param {Object} disbursementData - Disbursement data
   * @returns {Object} Disbursement result
   */
  async disburseSubsidy(applicationId, disbursementData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get application details
      const applicationResult = await client.query(
        `SELECT sa.*, sp.subsidy_amount, sp.subsidy_percentage, sp.subsidy_type
         FROM subsidy_applications sa
         JOIN government_subsidy_programs sp ON sa.program_id = sp.id
         WHERE sa.id = $1`,
        [applicationId]
      );
      
      if (applicationResult.rows.length === 0) {
        throw new Error('Application not found');
      }
      
      const application = applicationResult.rows[0];
      
      // Calculate final subsidy amount
      let finalAmount = application.subsidy_amount;
      if (application.subsidy_type === 'percentage') {
        finalAmount = application.income_declaration * (application.subsidy_percentage / 100);
      }
      
      // Create disbursement record
      const disbursementResult = await client.query(
        `INSERT INTO subsidy_disbursements 
         (program_id, farmer_id, subsidy_amount, disbursement_date, payment_method,
          transaction_id, aadhaar_verified, bank_account_verified, land_verified,
          pre_subsidy_income, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'disbursed')
         RETURNING id`,
        [
          application.program_id,
          application.farmer_id,
          finalAmount,
          disbursementData.disbursement_date || new Date(),
          disbursementData.payment_method || 'dbt',
          disbursementData.transaction_id || null,
          application.aadhaar_verification_status === 'verified',
          application.bank_verification_status === 'verified',
          application.land_verification_status === 'verified',
          application.income_declaration
        ]
      );
      
      // Update application status
      await client.query(
        `UPDATE subsidy_applications 
         SET status = 'disbursed', approval_date = $1
         WHERE id = $2`,
        [new Date(), applicationId]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Subsidy disbursed for application: ${applicationId}`);
      
      return {
        success: true,
        disbursement: {
          id: disbursementResult.rows[0].id,
          application_id: applicationId,
          amount: finalAmount,
          payment_method: disbursementData.payment_method || 'dbt',
          disbursement_date: disbursementData.disbursement_date || new Date()
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error disbursing subsidy: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Track subsidy utilization and impact
   * @param {string} programId - Program ID
   * @returns {Object} Utilization and impact metrics
   */
  async trackSubsidyImpact(programId) {
    try {
      const client = await this.pool.connect();
      
      try {
        // Get program details
        const programResult = await client.query(
          `SELECT * FROM government_subsidy_programs WHERE id = $1`,
          [programId]
        );
        
        if (programResult.rows.length === 0) {
          throw new Error('Program not found');
        }
        
        const program = programResult.rows[0];
        
        // Get utilization metrics
        const utilizationResult = await client.query(
          `SELECT 
              COUNT(*) as total_applications,
              SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_applications,
              SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) as disbursed_applications,
              SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_applications
           FROM subsidy_applications 
           WHERE program_id = $1`,
          [programId]
        );
        
        // Get financial metrics
        const financialResult = await client.query(
          `SELECT 
              SUM(subsidy_amount) as total_disbursed,
              AVG(subsidy_amount) as average_disbursement,
              COUNT(*) as disbursement_count
           FROM subsidy_disbursements 
           WHERE program_id = $1 AND status = 'disbursed'`,
          [programId]
        );
        
        // Calculate utilization rate
        const totalApplications = utilizationResult.rows[0].total_applications || 0;
        const utilizationRate = totalApplications > 0 
          ? ((utilizationResult.rows[0].disbursed_applications / totalApplications) * 100).toFixed(1)
          : 0;
        
        // Detect potential leakage
        const leakDetection = await this.detectLeakage(client, programId);
        
        // Calculate impact metrics
        const impactMetrics = await this.calculateImpactMetrics(client, programId);
        
        client.release();
        
        return {
          program: {
            id: program.id,
            program_name: program.program_name,
            budget_allocation: program.budget_allocation,
            utilization_target: program.utilization_target
          },
          utilization: {
            total_applications: totalApplications,
            approved_applications: utilizationResult.rows[0].approved_applications,
            disbursed_applications: utilizationResult.rows[0].disbursed_applications,
            rejected_applications: utilizationResult.rows[0].rejected_applications,
            utilization_rate: parseFloat(utilizationRate) + '%',
            target_met: parseFloat(utilizationRate) >= program.utilization_target
          },
          financial: {
            total_disbursed: financialResult.rows[0].total_disbursed || 0,
            average_disbursement: financialResult.rows[0].average_disbursement || 0,
            disbursement_count: financialResult.rows[0].disbursement_count || 0,
            budget_utilization: program.budget_allocation > 0 
              ? ((financialResult.rows[0].total_disbursed / program.budget_allocation) * 100).toFixed(1) + '%'
              : '0%'
          },
          leak_detection: leakDetection,
          impact: impactMetrics
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error tracking subsidy impact: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect potential leakage in subsidy disbursement
   * @param {Object} client - Database client
   * @param {string} programId - Program ID
   * @returns {Object} Leak detection results
   */
  async detectLeakage(client, programId) {
    try {
      // Check for duplicate applications
      const duplicateResult = await client.query(
        `SELECT farmer_id, COUNT(*) as application_count
         FROM subsidy_applications 
         WHERE program_id = $1 AND status IN ('approved', 'disbursed')
         GROUP BY farmer_id
         HAVING COUNT(*) > 1`,
        [programId]
      );
      
      // Check for unusual disbursement patterns
      const unusualPatternResult = await client.query(
        `SELECT farmer_id, SUM(subsidy_amount) as total_received, COUNT(*) as disbursement_count
         FROM subsidy_disbursements 
         WHERE program_id = $1 AND status = 'disbursed'
         GROUP BY farmer_id
         HAVING SUM(subsidy_amount) > 100000 OR COUNT(*) > 3`,
        [programId]
      );
      
      // Check for verification failures
      const verificationFailureResult = await client.query(
        `SELECT COUNT(*) as failed_verifications
         FROM subsidy_applications 
         WHERE program_id = $1 
         AND (land_verification_status = 'failed' 
              OR aadhaar_verification_status = 'failed' 
              OR bank_verification_status = 'failed')`,
        [programId]
      );
      
      const leakRisk = {
        duplicate_applications: duplicateResult.rows.length,
        unusual_patterns: unusualPatternResult.rows.length,
        verification_failures: verificationFailureResult.rows[0].failed_verifications,
        overall_risk: 'low'
      };
      
      // Calculate overall risk
      const riskScore = (duplicateResult.rows.length * 3) + 
                       (unusualPatternResult.rows.length * 2) + 
                       verificationFailureResult.rows[0].failed_verifications;
      
      if (riskScore > 10) {
        leakRisk.overall_risk = 'high';
      } else if (riskScore > 5) {
        leakRisk.overall_risk = 'medium';
      }
      
      return leakRisk;
      
    } catch (error) {
      logger.error(`Error detecting leakage: ${error.message}`);
      return { overall_risk: 'unknown', error: error.message };
    }
  }

  /**
   * Calculate impact metrics
   * @param {Object} client - Database client
   * @param {string} programId - Program ID
   * @returns {Object} Impact metrics
   */
  async calculateImpactMetrics(client, programId) {
    try {
      // Calculate income improvement
      const incomeResult = await client.query(
        `SELECT AVG(post_subsidy_income - pre_subsidy_income) as avg_income_increase,
              AVG(CASE WHEN post_subsidy_income > pre_subsidy_income THEN 1 ELSE 0 END) * 100 as income_increase_percentage
         FROM subsidy_disbursements 
         WHERE program_id = $1 
         AND pre_subsidy_income IS NOT NULL 
         AND post_subsidy_income IS NOT NULL`,
        [programId]
      );
      
      // Calculate productivity improvement
      const productivityResult = await client.query(
        `SELECT AVG(productivity_change) as avg_productivity_change
         FROM subsidy_disbursements 
         WHERE program_id = $1 
         AND productivity_change IS NOT NULL`,
        [programId]
      );
      
      return {
        income_impact: {
          average_increase: incomeResult.rows[0].avg_income_increase || 0,
          percentage_improved: incomeResult.rows[0].income_increase_percentage || 0
        },
        productivity_impact: {
          average_change: productivityResult.rows[0].avg_productivity_change || 0
        }
      };
      
    } catch (error) {
      logger.error(`Error calculating impact metrics: ${error.message}`);
      return { income_impact: {}, productivity_impact: {} };
    }
  }

  /**
   * Get government dashboard data
   * @param {string} ministry - Ministry filter (optional)
   * @param {string} fiscalYear - Fiscal year filter (optional)
   * @returns {Object} Dashboard data
   */
  async getGovernmentDashboard(ministry, fiscalYear) {
    try {
      const client = await this.pool.connect();
      
      try {
        // Build query conditions
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        if (ministry) {
          conditions.push(`ministry = $${paramIndex++}`);
          params.push(ministry);
        }
        
        if (fiscalYear) {
          conditions.push(`fiscal_year = $${paramIndex++}`);
          params.push(fiscalYear);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Get program summary
        const programSummaryResult = await client.query(
          `SELECT 
              COUNT(*) as total_programs,
              SUM(budget_allocation) as total_budget,
              AVG(utilization_target) as avg_utilization_target
           FROM government_subsidy_programs
           ${whereClause}`,
          params
        );
        
        // Get active programs
        const activeProgramsResult = await client.query(
          `SELECT id, program_name, ministry, budget_allocation, fiscal_year,
                  application_period_start, application_period_end, status
           FROM government_subsidy_programs
           ${whereClause}
           ORDER BY budget_allocation DESC
           LIMIT 10`,
          params
        );
        
        // Get overall disbursement statistics
        const disbursementStatsResult = await client.query(
          `SELECT 
              COUNT(*) as total_disbursements,
              SUM(subsidy_amount) as total_disbursed,
              AVG(subsidy_amount) as average_disbursement
           FROM subsidy_disbursements sd
           JOIN government_subsidy_programs sp ON sd.program_id = sp.id
           ${whereClause}`,
          params
        );
        
        // Get application statistics
        const applicationStatsResult = await client.query(
          `SELECT 
              COUNT(*) as total_applications,
              SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
              SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
              SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) as disbursed
           FROM subsidy_applications sa
           JOIN government_subsidy_programs sp ON sa.program_id = sp.id
           ${whereClause}`,
          params
        );
        
        client.release();
        
        return {
          summary: programSummaryResult.rows[0],
          active_programs: activeProgramsResult.rows,
          disbursement_statistics: disbursementStatsResult.rows[0],
          application_statistics: applicationStatsResult.rows[0],
          filters: { ministry, fiscal_year }
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error getting government dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get farmer subsidy dashboard
   * @param {string} farmerId - Farmer ID
   * @returns {Object} Farmer dashboard data
   */
  async getFarmerSubsidyDashboard(farmerId) {
    try {
      const client = await this.pool.connect();
      
      try {
        // Get eligible programs
        const eligibleProgramsResult = await client.query(
          `SELECT sp.*, 
                  CASE 
                    WHEN sp.application_period_end >= NOW() THEN 'open'
                    ELSE 'closed'
                  END as application_status
           FROM government_subsidy_programs sp
           WHERE sp.status = 'active'
           AND sp.application_period_end >= NOW()
           ORDER BY sp.application_period_end ASC
           LIMIT 10`
        );
        
        // Get farmer's applications
        const applicationsResult = await client.query(
          `SELECT sa.*, sp.program_name, sp.ministry, sp.fiscal_year
           FROM subsidy_applications sa
           JOIN government_subsidy_programs sp ON sa.program_id = sp.id
           WHERE sa.farmer_id = $1
           ORDER BY sa.application_date DESC
           LIMIT 10`,
          [farmerId]
        );
        
        // Get farmer's disbursements
        const disbursementsResult = await client.query(
          `SELECT sd.*, sp.program_name, sp.ministry
           FROM subsidy_disbursements sd
           JOIN government_subsidy_programs sp ON sd.program_id = sp.id
           WHERE sd.farmer_id = $1
           ORDER BY sd.disbursement_date DESC
           LIMIT 10`,
          [farmerId]
        );
        
        client.release();
        
        return {
          eligible_programs: eligibleProgramsResult.rows,
          my_applications: applicationsResult.rows,
          my_disbursements: disbursementsResult.rows,
          summary: {
            total_applications: applicationsResult.rows.length,
            approved_applications: applicationsResult.rows.filter(a => a.status === 'approved').length,
            disbursed_applications: applicationsResult.rows.filter(a => a.status === 'disbursed').length,
            total_received: disbursementsResult.rows.reduce((sum, d) => sum + (d.subsidy_amount || 0), 0)
          }
        };
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`Error getting farmer subsidy dashboard: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GovernmentSubsidyService;