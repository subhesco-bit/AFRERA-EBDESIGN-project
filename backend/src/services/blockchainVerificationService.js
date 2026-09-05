/**
 * M028: Blockchain Verification Service
 * Provides blockchain-based traceability and verification for agricultural products
 * ensuring supply chain transparency and authenticity
 */

const db = require('../database/connection');
const logger = require('../utils/logger');
const crypto = require('crypto');

class BlockchainVerificationService {
  constructor() {
    this.serviceName = 'BlockchainVerificationService';
    this.chain = [];
    this.difficulty = 2;
    this.pendingTransactions = [];
  }

  /**
   * Create blockchain transaction for product
   */
  async createProductTransaction(productData) {
    try {
      const {
        productId,
        farmerId,
        cropId,
        quantity,
        batchNumber,
        location,
        timestamp = new Date()
      } = productData;

      // Verify product exists
      const product = await this.verifyProduct(productId);
      if (!product) {
        return {
          success: false,
          error: 'Product not found',
          productId
        };
      }

      // Create transaction
      const transaction = {
        id: this.generateTransactionId(),
        type: 'product_creation',
        productId,
        farmerId,
        cropId,
        quantity,
        batchNumber,
        location,
        timestamp,
        metadata: {
          source: 'afrera_platform',
          verificationLevel: 'initial'
        }
      };

      // Add to pending transactions
      this.pendingTransactions.push(transaction);

      // Mine block with transaction
      const block = await this.mineBlock([transaction]);

      // Store transaction in database
      await this.storeTransaction(transaction, block);

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          blockHeight: block.height,
          timestamp: transaction.timestamp,
          hash: block.hash
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - createProductTransaction error:`, error);
      return {
        success: false,
        error: 'Failed to create product transaction',
        details: error.message
      };
    }
  }

  /**
   * Add custody transfer transaction
   */
  async addCustodyTransfer(transferData) {
    try {
      const {
        productId,
        fromEntity,
        toEntity,
        transferType,
        location,
        timestamp = new Date()
      } = transferData;

      // Verify product custody chain
      const currentCustody = await this.getCurrentCustody(productId);
      if (currentCustody && currentCustody.entity !== fromEntity) {
        return {
          success: false,
          error: 'Invalid custody transfer - from entity does not match current custody',
          currentCustody: currentCustody.entity
        };
      }

      let transaction = {
        id: this.generateTransactionId(),
        type: 'custody_transfer',
        productId,
        fromEntity,
        toEntity,
        transferType,
        location,
        timestamp,
        metadata: {
          previousCustody: currentCustody?.entity,
          transferReason: transferType
        }
      };

      this.pendingTransactions.push(transaction);
      let block = await this.mineBlock([transaction]);
      await this.storeTransaction(transaction, block);

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          blockHeight: block.height,
          newCustody: toEntity,
          timestamp: transaction.timestamp
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - addCustodyTransfer error:`, error);
      return {
        success: false,
        error: 'Failed to add custody transfer',
        details: error.message
      };
    }
  }

  /**
   * Verify product authenticity
   */
  async verifyProductAuthenticity(productId) {
    try {
      // Get product transaction history
      const history = await this.getProductTransactionHistory(productId);
      
      if (history.length === 0) {
        return {
          success: false,
          error: 'No blockchain records found for product',
          productId
        };
      }

      // Verify chain integrity
      const chainValid = this.verifyChainIntegrity(history);
      
      // Get custody chain
      const custodyChain = this.extractCustodyChain(history);
      
      // Calculate authenticity score
      const authenticityScore = this.calculateAuthenticityScore(history, custodyChain);

      return {
        success: true,
        data: {
          productId,
          authenticityScore,
          chainValid,
          transactionCount: history.length,
          custodyChain,
          firstTransaction: history[0],
          lastTransaction: history[history.length - 1],
          verificationTimestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - verifyProductAuthenticity error:`, error);
      return {
        success: false,
        error: 'Failed to verify product authenticity',
        details: error.message
      };
    }
  }

  /**
   * Get product transaction history
   */
  async getProductTransactionHistory(productId) {
    const query = `
      SELECT 
        bt.transaction_id,
        bt.transaction_type,
        bt.transaction_data,
        bt.block_height,
        bt.block_hash,
        bt.timestamp
      FROM product_custody_transactions bt
      WHERE bt.transaction_data->>'productId' = $1
      ORDER BY bt.timestamp ASC
    `;

    const result = await db.query(query, [productId]);
    return result.rows.map(row => ({
      id: row.transaction_id,
      type: row.transaction_type,
      data: row.transaction_data,
      blockHeight: row.block_height,
      blockHash: row.block_hash,
      timestamp: row.timestamp
    }));
  }

  /**
   * Get current custody
   */
  async getCurrentCustody(productId) {
    let query = `
      SELECT 
        bt.transaction_data->>'toEntity' as entity,
        bt.transaction_data->>'location' as location,
        bt.timestamp
      FROM product_custody_transactions bt
      WHERE bt.transaction_data->>'productId' = $1
        AND bt.transaction_type = 'custody_transfer'
      ORDER BY bt.timestamp DESC
      LIMIT 1
    `;

    let result = await db.query(query, [productId]);
    return result.rows[0];
  }

  /**
   * Verify product exists
   */
  async verifyProduct(productId) {
    let query = `
      SELECT id, name AS product_name, created_by AS farmer_id, is_active AS status
      FROM products
      WHERE id = $1
    `;

    let result = await db.query(query, [productId]);
    return result.rows[0];
  }

  /**
   * Store transaction in database
   */
  async storeTransaction(transaction, block) {
    let query = `
      INSERT INTO product_custody_transactions (
        transaction_id, transaction_type, transaction_data,
        block_height, block_hash, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await db.query(query, [
      transaction.id,
      transaction.type,
      JSON.stringify(transaction),
      block.height,
      block.hash,
      transaction.timestamp
    ]);
  }

  /**
   * Mine new block
   */
  async mineBlock(transactions) {
    const previousBlock = this.chain[this.chain.length - 1] || this.createGenesisBlock();
    
    const newBlock = {
      height: previousBlock.height + 1,
      timestamp: new Date(),
      transactions: transactions,
      previousHash: previousBlock.hash,
      nonce: 0,
      hash: ''
    };

    // Mine block with proof of work
    newBlock.hash = this.calculateBlockHash(newBlock);
    
    while (!this.hashMatchesDifficulty(newBlock.hash, this.difficulty)) {
      newBlock.nonce++;
      newBlock.hash = this.calculateBlockHash(newBlock);
    }

    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Create genesis block
   */
  createGenesisBlock() {
    const genesisBlock = {
      height: 0,
      timestamp: new Date('2024-01-01'),
      transactions: [{
        id: 'genesis-transaction',
        type: 'genesis',
        data: { message: 'AFRERA Blockchain Genesis Block' },
        timestamp: new Date('2024-01-01')
      }],
      previousHash: '0',
      nonce: 0,
      hash: this.calculateHash('0', new Date('2024-01-01'), [], 0)
    };

    this.chain.push(genesisBlock);
    return genesisBlock;
  }

  /**
   * Calculate block hash
   */
  calculateBlockHash(block) {
    return this.calculateHash(
      block.previousHash,
      block.timestamp,
      block.transactions,
      block.nonce
    );
  }

  /**
   * Calculate hash
   */
  calculateHash(previousHash, timestamp, transactions, nonce) {
    const data = previousHash + timestamp + JSON.stringify(transactions) + nonce;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if hash matches difficulty
   */
  hashMatchesDifficulty(hash, difficulty) {
    const requiredPrefix = '0'.repeat(difficulty);
    return hash.startsWith(requiredPrefix);
  }

  /**
   * Verify chain integrity
   */
  verifyChainIntegrity(transactions) {
    // In a real blockchain, this would verify the entire chain
    // For this implementation, we'll do basic validation
    for (let i = 1; i < transactions.length; i++) {
      const current = transactions[i];
      const previous = transactions[i - 1];
      
      // Verify block height sequence
      if (current.blockHeight !== previous.blockHeight + 1) {
        return false;
      }
      
      // Verify hash consistency (simplified)
      if (!current.blockHash || current.blockHash.length !== 64) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Extract custody chain
   */
  extractCustodyChain(transactions) {
    const custodyTransfers = transactions
      .filter(t => t.type === 'custody_transfer')
      .map(t => ({
        transactionId: t.id,
        fromEntity: t.data.fromEntity,
        toEntity: t.data.toEntity,
        transferType: t.data.transferType,
        location: t.data.location,
        timestamp: t.timestamp
      }));
    
    return custodyTransfers;
  }

  /**
   * Calculate authenticity score
   */
  calculateAuthenticityScore(transactions, custodyChain) {
    let score = 100;
    
    // Deduct points for chain issues
    if (!this.verifyChainIntegrity(transactions)) {
      score -= 30;
    }
    
    // Deduct points for missing custody information
    if (custodyChain.length === 0) {
      score -= 20;
    }
    
    // Deduct points for gaps in custody chain
    const hasGaps = this.checkCustodyGaps(custodyChain);
    if (hasGaps) {
      score -= 15;
    }
    
    // Bonus for complete traceability
    if (transactions.length >= 3 && custodyChain.length >= 2) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check for custody chain gaps
   */
  checkCustodyGaps(custodyChain) {
    if (custodyChain.length < 2) return false;
    
    for (let i = 1; i < custodyChain.length; i++) {
      let current = custodyChain[i];
      let previous = custodyChain[i - 1];
      
      // Check if custody transfer is sequential
      if (current.fromEntity !== previous.toEntity) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    return `tx-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainStats() {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(DISTINCT transaction_data->>'productId') as unique_products,
          MAX(block_height) as current_block_height,
          MIN(timestamp) as genesis_timestamp,
          MAX(timestamp) as latest_timestamp
        FROM product_custody_transactions
      `;

      let result = await db.query(query);
      
      return {
        success: true,
        data: {
          totalTransactions: parseInt(result.rows[0].total_transactions),
          uniqueProducts: parseInt(result.rows[0].unique_products),
          currentBlockHeight: parseInt(result.rows[0].current_block_height),
          genesisTimestamp: result.rows[0].genesis_timestamp,
          latestTimestamp: result.rows[0].latest_timestamp,
          chainLength: this.chain.length,
          pendingTransactions: this.pendingTransactions.length
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - getBlockchainStats error:`, error);
      return {
        success: false,
        error: 'Failed to get blockchain statistics',
        details: error.message
      };
    }
  }

  /**
   * Get product traceability report
   */
  async getProductTraceabilityReport(productId) {
    try {
      let history = await this.getProductTransactionHistory(productId);
      let custodyChain = this.extractCustodyChain(history);
      
      const report = {
        productId,
        totalTransactions: history.length,
        custodyChainLength: custodyChain.length,
        journey: this.buildProductJourney(history, custodyChain),
        authenticityVerification: await this.verifyProductAuthenticity(productId),
        generatedAt: new Date().toISOString()
      };

      return {
        success: true,
        data: report
      };
    } catch (error) {
      logger.error(`${this.serviceName} - getProductTraceabilityReport error:`, error);
      return {
        success: false,
        error: 'Failed to generate traceability report',
        details: error.message
      };
    }
  }

  /**
   * Build product journey
   */
  buildProductJourney(history, custodyChain) {
    const journey = [];
    
    // Add creation event
    const creation = history.find(t => t.type === 'product_creation');
    if (creation) {
      journey.push({
        stage: 'creation',
        entity: creation.data.farmerId,
        location: creation.data.location,
        timestamp: creation.timestamp,
        details: {
          cropId: creation.data.cropId,
          quantity: creation.data.quantity,
          batchNumber: creation.data.batchNumber
        }
      });
    }
    
    // Add custody transfers
    custodyChain.forEach(transfer => {
      journey.push({
        stage: 'custody_transfer',
        fromEntity: transfer.fromEntity,
        toEntity: transfer.toEntity,
        location: transfer.location,
        timestamp: transfer.timestamp,
        details: {
          transferType: transfer.transferType
        }
      });
    });
    
    return journey;
  }

  /**
   * Process pending transactions
   */
  async processPendingTransactions() {
    if (this.pendingTransactions.length === 0) {
      return {
        success: true,
        message: 'No pending transactions to process'
      };
    }

    const transactionsToProcess = [...this.pendingTransactions];
    this.pendingTransactions = [];

    let block = await this.mineBlock(transactionsToProcess);

    for (const transaction of transactionsToProcess) {
      await this.storeTransaction(transaction, block);
    }

    return {
      success: true,
      data: {
        processedTransactions: transactionsToProcess.length,
        blockHeight: block.height,
        blockHash: block.hash
      }
    };
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions() {
    return {
      count: this.pendingTransactions.length,
      transactions: this.pendingTransactions
    };
  }
}

module.exports = new BlockchainVerificationService();