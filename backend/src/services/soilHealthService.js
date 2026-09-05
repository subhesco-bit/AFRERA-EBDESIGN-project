const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class SoilHealthService {
  async recordSoilTest(farmId, ph, nitrogen, phosphorus, potassium) {
  // Validate inputs
  if (!farmId) throw new Error('Missing required parameter');

    try {
      const id = require('uuid').v4();
      await db('soil_tests').insert({
        id, farm_id: farmId, ph, nitrogen, phosphorus, potassium, tested_at: new Date()
      });
      logger.info(`Soil test recorded: ${id}`);
      return { test_id: id, ph, nitrogen, phosphorus, potassium };
    } catch (error) { logger.error(`Record test failed: ${error.message}`); throw error; }
  }
}

module.exports = new SoilHealthService();
