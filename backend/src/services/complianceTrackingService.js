const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class ComplianceTrackingService {
  async trackCompliance(entityId, regulationId) {
    try {
      const id = require('uuid').v4();
      await db('compliance_records').insert({
        id, entity_id: entityId, regulation_id: regulationId, status: 'active', created_at: new Date()
      });
      logger.info(`Compliance tracked: ${entityId}`);
      return { compliance_id: id, entity_id: entityId, status: 'active' };
    } catch (error) { logger.error(`Track compliance failed: ${error.message}`); throw error; }
  }
}

module.exports = new ComplianceTrackingService();
