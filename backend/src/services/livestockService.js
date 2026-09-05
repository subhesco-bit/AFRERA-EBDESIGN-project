const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class LivestockService {
  async registerLivestock(farmId, type, count, breed) {
  // Validate inputs
  if (!farmId) throw new Error('Missing required parameter');

    try {
      const id = require('uuid').v4();
      await db('livestock').insert({
        id, farm_id: farmId, type, count, breed, registered_at: new Date()
      });
      logger.info(`Livestock registered: ${id}`);
      return { livestock_id: id, type, count };
    } catch (error) { logger.error(`Register livestock failed: ${error.message}`); throw error; }
  }
}

module.exports = new LivestockService();
