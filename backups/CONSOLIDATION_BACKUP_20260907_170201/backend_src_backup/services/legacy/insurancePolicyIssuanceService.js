/**
 * Insurance Policy Issuance Service
 * Handles policy creation, issuance, and management
 */

const { logger } = require('../../utils/logger');
const insurancePremiumService = require('./insurancePremiumService');

class InsurancePolicyIssuanceService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../database/pool');
  }

  /**
   * Issue a new insurance policy
   */
  async issuePolicy(policyData) {
    const {
      quoteId,
      policyholderId,
      insuranceType,
      premiumAmount,
      paymentMethod,
      paymentReference,
      startDate,
      endDate,
      policyData: riskData
    } = policyData;

    try {
      // Generate policy number
      const policyNumber = await this.generatePolicyNumber(insuranceType);

      // Validate quote
      const quote = await insurancePremiumService.getQuote(quoteId);
      if (quote.status !== 'accepted') {
        throw new Error('Quote must be accepted before policy issuance');
      }

      // Calculate payment schedule
      const paymentSchedule = this.calculatePaymentSchedule(
        premiumAmount,
        insuranceType,
        startDate,
        endDate
      );

      const query = `
        INSERT INTO insurance_policies 
        (policy_number, policyholder_id, insurance_type, quote_id, premium_amount,
         payment_method, payment_reference, start_date, end_date, payment_schedule,
         policy_data, status, issued_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', NOW())
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        policyNumber,
        policyholderId,
        insuranceType,
        quoteId,
        premiumAmount,
        paymentMethod,
        paymentReference,
        startDate,
        endDate,
        JSON.stringify(paymentSchedule),
        JSON.stringify(riskData)
      ]);

      // Update quote status
      await this.updateQuoteStatus(quoteId, 'issued');

      logger.info(`Policy ${policyNumber} issued for policyholder ${policyholderId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error issuing policy', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Generate unique policy number
   */
  async generatePolicyNumber(insuranceType) {
    const typeCodes = {
      'crop': 'CRP',
      'transit': 'TRN',
      'warehouse': 'WRH',
      'livestock': 'LST',
      'weather': 'WTH',
      'seed': 'SED'
    };

    const code = typeCodes[insuranceType] || 'GEN';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `${code}-${timestamp}-${random}`;
  }

  /**
   * Calculate payment schedule
   */
  calculatePaymentSchedule(premiumAmount, insuranceType, startDate, endDate) {
    const schedules = {
      'crop': this.calculateAnnualSchedule(premiumAmount, startDate),
      'transit': this.calculateSinglePayment(premiumAmount, startDate),
      'warehouse': this.calculateAnnualSchedule(premiumAmount, startDate),
      'livestock': this.calculateAnnualSchedule(premiumAmount, startDate),
      'weather': this.calculateSeasonalSchedule(premiumAmount, startDate),
      'seed': this.calculateSinglePayment(premiumAmount, startDate)
    };

    return schedules[insuranceType] || this.calculateAnnualSchedule(premiumAmount, startDate);
  }

  /**
   * Calculate annual payment schedule
   */
  calculateAnnualSchedule(premiumAmount, startDate) {
    const installmentAmount = premiumAmount / 12;
    const schedule = [];

    for (let i = 0; i < 12; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        installment: i + 1,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: installmentAmount.toFixed(2),
        status: 'pending'
      });
    }

    return schedule;
  }

  /**
   * Calculate single payment
   */
  calculateSinglePayment(premiumAmount, startDate) {
    return [{
      installment: 1,
      dueDate: startDate,
      amount: premiumAmount.toFixed(2),
      status: 'pending'
    }];
  }

  /**
   * Calculate seasonal payment schedule
   */
  calculateSeasonalSchedule(premiumAmount, startDate) {
    const installmentAmount = premiumAmount / 2;
    const schedule = [];

    // First installment
    schedule.push({
      installment: 1,
      dueDate: startDate,
      amount: installmentAmount.toFixed(2),
      status: 'pending'
    });

    // Second installment (6 months later)
    const secondDate = new Date(startDate);
    secondDate.setMonth(secondDate.getMonth() + 6);
    schedule.push({
      installment: 2,
      dueDate: secondDate.toISOString().split('T')[0],
      amount: installmentAmount.toFixed(2),
      status: 'pending'
    });

    return schedule;
  }

  /**
   * Update quote status
   */
  async updateQuoteStatus(quoteId, status) {
    try {
      const query = `
        UPDATE insurance_quotes
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.pool.query(query, [status, quoteId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating quote status', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get policy by ID
   */
  async getPolicy(policyId, userId, isAdmin = false) {
    try {
      let query = `
        SELECT 
          ip.*,
          u.name as policyholder_name,
          u.email as policyholder_email,
          u.phone as policyholder_phone
        FROM insurance_policies ip
        JOIN users u ON ip.policyholder_id = u.id
        WHERE ip.id = $1
      `;

      const params = [policyId];

      if (!isAdmin) {
        query += ' AND ip.policyholder_id = $2';
        params.push(userId);
      }

      const result = await this.pool.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('Policy not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting policy', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get policy by policy number
   */
  async getPolicyByNumber(policyNumber) {
    try {
      const query = `
        SELECT 
          ip.*,
          u.name as policyholder_name,
          u.email as policyholder_email
        FROM insurance_policies ip
        JOIN users u ON ip.policyholder_id = u.id
        WHERE ip.policy_number = $1
      `;

      const result = await this.pool.query(query, [policyNumber]);

      if (result.rows.length === 0) {
        throw new Error('Policy not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting policy by number', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get user's policies
   */
  async getUserPolicies(userId, filters = {}) {
    const { insuranceType, status, page = 1, limit = 20 } = filters;

    try {
      let query = `
        SELECT ip.*
        FROM insurance_policies ip
        WHERE ip.policyholder_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (insuranceType) {
        paramCount++;
        query += ` AND ip.insurance_type = $${paramCount}`;
        params.push(insuranceType);
      }

      if (status) {
        paramCount++;
        query += ` AND ip.status = $${paramCount}`;
        params.push(status);
      }

      query += ' ORDER BY ip.issued_at DESC';

      const offset = (page - 1) * limit;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await this.pool.query(query, params);

      return {
        policies: result.rows,
        pagination: { page, limit }
      };
    } catch (error) {
      logger.error('Error getting user policies', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Renew policy
   */
  async renewPolicy(policyId, renewalData, userId = null, isAdmin = false) {
    const { endDate, premiumAmount, paymentReference } = renewalData;

    try {
      // Was `getPolicy(policyId, null, true)` — the admin bypass — so any
      // logged-in account could renew (and reprice) another user's policy by
      // id. Scoped to the policyholder unless the caller really is an admin,
      // matching cancelPolicy's existing behaviour.
      const policy = await this.getPolicy(policyId, userId, isAdmin);

      if (policy.status !== 'active') {
        throw new Error('Only active policies can be renewed');
      }

      const query = `
        UPDATE insurance_policies
        SET 
          end_date = $1,
          premium_amount = $2,
          payment_reference = $3,
          renewed_at = NOW(),
          renewal_count = renewal_count + 1
        WHERE id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        endDate,
        premiumAmount,
        paymentReference,
        policyId
      ]);

      logger.info(`Policy ${policy.policy_number} renewed`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error renewing policy', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Cancel policy
   */
  async cancelPolicy(policyId, userId, reason) {
    try {
      const policy = await this.getPolicy(policyId, userId);

      if (policy.status !== 'active') {
        throw new Error('Only active policies can be cancelled');
      }

      // Calculate refund
      const refundAmount = this.calculateRefund(policy);

      const query = `
        UPDATE insurance_policies
        SET 
          status = 'cancelled',
          cancelled_at = NOW(),
          cancellation_reason = $1,
          refund_amount = $2
        WHERE id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [reason, refundAmount, policyId]);

      logger.info(`Policy ${policy.policy_number} cancelled`);
      return {
        ...result.rows[0],
        refundAmount
      };
    } catch (error) {
      logger.error('Error cancelling policy', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Calculate refund amount
   */
  calculateRefund(policy) {
    const today = new Date();
    const startDate = new Date(policy.start_date);
    const endDate = new Date(policy.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysPassed;

    // Pro-rata refund based on remaining days
    const refundRatio = daysRemaining / totalDays;
    const refundAmount = policy.premium_amount * refundRatio * 0.8; // 80% of pro-rata

    return refundAmount.toFixed(2);
  }

  /**
   * Process payment installment
   */
  async processPayment(policyId, installmentNumber, paymentData) {
    const { amount, paymentMethod, reference, transactionId } = paymentData;

    try {
      const policy = await this.getPolicy(policyId, null, true);
      let paymentSchedule;
      try {
        paymentSchedule = JSON.parse(policy.payment_schedule);
      } catch (error) {
        throw new Error('Invalid payment schedule data');
      }

      const installment = paymentSchedule.find(
        i => i.installment === installmentNumber && i.status === 'pending'
      );

      if (!installment) {
        throw new Error('Installment not found or already paid');
      }

      // Update installment status
      installment.status = 'paid';
      installment.paidAt = new Date();
      installment.paymentMethod = paymentMethod;
      installment.reference = reference;
      installment.transactionId = transactionId;

      // Check if all installments are paid
      const allPaid = paymentSchedule.every(i => i.status === 'paid');

      const query = `
        UPDATE insurance_policies
        SET 
          payment_schedule = $1,
          amount_paid = amount_paid + $2,
          fully_paid = $3
        WHERE id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        JSON.stringify(paymentSchedule),
        amount,
        allPaid,
        policyId
      ]);

      logger.info(`Payment processed for policy ${policy.policy_number}, installment ${installmentNumber}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error processing payment', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get policy documents
   */
  async getPolicyDocuments(policyId) {
    try {
      const query = `
        SELECT * FROM policy_documents
        WHERE policy_id = $1
        ORDER BY created_at DESC
      `;

      const result = await this.pool.query(query, [policyId]);

      return result.rows;
    } catch (error) {
      logger.error('Error getting policy documents', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Upload policy document
   */
  async uploadPolicyDocument(policyId, documentData) {
    const { documentType, fileName, fileUrl, fileSize } = documentData;

    try {
      const query = `
        INSERT INTO policy_documents 
        (policy_id, document_type, file_name, file_url, file_size)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        policyId,
        documentType,
        fileName,
        fileUrl,
        fileSize
      ]);

      logger.info(`Document uploaded for policy ${policyId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error uploading policy document', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new InsurancePolicyIssuanceService();
