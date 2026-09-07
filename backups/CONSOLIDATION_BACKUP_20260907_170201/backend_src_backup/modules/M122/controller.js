/**
 * Controller for Cattle Registry (M122)
 * Handles HTTP requests for cattle registry operations
 */

const cattleService = require('./service');

const registerCattle = async (req, res) => {
  try {
    const cattle = await cattleService.registerCattle(req.body);
    res.status(201).json({ success: true, data: cattle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCattleHealth = async (req, res) => {
  try {
    const healthRecord = await cattleService.updateCattleHealth(req.params.id, req.body);
    res.status(200).json({ success: true, data: healthRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackCattlePerformance = async (req, res) => {
  try {
    const performance = await cattleService.trackCattlePerformance(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateRegistryReport = async (req, res) => {
  try {
    const report = await cattleService.generateRegistryReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getBreedingRecommendations = async (req, res) => {
  try {
    const recommendations = await cattleService.getBreedingRecommendations(req.params.id);
    res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerCattle,
  updateCattleHealth,
  trackCattlePerformance,
  generateRegistryReport,
  getBreedingRecommendations
};
