/**
 * Controller for Watershed Management (M079)
 * Handles HTTP requests for watershed management operations
 */

const watershedService = require('./service');

const createWatershedPlan = async (req, res) => {
  try {
    const plan = await watershedService.createWatershedPlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const monitorWatershedHealth = async (req, res) => {
  try {
    const health = await watershedService.monitorWatershedHealth(req.params.id);
    res.status(200).json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const implementConservationMeasures = async (req, res) => {
  try {
    const implementation = await watershedService.implementConservationMeasures(req.params.id, req.body);
    res.status(201).json({ success: true, data: implementation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateWatershedReport = async (req, res) => {
  try {
    const report = await watershedService.generateWatershedReport(req.params.id, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createWatershedPlan,
  monitorWatershedHealth,
  implementConservationMeasures,
  generateWatershedReport
};
