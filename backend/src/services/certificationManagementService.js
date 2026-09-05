const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class CertificationManagementService {
  async issueCertificate(entityId, certificationType) {
    try {
      const id = require('uuid').v4();
      const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await db('certificates').insert({
        id, entity_id: entityId, certificate_type: certificationType, expiry_date: expiryDate, issued_at: new Date()
      });
      logger.info(`Certificate issued: ${id}`);
      return { certificate_id: id, entity_id: entityId, expiry_date: expiryDate };
    } catch (error) { logger.error(`Issue certificate failed: ${error.message}`); throw error; }
  }
}

module.exports = new CertificationManagementService();
