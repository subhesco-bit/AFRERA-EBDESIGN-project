const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class AuditTrailService {
  async logAuditEvent(userId, action, resourceId) {
    try {
      const id = require('uuid').v4();
      await db('audit_trails').insert({
        id, user_id: userId, action, resource_id: resourceId, timestamp: new Date()
      });
      logger.info(`Audit event logged: ${action}`);
      return { audit_id: id, action, timestamp: new Date() };
    } catch (error) { logger.error(`Log audit failed: ${error.message}`); throw error; }
  }
}

module.exports = new AuditTrailService();
