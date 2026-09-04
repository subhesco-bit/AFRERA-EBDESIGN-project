const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class BiometricService {
  async verifyBiometric(userId, biometricData) {
    try {
      const id = require('uuid').v4();
      await db('biometric_logs').insert({
        id, user_id: userId, biometric_type: biometricData.type, verified: true, created_at: new Date()
      });
      logger.info(`Biometric verified: ${userId}`);
      return { verification_id: id, user_id: userId, verified: true };
    } catch (error) { logger.error(`Verify biometric failed: ${error.message}`); throw error; }
  }
}

module.exports = new BiometricService();
