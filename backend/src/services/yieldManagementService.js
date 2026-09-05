const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class YieldManagementService {
  async recordYield(farmId, cropId, quantity, unit) {
  // Validate inputs
  if (!farmId) throw new Error('Missing required parameter');

    try {
      const id = require('uuid').v4();
      await db('yields').insert({
        id, farm_id: farmId, crop_id: cropId, quantity, unit, recorded_at: new Date()
      });
      logger.info(`Yield recorded: ${id}`);
      return { yield_id: id, quantity, unit };
    } catch (error) { logger.error(`Record yield failed: ${error.message}`); throw error; }
  }

  async getYieldTrends(farmId) {
    try {
      const trends = await db('yields').where('farm_id', farmId).orderBy('recorded_at');
      return { farm_id: farmId, trends };
    } catch (error) { logger.error(`Get trends failed: ${error.message}`); throw error; }
  }
}

module.exports = new YieldManagementService();
