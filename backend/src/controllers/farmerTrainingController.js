/**
 * Farmer Training Controller
 * Handles HTTP requests and responses for farmer training operations
 */

const farmerTrainingService = require('../services/legacy/farmerTrainingService');
const { logger } = require('../utils/logger');

const farmerTrainingController = {
  createTrainingProgram: async (req, res) => {
    try {
      const result = await farmerTrainingService.createTrainingProgram(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error creating training program', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  registerForTraining: async (req, res) => {
    try {
      let result = await farmerTrainingService.registerForTraining(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      logger.error('Error registering for training', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  trackTrainingProgress: async (req, res) => {
    try {
      let result = await farmerTrainingService.trackTrainingProgress(req.params.registrationId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error tracking training progress', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  assessFOLUCompliance: async (req, res) => {
    try {
      let result = await farmerTrainingService.assessFOLUCompliance(req.body.farmer_id, req.body.assessment_period);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error assessing FOLU compliance', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  trackCarbonFootprint: async (req, res) => {
    try {
      let result = await farmerTrainingService.trackCarbonFootprint(req.params.farmerId, req.query.period);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error tracking carbon footprint', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getNortheastOrganicTracking: async (req, res) => {
    try {
      let result = await farmerTrainingService.getNortheastOrganicTracking(req.query.location, req.query.category);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting Northeast organic tracking', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  issueTrainingCertificate: async (req, res) => {
    try {
      let result = await farmerTrainingService.issueTrainingCertificate(req.params.registrationId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error issuing training certificate', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  getTrainingRecommendations: async (req, res) => {
    try {
      let result = await farmerTrainingService.getTrainingRecommendations(req.params.farmerId);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error getting training recommendations', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  generateComplianceReport: async (req, res) => {
    try {
      let result = await farmerTrainingService.generateComplianceReport(req.body.farmer_id, req.body.report_type, req.body.period);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Error generating compliance report', { error: error.message });
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = farmerTrainingController;
