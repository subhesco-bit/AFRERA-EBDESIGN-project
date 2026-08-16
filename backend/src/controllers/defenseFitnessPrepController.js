const defenseFitnessPrepService = require('../services/defenseFitnessPrepService');
const { logger } = require('../utils/logger');

const defenseFitnessPrepController = {
  getCategories: async (req, res) => {
    try {
      const categories = await defenseFitnessPrepService.getStandardCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      logger.error('Error getting defense fitness categories', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getStandards: async (req, res) => {
    try {
      const { category } = req.params;
      const gender = req.query.gender || 'any';
      const standards = await defenseFitnessPrepService.getStandardsForCategory(category, gender);
      res.json({ success: true, data: standards });
    } catch (error) {
      logger.error('Error getting defense fitness standards', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  recordAttempt: async (req, res) => {
    try {
      const { category, test_component, recorded_value, source } = req.body;
      const result = await defenseFitnessPrepService.recordAttempt(req.user.id, category, test_component, recorded_value, source);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error recording defense fitness attempt', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },

  getReadiness: async (req, res) => {
    try {
      const { category } = req.params;
      const gender = req.query.gender || 'any';
      const comparison = await defenseFitnessPrepService.getReadinessComparison(req.user.id, category, gender);
      res.json({ success: true, data: comparison });
    } catch (error) {
      logger.error('Error getting defense fitness readiness', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = defenseFitnessPrepController;
