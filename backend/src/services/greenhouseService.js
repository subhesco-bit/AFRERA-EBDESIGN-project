const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class GreenhouseService {
  async createGreenhouse(data) {
    try {
      const id = require('uuid').v4();
      await db('greenhouses').insert({
        id, farmer_id: data.farmer_id, area: data.area, crops: data.crops, created_at: new Date()
      });
      logger.info(`Greenhouse created: ${id}`);
      return { greenhouse_id: id, status: 'active' };
    } catch (error) { logger.error(`Create greenhouse failed: ${error.message}`); throw error; }
  }
}

module.exports = new GreenhouseService();
