/**
 * Digital Wallet Service
 * Handles digital wallet operations including balance management and transactions
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { withTransaction } = require('../core/withTransaction');

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
   *
   * BR-08: the balance UPDATE and the wallet_transactions INSERT must
   * commit together — if the ledger row failed to insert after the balance
   * had already moved, the wallet would show a credit with no audit trail
   * behind it. The previous implementation issued BEGIN/COMMIT/ROLLBACK via
   * `this.db`, which is the shared pool (see getPostgreSQL()), not a
   * dedicated client — each `this.db.query(...)` call could be handed a
   * different pooled connection, so the BEGIN/COMMIT pair frequently did not
   * even wrap the same session and gave no real atomicity. withTransaction
   * uses one client for every statement, so this is a genuine fix, not just
   * a rename. No external call is involved.
   */
  async addFunds(walletId, fundData) {
    return withTransaction(
      (client) => this._addFundsWithClient(client, walletId, fundData),
      { name: 'wallet.addFunds', lockTables: ['wallets'] }
    );
  }

  async _addFundsWithClient(client, walletId, fundData) {
    const { amount, source, referenceId, description } = fundData;

    // Update wallet balance
    const updateQuery = `
      UPDATE wallets
      SET balance = balance + $1,
          updated_at = NOW()
      WHERE wallet_id = $2
      RETURNING *
    `;
    const walletResult = await client.query(updateQuery, [amount, walletId]);

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
    const transactionResult = await client.query(transactionQuery, [
      walletId,
      amount,
      source,
      referenceId,
      description || 'Funds added',
    ]);

    logger.info(`Added ${amount} to wallet ${walletId}`);
    return {
      wallet: walletResult.rows[0],
      transaction: transactionResult.rows[0],
    };
  }

  /**
   * Deduct funds from wallet
   *
   * BR-08: same reasoning as addFunds — the balance check/UPDATE and the
   * wallet_transactions INSERT must be atomic, and the previous
   * BEGIN/COMMIT via the shared pool did not actually guarantee that.
   */
  async deductFunds(walletId, amount, reason) {
    return withTransaction(
      (client) => this._deductFundsWithClient(client, walletId, amount, reason),
      { name: 'wallet.deductFunds', lockTables: ['wallets'] }
    );
  }

  async _deductFundsWithClient(client, walletId, amount, reason) {
    // Check sufficient balance
    const balanceQuery = `
      SELECT balance FROM wallets WHERE wallet_id = $1 FOR UPDATE
    `;
    const balanceResult = await client.query(balanceQuery, [walletId]);

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
    const walletResult = await client.query(updateQuery, [amount, walletId]);

    // Create transaction record
    const transactionQuery = `
      INSERT INTO wallet_transactions (
        wallet_id, type, amount, description, status, created_at
      ) VALUES ($1, 'debit', $2, $3, 'completed', NOW())
      RETURNING *
    `;
    const transactionResult = await client.query(transactionQuery, [
      walletId,
      amount,
      reason,
    ]);

    logger.info(`Deducted ${amount} from wallet ${walletId}`);
    return {
      wallet: walletResult.rows[0],
      transaction: transactionResult.rows[0],
    };
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
        offset,
      };
    } catch (error) {
      logger.error('Get transaction history failed', error);
      throw error;
    }
  }

  /**
   * Transfer funds between wallets
   *
   * BR-08: a transfer is a deduct + a credit that must both land or neither
   * does — a failure between the two would either destroy money (deducted,
   * never credited) or create it (credited without a matching deduction).
   * Both legs now run against the same client inside one transaction; the
   * table lock order (wallets only, single table) matches the other wallet
   * boundaries so two concurrent transfers can't deadlock against each other.
   */
  async transferFunds(fromWalletId, toWalletId, amount, description) {
    return withTransaction(async (client) => {
      // Deduct from source wallet
      const deductResult = await this._deductFundsWithClient(client, fromWalletId, amount, description);

      // Add to destination wallet
      const addResult = await this._addFundsWithClient(client, toWalletId, {
        amount,
        source: 'transfer',
        referenceId: deductResult.transaction.transaction_id,
        description: description || 'Fund transfer',
      });

      logger.info(`Transferred ${amount} from wallet ${fromWalletId} to ${toWalletId}`);
      return {
        fromTransaction: deductResult.transaction,
        toTransaction: addResult.transaction,
      };
    }, { name: 'wallet.transferFunds', lockTables: ['wallets'] });
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
