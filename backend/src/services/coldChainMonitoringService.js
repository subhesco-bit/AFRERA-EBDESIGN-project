const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class ColdChainMonitoringService {
  async monitorTemperature(unitId, temperature) {
    try {
      await db('temperature_readings').insert({
        id: require('uuid').v4(), cold_storage_unit_id: unitId, temperature,
        recorded_at: new Date()
      });
      if (temperature > 5 || temperature < -18) {
        await db('temperature_alerts').insert({
          id: require('uuid').v4(), cold_storage_unit_id: unitId,
          alert_type: temperature > 5 ? 'HIGH_TEMP' : 'LOW_TEMP', created_at: new Date()
        });
      }
      logger.info(`Temperature monitored: ${unitId}`);
      return { unit_id: unitId, temperature, status: 'recorded' };
    } catch (error) { logger.error(`Monitor failed: ${error.message}`); throw error; }
  }

  async getTemperatureHistory(unitId) {
    try {
      const readings = await db('temperature_readings').where('cold_storage_unit_id', unitId)
        .orderBy('recorded_at', 'desc').limit(100);
      return { unit_id: unitId, readings };
    } catch (error) { logger.error(`Get history failed: ${error.message}`); throw error; }
  }
}

module.exports = new ColdChainMonitoringService();
