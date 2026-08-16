const cropValueResearchService = require('../services/cropValueResearchService');
const { logger } = require('../utils/logger');

const cropValueResearchController = {
  getProviderStatus: async (req, res) => {
    try {
      res.json({ success: true, data: cropValueResearchService.listSearchProviders() });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  research: async (req, res) => {
    try {
      const { variety_name, compound_key } = req.body;
      const result = await cropValueResearchService.researchValueCompound(variety_name, compound_key);
      res.json({ success: true, data: result });
    } catch (error) {
      const status = error.code === 'not_configured' ? 200 : 500;
      res.status(status).json({ success: false, code: error.code, error: error.message });
    }
  },

  getPending: async (req, res) => {
    try {
      const pending = await cropValueResearchService.getPendingSuggestions();
      res.json({ success: true, data: pending });
    } catch (error) {
      logger.error('Error getting pending crop value suggestions', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  review: async (req, res) => {
    try {
      const { id } = req.params;
      const { approve } = req.body;
      const result = await cropValueResearchService.reviewSuggestion(id, Boolean(approve), req.user.id);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error reviewing crop value suggestion', { error: error.message });
      res.status(400).json({ success: false, error: error.message });
    }
  },
};

module.exports = cropValueResearchController;
