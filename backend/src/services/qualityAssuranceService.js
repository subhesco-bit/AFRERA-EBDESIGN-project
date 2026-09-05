const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class QualityAssuranceService {
  async inspectProduct(productId, inspectionData) {
  // Validate inputs
  if (!productId) throw new Error('Missing required parameter');

    try {
      const result = inspectionData.quality_score >= 80 ? 'pass' : 'fail';
      const id = require('uuid').v4();
      await db('qa_inspections').insert({
        id, product_id: productId, quality_score: inspectionData.quality_score, result, created_at: new Date()
      });
      logger.info(`QA inspection completed: ${productId}`);
      return { inspection_id: id, product_id: productId, result };
    } catch (error) { logger.error(`QA inspection failed: ${error.message}`); throw error; }
  }
}

module.exports = new QualityAssuranceService();
