/**
 * Digital Wallet Service
 * Handles digital wallet operations including balance management and transactions
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');

class WalletService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      logger.info('WalletService initialized');
    } catch (error) {
      logger.error('WalletService initialization failed', error);
    }
  }

  /**
   * Get wallet balance for a user
   */
  async getBalance(userId) {
    try {
      const query = `
        SELECT 
          w.wallet_id,
          w.user_id,
          w.balance,
          w.currency,
          w.status,
          w.created_at,
          w.updated_at
        FROM wallets w
        WHERE w.user_id = $1 AND w.status = 'active'
      `;
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        // Create wallet if it doesn't exist
        return await this.createWallet({ userId });
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get wallet balance failed', error);
      throw error;
    }
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(walletData) {
    const { userId, currency = 'INR', initialBalance = 0 } = walletData;

    try {
      const query = `
        INSERT INTO wallets (
          user_id, balance, currency, status, created_at, updated_at
        ) VALUES ($1, $2, $3, 'active', NOW(), NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [userId, initialBalance, currency]);
      
      logger.info(`Wallet created for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Create wallet failed', error);
      throw error;
    }
  }

  /**
   * Add funds to wallet
   */
  async addFunds(walletId, fundData) {
    const { amount, source, referenceId, description } = fundData;

    try {
      // Start transaction
      await this.db.query('BEGIN');

      // Update wallet balance
      const updateQuery = `
        UPDATE wallets 
        SET balance = balance + $1,
            updated_at = NOW()
        WHERE wallet_id = $2
        RETURNING *
      `;
      const walletResult = await this.db.query(updateQuery, [amount, walletId]);
      
      if (walletResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      // Create transaction record
      const transactionQuery = `
        INSERT INTO wallet_transactions (
          wallet_id, type, amount, source, reference_id, 
          description, status, created_at
        ) VALUES ($1, 'credit', $2, $3, $4, $5, 'completed', NOW())
        RETURNING *
      `;
      const transactionResult = await this.db.query(transactionQuery, [
        walletId,
        amount,
        source,
        referenceId,
        description || 'Funds added'
      ]);

      await this.db.query('COMMIT');

      logger.info(`Added ${amount} to wallet ${walletId}`);
      return {
        wallet: walletResult.rows[0],
        transaction: transactionResult.rows[0]
      };
    } catch (error) {
      await this.db.query('ROLLBACK');
      logger.error('Add funds failed', error);
      throw error;
    }
  }

  /**
   * Deduct funds from wallet
   */
  async deductFunds(walletId, amount, reason) {
    try {
      // Start transaction
      await this.db.query('BEGIN');

      // Check sufficient balance
      const balanceQuery = `
        SELECT balance FROM wallets WHERE wallet_id = $1 FOR UPDATE
      `;
      const balanceResult = await this.db.query(balanceQuery, [walletId]);
      
      if (balanceResult.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      if (balanceResult.rows[0].balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Update wallet balance
      const updateQuery = `
        UPDATE wallets 
        SET balance = balance - $1,
            updated_at = NOW()
        WHERE wallet_id = $2
        RETURNING *
      `;
      const walletResult = await this.db.query(updateQuery, [amount, walletId]);

      // Create transaction record
      const transactionQuery = `
        INSERT INTO wallet_transactions (
          wallet_id, type, amount, description, status, created_at
        ) VALUES ($1, 'debit', $2, $3, 'completed', NOW())
        RETURNING *
      `;
      const transactionResult = await this.db.query(transactionQuery, [
        walletId,
        amount,
        reason
      ]);

      await this.db.query('COMMIT');

      logger.info(`Deducted ${amount} from wallet ${walletId}`);
      return {
        wallet: walletResult.rows[0],
        transaction: transactionResult.rows[0]
      };
    } catch (error) {
      await this.db.query('ROLLBACK');
      logger.error('Deduct funds failed', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(walletId, filters = {}) {
    const { limit = 50, offset = 0, type, startDate, endDate } = filters;

    try {
      let query = `
        SELECT 
          wt.transaction_id,
          wt.wallet_id,
          wt.type,
          wt.amount,
          wt.source,
          wt.reference_id,
          wt.description,
          wt.status,
          wt.created_at
        FROM wallet_transactions wt
        WHERE wt.wallet_id = $1
      `;
      const params = [walletId];
      let paramCount = 1;

      if (type) {
        paramCount++;
        query += ` AND wt.type = $${paramCount}`;
        params.push(type);
      }

      if (startDate) {
        paramCount++;
        query += ` AND wt.created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND wt.created_at <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY wt.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total FROM wallet_transactions 
        WHERE wallet_id = $1
      `;
      const countResult = await this.db.query(countQuery, [walletId]);

      return {
        transactions: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset
      };
    } catch (error) {
      logger.error('Get transaction history failed', error);
      throw error;
    }
  }

  /**
   * Transfer funds between wallets
   */
  async transferFunds(fromWalletId, toWalletId, amount, description) {
    try {
      // Start transaction
      await this.db.query('BEGIN');

      // Deduct from source wallet
      const deductResult = await this.deductFunds(fromWalletId, amount, description);

      // Add to destination wallet
      const addResult = await this.addFunds(toWalletId, {
        amount,
        source: 'transfer',
        referenceId: deductResult.transaction.transaction_id,
        description: description || 'Fund transfer'
      });

      await this.db.query('COMMIT');

      logger.info(`Transferred ${amount} from wallet ${fromWalletId} to ${toWalletId}`);
      return {
        fromTransaction: deductResult.transaction,
        toTransaction: addResult.transaction
      };
    } catch (error) {
      await this.db.query('ROLLBACK');
      logger.error('Transfer funds failed', error);
      throw error;
    }
  }

  /**
   * Get wallet statistics
   */
  async getWalletStatistics(userId) {
    try {
      const query = `
        SELECT 
          w.wallet_id,
          w.balance,
          w.currency,
          COUNT(wt.transaction_id) as total_transactions,
          SUM(CASE WHEN wt.type = 'credit' THEN wt.amount ELSE 0 END) as total_credits,
          SUM(CASE WHEN wt.type = 'debit' THEN wt.amount ELSE 0 END) as total_debits
        FROM wallets w
        LEFT JOIN wallet_transactions wt ON w.wallet_id = wt.wallet_id
        WHERE w.user_id = $1 AND w.status = 'active'
        GROUP BY w.wallet_id, w.balance, w.currency
      `;
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get wallet statistics failed', error);
      throw error;
    }
  }
}

module.exports = new WalletService();
