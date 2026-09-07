/**
 * Controller for Tractor Management (M101)
 * Handles HTTP requests for tractor management operations
 */

const tractorService = require('./service');

const registerTractor = async (req, res) => {
  try {
    const tractor = await tractorService.registerTractor(req.body);
    res.status(201).json({ success: true, data: tractor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTractorMaintenance = async (req, res) => {
  try {
    const maintenance = await tractorService.updateTractorMaintenance(req.params.id, req.body);
    res.status(200).json({ success: true, data: maintenance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackTractorPerformance = async (req, res) => {
  try {
    const performance = await tractorService.trackTractorPerformance(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateTractorReport = async (req, res) => {
  try {
    const report = await tractorService.generateTractorReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerTractor,
  updateTractorMaintenance,
  trackTractorPerformance,
  generateTractorReport
};
