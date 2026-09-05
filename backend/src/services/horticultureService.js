const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class HorticultureService {
  async manageFruit(farmId, fruitType, area, plantingDate) {
  // Validate inputs
  if (!farmId) throw new Error('Missing required parameter');

    try {
      const id = require('uuid').v4();
      await db('fruit_orchards').insert({
        id, farm_id: farmId, fruit_type: fruitType, area, planting_date: plantingDate, created_at: new Date()
      });
      logger.info(`Fruit orchard managed: ${id}`);
      return { orchard_id: id, fruit_type: fruitType };
    } catch (error) { logger.error(`Manage fruit failed: ${error.message}`); throw error; }
  }
}

module.exports = new HorticultureService();
