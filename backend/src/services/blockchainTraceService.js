const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class BlockchainTraceService {
  async recordTransaction(productId, fromAddress, toAddress) {
    try {
      const id = require('uuid').v4();
      await db('blockchain_records').insert({
        id, product_id: productId, from_address: fromAddress, to_address: toAddress, created_at: new Date()
      });
      logger.info(`Blockchain transaction recorded: ${id}`);
      return { tx_id: id, product_id: productId, status: 'confirmed' };
    } catch (error) { logger.error(`Record transaction failed: ${error.message}`); throw error; }
  }
}

module.exports = new BlockchainTraceService();
