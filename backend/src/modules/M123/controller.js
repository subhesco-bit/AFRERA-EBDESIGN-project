/**
 * Controller for Poultry Management (M123)
 * Handles HTTP requests for poultry management operations
 */

const poultryService = require('./service');

const registerPoultryFlock = async (req, res) => {
  try {
    const flock = await poultryService.registerPoultryFlock(req.body);
    res.status(201).json({ success: true, data: flock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateFlockHealth = async (req, res) => {
  try {
    const healthRecord = await poultryService.updateFlockHealth(req.params.id, req.body);
    res.status(200).json({ success: true, data: healthRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackFlockPerformance = async (req, res) => {
  try {
    const performance = await poultryService.trackFlockPerformance(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generatePoultryReport = async (req, res) => {
  try {
    const report = await poultryService.generatePoultryReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerPoultryFlock,
  updateFlockHealth,
  trackFlockPerformance,
  generatePoultryReport
};
