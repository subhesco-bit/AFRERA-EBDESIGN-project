/**
 * Loan Management Service
 * Handles agricultural loans for farmers (short-term, seasonal)
 *
 * Priority: P0 - Critical for marketplace launch
 * Enables: farmer financing, loan tracking, repayment management
 */

const db = require('../database/dbConnection');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class LoanManagementService {
  /**
   * Create loan application
   */
  async createLoanApplication(farmerId, loanData) {
  // Validate inputs
  if (!farmerId) throw new Error('Missing required parameter');

    try {
      if (!farmerId || !loanData.amount || !loanData.purpose) {
        throw new ValidationError('Missing required fields');
      }

      const loanId = require('uuid').v4();
      const loan = await db('loans').insert({
        id: loanId,
        farmer_id: farmerId,
        amount: loanData.amount,
        purpose: loanData.purpose,
        tenure_months: loanData.tenure_months || 12,
        interest_rate: loanData.interest_rate || 12,
        status: 'applied',
        application_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*');

      logger.info(`Loan application created: ${farmerId}`);

      return {
        loan_id: loanId,
        status: 'applied',
        amount: loanData.amount
      };
    } catch (error) {
      logger.error(`Create loan application failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get loan status
   */
  async getLoanStatus(loanId) {
    try {
      let loan = await db('loans').where('id', loanId).first();
      if (!loan) throw new NotFoundError('Loan not found');

      const payments = await db('loan_payments').where('loan_id', loanId);

      return {
        loan_id: loanId,
        status: loan.status,
        amount: loan.amount,
        interest_rate: loan.interest_rate,
        disbursed_date: loan.disbursed_date,
        total_payments_made: payments.filter(p => p.status === 'completed').length,
        total_payments_due: loan.tenure_months
      };
    } catch (error) {
      logger.error(`Get loan status failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve loan (admin)
   */
  async approveLoan(loanId, adminNotes) {
    try {
      await db('loans')
        .where('id', loanId)
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          approved_date: new Date(),
          updated_at: new Date()
        });

      logger.info(`Loan approved: ${loanId}`);

      return {
        loan_id: loanId,
        status: 'approved'
      };
    } catch (error) {
      logger.error(`Approve loan failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disburse loan (release funds)
   */
  async disburseLoan(loanId) {
    try {
      let loan = await db('loans').where('id', loanId).first();
      if (!loan) throw new NotFoundError('Loan not found');

      await db('loans')
        .where('id', loanId)
        .update({
          status: 'disbursed',
          disbursed_date: new Date(),
          updated_at: new Date()
        });

      logger.info(`Loan disbursed: ${loanId}`);

      return {
        loan_id: loanId,
        status: 'disbursed',
        amount: loan.amount
      };
    } catch (error) {
      logger.error(`Disburse loan failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Track loan repayment
   */
  async trackRepayment(loanId) {
    try {
      let loan = await db('loans').where('id', loanId).first();
      if (!loan) throw new NotFoundError('Loan not found');

      let payments = await db('loan_payments')
        .where('loan_id', loanId)
        .orderBy('due_date');

      const completed = payments.filter(p => p.status === 'completed').length;
      const pending = payments.filter(p => p.status === 'pending').length;
      const overdue = payments.filter(p => p.status === 'overdue').length;

      return {
        loan_id: loanId,
        total_amount: loan.amount,
        completed_payments: completed,
        pending_payments: pending,
        overdue_payments: overdue
      };
    } catch (error) {
      logger.error(`Track repayment failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new LoanManagementService();
