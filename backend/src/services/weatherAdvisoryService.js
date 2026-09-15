const { logger } = require('../utils/logger');

class WeatherAdvisoryService {
  async getWeatherAdvisory(lat, lng) {
    try {
      // No real weather data source (OpenWeatherMap, IMD, etc.) is
      // configured anywhere in this codebase - this used to return
      // Math.random()-generated temperature/humidity/rainfall/wind_speed
      // and a hardcoded '5-day clear skies' forecast string, presented as
      // a real weather advisory regardless of location. Honest
      // not-configured response instead, matching the pattern used
      // elsewhere in this codebase (e.g.
      // landRecordsService.fetchGovernmentLandRecords).
      logger.info(`Weather advisory requested for ${lat},${lng} - no weather data source configured`);
      return {
        location: { lat, lng },
        configured: false,
        reason: 'No weather data source is configured for this deployment',
      };
    } catch (error) { logger.error(`Advisory failed: ${error.message}`); throw error; }
  }

  async generateCropAdvisory(weather, cropType) {
    try {
      const advisories = {
        rice: 'Optimal conditions for transplanting',
        wheat: 'Begin irrigation cycle',
        corn: 'Monitor for pest activity',
      };
      return { crop: cropType, advisory: advisories[cropType] || 'Monitor conditions' };
    } catch (error) { logger.error(`Crop advisory failed: ${error.message}`); throw error; }
  }

  async checkAlerts(forecast) {
    try {
      if (!forecast || forecast.configured === false) {
        return { alerts: [], status: 'unknown', reason: 'No forecast data available to check' };
      }
      const alerts = [];
      if (forecast.rainfall > 30) alerts.push('Heavy rainfall warning');
      if (forecast.temperature > 40) alerts.push('Heat stress alert');
      return { alerts, status: alerts.length === 0 ? 'normal' : 'alert' };
    } catch (error) { logger.error(`Alert check failed: ${error.message}`); throw error; }
  }
}

module.exports = new WeatherAdvisoryService();
