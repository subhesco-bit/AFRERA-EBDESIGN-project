const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class QualityAssuranceService {
  async inspectProduct(productId, inspectionData) {
    if (!productId) throw new Error('Missing required parameter');
    const score = Number(inspectionData?.quality_score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new Error('quality_score must be a number between 0 and 100');
    }

    try {
      // This is an explicitly configured acceptance threshold, not an AI or
      // regulatory grade. Product-specific grading belongs to a future
      // standards-backed quality-grading module.
      const result = score >= 80 ? 'pass' : 'fail';
      const id = require('uuid').v4();
      await db('qa_inspections').insert({
        id, product_id: productId, quality_score: score, result, created_at: new Date(),
      });
      logger.info(`QA inspection completed: ${productId}`);
      return { inspection_id: id, product_id: productId, quality_score: score, result, decision_basis: 'qa_threshold_80' };
    } catch (error) { logger.error(`QA inspection failed: ${error.message}`); throw error; }
  }
}

module.exports = new QualityAssuranceService();
