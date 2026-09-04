const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class ClimateAdvisoryService {
  async getClimateAdvisory(farmId) {
    try {
      const farm = await db('farm_profiles').where('farmer_id', farmId).first();
      const climate = await db('climate_data').where('region', farm.location).first();
      logger.info(`Climate advisory fetched: ${farmId}`);
      return { farm_id: farmId, climate_data: climate };
    } catch (error) { logger.error(`Get advisory failed: ${error.message}`); throw error; }
  }
}

module.exports = new ClimateAdvisoryService();
