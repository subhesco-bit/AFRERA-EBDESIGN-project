const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class IoTSensorsService {
  async recordSensorData(sensorId, reading) {
  // Validate inputs
  if (!sensorId) throw new Error('Missing required parameter');

    try {
      const id = require('uuid').v4();
      await db('iot_readings').insert({
        id, sensor_id: sensorId, reading_value: reading, created_at: new Date()
      });
      logger.info(`Sensor reading recorded: ${sensorId}`);
      return { reading_id: id, sensor_id: sensorId, reading };
    } catch (error) { logger.error(`Record sensor failed: ${error.message}`); throw error; }
  }
}

module.exports = new IoTSensorsService();
