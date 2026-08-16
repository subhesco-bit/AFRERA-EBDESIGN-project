const platformTelemetryService = require('../services/platformTelemetryService');
const { logger } = require('../utils/logger');

const platformTelemetryController = {
  getStatus: async (req, res) => {
    try {
      const [systemMetrics, serviceHealth] = await Promise.all([
        platformTelemetryService.getSystemMetrics(),
        platformTelemetryService.getServiceHealth(),
      ]);
      res.json({
        success: true,
        data: {
          status: Object.values(serviceHealth).every((s) => s.healthy) ? 'operational' : 'degraded',
          system_metrics: systemMetrics,
          services: serviceHealth,
        },
      });
    } catch (error) {
      logger.error('Error getting platform status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getAnalytics: async (req, res) => {
    try {
      const analytics = await platformTelemetryService.getPlatformAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error) {
      logger.error('Error getting platform analytics', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = platformTelemetryController;
