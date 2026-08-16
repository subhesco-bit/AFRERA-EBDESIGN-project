/**
 * Controller for Water Analytics (M080)
 * Handles HTTP requests for water analytics operations
 */

const waterAnalyticsService = require('./service');

const generateWaterUsageAnalytics = async (req, res) => {
  try {
    const analytics = await waterAnalyticsService.generateWaterUsageAnalytics(req.body);
    res.status(201).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createWaterDashboard = async (req, res) => {
  try {
    const dashboard = await waterAnalyticsService.createWaterDashboard(req.body);
    res.status(201).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generatePredictiveAnalysis = async (req, res) => {
  try {
    const prediction = await waterAnalyticsService.generatePredictiveAnalysis(req.body);
    res.status(201).json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const compareWaterPerformance = async (req, res) => {
  try {
    const comparison = await waterAnalyticsService.compareWaterPerformance(req.body);
    res.status(201).json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  generateWaterUsageAnalytics,
  createWaterDashboard,
  generatePredictiveAnalysis,
  compareWaterPerformance
};
