const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class RiskAssessmentService {
  async assessRisk(entityId, riskFactors) {
    try {
      const riskScore = riskFactors.reduce((sum, f) => sum + f.weight, 0);
      const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
      const id = require('uuid').v4();
      await db('risk_assessments').insert({
        id, entity_id: entityId, risk_score: riskScore, risk_level: riskLevel, created_at: new Date()
      });
      logger.info(`Risk assessment completed: ${entityId}`);
      return { assessment_id: id, entity_id: entityId, risk_level: riskLevel };
    } catch (error) { logger.error(`Assess risk failed: ${error.message}`); throw error; }
  }
}

module.exports = new RiskAssessmentService();
