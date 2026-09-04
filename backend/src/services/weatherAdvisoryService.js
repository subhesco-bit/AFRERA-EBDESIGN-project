const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class WeatherAdvisoryService {
  async getWeatherAdvisory(lat, lng) {
    try {
      const advisory = {
        location: { lat, lng },
        temperature: 25 + Math.random() * 15,
        humidity: 40 + Math.random() * 50,
        rainfall: Math.random() * 50,
        wind_speed: Math.random() * 30,
        forecast: '5-day clear skies, optimal for farming'
      };
      logger.info(`Advisory generated: ${lat},${lng}`);
      return advisory;
    } catch (error) { logger.error(`Advisory failed: ${error.message}`); throw error; }
  }

  async generateCropAdvisory(weather, cropType) {
    try {
      const advisories = {
        rice: 'Optimal conditions for transplanting',
        wheat: 'Begin irrigation cycle',
        corn: 'Monitor for pest activity'
      };
      return { crop: cropType, advisory: advisories[cropType] || 'Monitor conditions' };
    } catch (error) { logger.error(`Crop advisory failed: ${error.message}`); throw error; }
  }

  async checkAlerts(forecast) {
    try {
      const alerts = [];
      if (forecast.rainfall > 30) alerts.push('Heavy rainfall warning');
      if (forecast.temperature > 40) alerts.push('Heat stress alert');
      return { alerts, status: alerts.length === 0 ? 'normal' : 'alert' };
    } catch (error) { logger.error(`Alert check failed: ${error.message}`); throw error; }
  }
}

module.exports = new WeatherAdvisoryService();
