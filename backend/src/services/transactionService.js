/**
 * Transaction Service
 * Handles transaction processing, management, and tracking
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');

class TransactionService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      logger.info('TransactionService initialized');
    } catch (error) {
      logger.error('TransactionService initialization failed', error);
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData) {
  // Validate inputs
  if (!transactionData) throw new Error('Missing required parameter');

    const {
      userId,
      type,
      amount,
      currency = 'INR',
      description,
      category,
      referenceId,
      metadata = {}
    } = transactionData;

    try {
      const query = `
        INSERT INTO transactions (
          user_id, type, amount, currency, description, 
          category, reference_id, metadata, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
        RETURNING *
      `;
      const values = [
        userId,
        type,
        amount,
        currency,
        description,
        category,
        referenceId,
        JSON.stringify(metadata)
      ];
      
      const result = await this.db.query(query, values);
      logger.info(`Transaction created: ${result.rows[0].transaction_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Create transaction failed', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId) {
    try {
      const query = `
        SELECT 
          t.transaction_id,
          t.user_id,
          t.type,
          t.amount,
          t.currency,
          t.description,
          t.category,
          t.reference_id,
          t.metadata,
          t.status,
          t.created_at,
          t.updated_at,
          u.username,
          u.email
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE t.transaction_id = $1
      `;
      const result = await this.db.query(query, [transactionId]);
      
      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get transaction failed', error);
      throw error;
    }
  }

  /**
   * Get all transactions for a user
   */
  async getUserTransactions(userId, filters = {}) {
    const { limit = 50, offset = 0, type, status, category, startDate, endDate } = filters;

    try {
      let query = `
        SELECT 
          t.transaction_id,
          t.user_id,
          t.type,
          t.amount,
          t.currency,
          t.description,
          t.category,
          t.reference_id,
          t.status,
          t.created_at,
          t.updated_at
        FROM transactions t
        WHERE t.user_id = $1
      `;
      const params = [userId];
      let paramCount = 1;

      if (type) {
        paramCount++;
        query += ` AND t.type = $${paramCount}`;
        params.push(type);
      }

      if (status) {
        paramCount++;
        query += ` AND t.status = $${paramCount}`;
        params.push(status);
      }

      if (category) {
        paramCount++;
        query += ` AND t.category = $${paramCount}`;
        params.push(category);
      }

      if (startDate) {
        paramCount++;
        query += ` AND t.created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND t.created_at <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      
      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1`;
      const countParams = [userId];
      let countParamCount = 1;

      if (type) {
        countParamCount++;
        countQuery += ` AND type = $${countParamCount}`;
        countParams.push(type);
      }

      if (status) {
        countParamCount++;
        countQuery += ` AND status = $${countParamCount}`;
        countParams.push(status);
      }

      if (category) {
        countParamCount++;
        countQuery += ` AND category = $${countParamCount}`;
        countParams.push(category);
      }

      const countResult = await this.db.query(countQuery, countParams);

      return {
        transactions: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      };
    } catch (error) {
      logger.error('Get user transactions failed', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateStatus(transactionId, statusData) {
    const { status, metadata, notes } = statusData;

    try {
      const query = `
        UPDATE transactions 
        SET status = $1,
            metadata = COALESCE($2, metadata),
            notes = COALESCE($3, notes),
            updated_at = NOW()
        WHERE transaction_id = $4
        RETURNING *
      `;
      const result = await this.db.query(query, [
        status,
        metadata ? JSON.stringify(metadata) : null,
        notes,
        transactionId
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      logger.info(`Transaction ${transactionId} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Update transaction status failed', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics for a user
   */
  async getUserTransactionStatistics(userId, filters = {}) {
    const { startDate, endDate, category } = filters;

    try {
      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credits,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debits,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount
        FROM transactions
        WHERE user_id = $1
      `;
      const params = [userId];
      let paramCount = 1;

      if (startDate) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        params.push(endDate);
      }

      if (category) {
        paramCount++;
        query += ` AND category = $${paramCount}`;
        params.push(category);
      }

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Get user transaction statistics failed', error);
      throw error;
    }
  }

  /**
   * Process transaction (complete payment flow)
   */
  async processTransaction(transactionId) {
    try {
      // Get transaction details
      const transaction = await this.getTransaction(transactionId);
      
      if (transaction.status !== 'pending') {
        throw new Error('Transaction can only be processed from pending status');
      }

      // Start transaction
      await this.db.query('BEGIN');

      // Update transaction status to processing
      await this.updateStatus(transactionId, { status: 'processing' });

      // Process based on transaction type
      let processResult;
      switch (transaction.type) {
        case 'payment':
          processResult = await this.processPaymentTransaction(transaction);
          break;
        case 'refund':
          processResult = await this.processRefundTransaction(transaction);
          break;
        case 'transfer':
          processResult = await this.processTransferTransaction(transaction);
          break;
        default:
          throw new Error(`Unknown transaction type: ${transaction.type}`);
      }

      // Update final status
      await this.updateStatus(transactionId, { 
        status: processResult.success ? 'completed' : 'failed',
        metadata: processResult.metadata
      });

      await this.db.query('COMMIT');

      logger.info(`Transaction ${transactionId} processed successfully`);
      return await this.getTransaction(transactionId);
    } catch (error) {
      await this.db.query('ROLLBACK');
      await this.updateStatus(transactionId, { status: 'failed' });
      logger.error('Process transaction failed', error);
      throw error;
    }
  }

  /**
   * Process payment transaction
   */
  async processPaymentTransaction(transaction) {
    // Integrate with payment gateway service
    const paymentGatewayService = require('./paymentGatewayService');
    
    try {
      const result = await paymentGatewayService.processPayment({
        userId: transaction.user_id,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        metadata: transaction.metadata
      });

      return {
        success: result.status === 'completed',
        metadata: { gatewayResponse: result }
      };
    } catch (error) {
      logger.error('Process payment transaction failed', error);
      return { success: false, metadata: { error: error.message } };
    }
  }

  /**
   * Process refund transaction
   */
  async processRefundTransaction(transaction) {
    // Integrate with payment gateway service
    const paymentGatewayService = require('./paymentGatewayService');
    
    try {
      const result = await paymentGatewayService.refundPayment(
        transaction.reference_id,
        { amount: transaction.amount, reason: transaction.description }
      );

      return {
        success: result.status === 'completed',
        metadata: { gatewayResponse: result }
      };
    } catch (error) {
      logger.error('Process refund transaction failed', error);
      return { success: false, metadata: { error: error.message } };
    }
  }

  /**
   * Process transfer transaction
   */
  async processTransferTransaction(transaction) {
    // Integrate with wallet service
    const walletService = require('./walletService');
    
    try {
      const metadata = transaction.metadata || {};
      const result = await walletService.transferFunds(
        metadata.fromWalletId,
        metadata.toWalletId,
        transaction.amount,
        transaction.description
      );

      return {
        success: true,
        metadata: { transferResult: result }
      };
    } catch (error) {
      logger.error('Process transfer transaction failed', error);
      return { success: false, metadata: { error: error.message } };
    }
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(transactionId, reason) {
    try {
      const transaction = await this.getTransaction(transactionId);
      
      if (transaction.status !== 'pending' && transaction.status !== 'processing') {
        throw new Error('Cannot cancel transaction in current status');
      }

      const result = await this.updateStatus(transactionId, {
        status: 'cancelled',
        notes: reason
      });

      logger.info(`Transaction ${transactionId} cancelled`);
      return result;
    } catch (error) {
      logger.error('Cancel transaction failed', error);
      throw error;
    }
  }
}

module.exports = new TransactionService();
