const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class ARService {
  async createARExperience(productId, modelData) {
    try {
      const id = require('uuid').v4();
      await db('ar_experiences').insert({ id, product_id: productId, model_data: JSON.stringify(modelData), created_at: new Date() });
      return { experience_id: id, product_id: productId, status: 'active' };
    } catch (error) { logger.error(`Create AR failed: ${error.message}`); throw error; }
  }
}
module.exports = new ARService();
