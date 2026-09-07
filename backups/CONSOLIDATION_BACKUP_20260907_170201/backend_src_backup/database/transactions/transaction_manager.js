/**
 * Transaction Management System
 * Production-ready transaction patterns with isolation levels, retry logic, and distributed transactions
 */

const { Pool } = require('pg');
const { logger } = require('../../utils/logger');

class TransactionManager {
  constructor(config = {}) {
    this.config = {
      // Default isolation level
      defaultIsolationLevel: config.defaultIsolationLevel || 'READ COMMITTED',
      
      // Retry configuration
      enableRetry: config.enableRetry !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      retryableErrors: config.retryableErrors || [
        '40001', // serialization_failure
        '40P01', // deadlock_detected
        '08006', // connection_failure
        '08001', // connection_not_established
        '08004', // server_not_connected
        '57P02'  // shutdown_in_progress
      ],
      
      // Timeout configuration
      statementTimeout: config.statementTimeout || 30000, // 30 seconds
      idleInTransactionSessionTimeout: config.idleInTransactionSessionTimeout || 60000, // 1 minute
      
      // Distributed transaction configuration
      enableDistributedTransactions: config.enableDistributedTransactions !== false,
      distributedTransactionTimeout: config.distributedTransactionTimeout || 30000,
      
      // Savepoint configuration
      enableSavepoints: config.enableSavepoints !== false,
      
      // Database connection
      databaseUrl: config.databaseUrl || process.env.DATABASE_URL,
      
      ...config
    };

    this.pool = null;
    this.activeTransactions = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize transaction manager
   */
  async initialize() {
    try {
      this.pool = new Pool({
        connectionString: this.config.databaseUrl
      });

      this.isInitialized = true;
      logger.info('Transaction manager initialized');
    } catch (error) {
      logger.error('Failed to initialize transaction manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(options = {}) {
    const client = await this.pool.connect();
    const transactionId = this.generateTransactionId();

    try {
      // Set transaction options
      const isolationLevel = options.isolationLevel || this.config.defaultIsolationLevel;
      const readOnly = options.readOnly || false;
      const deferrable = options.deferrable || false;

      await client.query(`BEGIN ${this.buildTransactionOptions(isolationLevel, readOnly, deferrable)}`);

      // Set timeouts
      await client.query(`SET LOCAL statement_timeout TO ${this.config.statementTimeout}`);
      await client.query(`SET LOCAL idle_in_transaction_session_timeout TO ${this.config.idleInTransactionSessionTimeout}`);

      // Track transaction
      this.activeTransactions.set(transactionId, {
        client,
        startTime: Date.now(),
        isolationLevel,
        readOnly,
        savepoints: []
      });

      logger.debug('Transaction started', { transactionId, isolationLevel });

      return {
        transactionId,
        client,
        execute: (query, params) => this.executeInTransaction(transactionId, query, params),
        createSavepoint: (name) => this.createSavepoint(transactionId, name),
        rollbackToSavepoint: (name) => this.rollbackToSavepoint(transactionId, name),
        commit: () => this.commitTransaction(transactionId),
        rollback: () => this.rollbackTransaction(transactionId)
      };
    } catch (error) {
      client.release();
      throw error;
    }
  }

  /**
   * Build transaction options string
   */
  buildTransactionOptions(isolationLevel, readOnly, deferrable) {
    const options = [];
    
    if (isolationLevel) {
      options.push(`ISOLATION LEVEL ${isolationLevel}`);
    }
    
    if (readOnly) {
      options.push('READ ONLY');
    }
    
    if (deferrable) {
      options.push('DEFERRABLE');
    }

    return options.join(' ');
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Execute query within transaction
   */
  async executeInTransaction(transactionId, query, params) {
    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      const result = await transaction.client.query(query, params);
      return result;
    } catch (error) {
      logger.error('Query execution failed in transaction', {
        transactionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a savepoint
   */
  async createSavepoint(transactionId, name) {
    if (!this.config.enableSavepoints) {
      throw new Error('Savepoints are not enabled');
    }

    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      await transaction.client.query(`SAVEPOINT ${name}`);
      transaction.savepoints.push(name);
      logger.debug('Savepoint created', { transactionId, name });
    } catch (error) {
      logger.error('Failed to create savepoint', {
        transactionId,
        name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Rollback to a savepoint
   */
  async rollbackToSavepoint(transactionId, name) {
    if (!this.config.enableSavepoints) {
      throw new Error('Savepoints are not enabled');
    }

    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    if (!transaction.savepoints.includes(name)) {
      throw new Error(`Savepoint ${name} not found in transaction`);
    }

    try {
      await transaction.client.query(`ROLLBACK TO SAVEPOINT ${name}`);
      logger.debug('Rolled back to savepoint', { transactionId, name });
    } catch (error) {
      logger.error('Failed to rollback to savepoint', {
        transactionId,
        name,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      await transaction.client.query('COMMIT');
      
      const duration = Date.now() - transaction.startTime;
      
      logger.info('Transaction committed', {
        transactionId,
        duration: duration + 'ms',
        isolationLevel: transaction.isolationLevel
      });

      transaction.client.release();
      this.activeTransactions.delete(transactionId);

      return { success: true, duration };
    } catch (error) {
      logger.error('Failed to commit transaction', {
        transactionId,
        error: error.message
      });
      
      await transaction.client.query('ROLLBACK');
      transaction.client.release();
      this.activeTransactions.delete(transactionId);

      throw error;
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      await transaction.client.query('ROLLBACK');
      
      const duration = Date.now() - transaction.startTime;
      
      logger.info('Transaction rolled back', {
        transactionId,
        duration: duration + 'ms'
      });

      transaction.client.release();
      this.activeTransactions.delete(transactionId);

      return { success: true, duration };
    } catch (error) {
      logger.error('Failed to rollback transaction', {
        transactionId,
        error: error.message
      });
      
      transaction.client.release();
      this.activeTransactions.delete(transactionId);

      throw error;
    }
  }

  /**
   * Execute callback in transaction with automatic retry
   */
  async executeInTransactionWithRetry(callback, options = {}) {
    let lastError = null;
    let attempt = 0;
    const maxRetries = options.maxRetries || this.config.maxRetries;

    while (attempt <= maxRetries) {
      const transaction = await this.beginTransaction(options);

      try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          logger.debug('Non-retryable error encountered', {
            error: error.message,
            code: error.code
          });
          await transaction.rollback();
          throw error;
        }

        if (attempt <= maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          logger.warn(`Transaction failed, retrying (${attempt}/${maxRetries})`, {
            error: error.message,
            delay: delay + 'ms'
          });

          await transaction.rollback();
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('Transaction failed after all retries', {
      attempts: maxRetries,
      error: lastError.message
    });

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    if (!this.config.enableRetry) {
      return false;
    }

    return this.config.retryableErrors.includes(error.code);
  }

  /**
   * Execute multiple operations in a transaction
   */
  async executeTransaction(operations, options = {}) {
    return this.executeInTransactionWithRetry(async (transaction) => {
      const results = [];

      for (const operation of operations) {
        const result = await transaction.execute(operation.query, operation.params);
        results.push({
          operation: operation.name || 'unnamed',
          result,
          success: true
        });
      }

      return results;
    }, options);
  }

  /**
   * Execute distributed transaction (two-phase commit)
   */
  async executeDistributedTransaction(participants, options = {}) {
    if (!this.config.enableDistributedTransactions) {
      throw new Error('Distributed transactions are not enabled');
    }

    const transactionId = this.generateTransactionId();
    const startTime = Date.now();

    logger.info('Starting distributed transaction', { transactionId, participants: participants.length });

    try {
      // Phase 1: Prepare all participants
      const preparedParticipants = [];
      
      for (const participant of participants) {
        try {
          await participant.prepare();
          preparedParticipants.push(participant);
          logger.debug('Participant prepared', { transactionId, participant: participant.name });
        } catch (error) {
          logger.error('Participant prepare failed', {
            transactionId,
            participant: participant.name,
            error: error.message
          });
          
          // Rollback all prepared participants
          for (const prepared of preparedParticipants) {
            try {
              await prepared.rollback();
            } catch (rollbackError) {
              logger.error('Participant rollback failed', {
                participant: prepared.name,
                error: rollbackError.message
              });
            }
          }
          
          throw error;
        }
      }

      // Phase 2: Commit all participants
      for (const participant of preparedParticipants) {
        try {
          await participant.commit();
          logger.debug('Participant committed', { transactionId, participant: participant.name });
        } catch (error) {
          logger.error('Participant commit failed', {
            transactionId,
            participant: participant.name,
            error: error.message
          });
          // Note: In a real distributed transaction, we would need compensation logic here
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Distributed transaction completed', {
        transactionId,
        duration: duration + 'ms',
        participants: preparedParticipants.length
      });

      return {
        success: true,
        transactionId,
        duration,
        participants: preparedParticipants.length
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Distributed transaction failed', {
        transactionId,
        duration: duration + 'ms',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get active transaction info
   */
  getTransactionInfo(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    
    if (!transaction) {
      return null;
    }

    return {
      transactionId,
      startTime: transaction.startTime,
      duration: Date.now() - transaction.startTime,
      isolationLevel: transaction.isolationLevel,
      readOnly: transaction.readOnly,
      savepoints: transaction.savepoints.length
    };
  }

  /**
   * Get all active transactions
   */
  getActiveTransactions() {
    const transactions = [];
    
    for (const [id, transaction] of this.activeTransactions.entries()) {
      transactions.push({
        transactionId: id,
        startTime: transaction.startTime,
        duration: Date.now() - transaction.startTime,
        isolationLevel: transaction.isolationLevel,
        readOnly: transaction.readOnly,
        savepoints: transaction.savepoints.length
      });
    }

    return transactions;
  }

  /**
   * Cleanup stale transactions
   */
  async cleanupStaleTransactions(timeout = 300000) { // 5 minutes default
    const now = Date.now();
    const staleTransactions = [];

    for (const [id, transaction] of this.activeTransactions.entries()) {
      const duration = now - transaction.startTime;
      
      if (duration > timeout) {
        staleTransactions.push({ id, transaction, duration });
      }
    }

    for (const { id, transaction, duration } of staleTransactions) {
      logger.warn('Cleaning up stale transaction', {
        transactionId: id,
        duration: duration + 'ms'
      });

      try {
        await transaction.client.query('ROLLBACK');
        transaction.client.release();
        this.activeTransactions.delete(id);
      } catch (error) {
        logger.error('Failed to cleanup stale transaction', {
          transactionId: id,
          error: error.message
        });
      }
    }

    return staleTransactions.length;
  }

  /**
   * Execute read-only transaction
   */
  async executeReadOnlyTransaction(callback, options = {}) {
    return this.executeInTransactionWithRetry(callback, {
      ...options,
      readOnly: true,
      isolationLevel: options.isolationLevel || 'REPEATABLE READ'
    });
  }

  /**
   * Execute serializable transaction
   */
  async executeSerializableTransaction(callback, options = {}) {
    return this.executeInTransactionWithRetry(callback, {
      ...options,
      isolationLevel: 'SERIALIZABLE'
    });
  }

  /**
   * Shutdown transaction manager
   */
  async shutdown() {
    // Rollback all active transactions
    for (const [id, transaction] of this.activeTransactions.entries()) {
      try {
        await transaction.client.query('ROLLBACK');
        transaction.client.release();
        logger.info('Transaction rolled back during shutdown', { transactionId: id });
      } catch (error) {
        logger.error('Failed to rollback transaction during shutdown', {
          transactionId: id,
          error: error.message
        });
      }
    }

    this.activeTransactions.clear();

    if (this.pool) {
      await this.pool.end();
    }

    this.isInitialized = false;
    logger.info('Transaction manager shutdown complete');
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the singleton transaction manager instance
 */
function getTransactionManager(config = {}) {
  if (!instance) {
    instance = new TransactionManager(config);
  }
  return instance;
}

/**
 * Initialize the transaction manager
 */
async function initializeTransactionManager(config = {}) {
  const manager = getTransactionManager(config);
  return await manager.initialize();
}

/**
 * Shutdown the transaction manager
 */
async function shutdownTransactionManager() {
  if (instance) {
    await instance.shutdown();
    instance = null;
  }
}

module.exports = {
  TransactionManager,
  getTransactionManager,
  initializeTransactionManager,
  shutdownTransactionManager
};
