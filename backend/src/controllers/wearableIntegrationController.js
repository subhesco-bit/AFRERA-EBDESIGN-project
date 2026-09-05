const wearableIntegrationService = require('../services/legacy/wearableIntegrationService');
const { logger } = require('../utils/logger');

const wearableIntegrationController = {
  getStatus: async (req, res) => {
    try {
      const status = await wearableIntegrationService.getConnectionStatus(req.user.id);
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Error getting wearable connection status', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getFitbitAuthUrl: async (req, res) => {
    try {
      const url = wearableIntegrationService.getFitbitAuthUrl(req.user.id);
      res.json({ success: true, data: { authUrl: url } });
    } catch (error) {
      let status = error.code === 'not_configured' ? 200 : 500;
      res.status(status).json({ success: false, code: error.code, error: error.message });
    }
  },

  fitbitCallback: async (req, res) => {
    try {
      const { code } = req.body;
      const result = await wearableIntegrationService.handleFitbitCallback(req.user.id, code);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error handling Fitbit callback', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  syncFitbit: async (req, res) => {
    try {
      let result = await wearableIntegrationService.syncFitbitActivity(req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      let status = error.code === 'not_connected' ? 400 : 500;
      res.status(status).json({ success: false, code: error.code, error: error.message });
    }
  },

  ingestDeviceActivity: async (req, res) => {
    try {
      const { provider, activity_date, activity } = req.body;
      let result = await wearableIntegrationService.ingestDeviceActivity(req.user.id, provider, activity_date, activity);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error ingesting device wearable activity', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  getRecentActivity: async (req, res) => {
    try {
      const days = parseInt(req.query.days, 10) || 7;
      const summary = await wearableIntegrationService.getRecentActivitySummary(req.user.id, days);
      res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error getting recent wearable activity', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  disconnect: async (req, res) => {
    try {
      const { provider } = req.params;
      let result = await wearableIntegrationService.disconnectProvider(req.user.id, provider);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error disconnecting wearable provider', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = wearableIntegrationController;
