/**
 * Controller for Breakdown Maintenance (M107)
 * Handles HTTP requests for breakdown maintenance operations
 */

const breakdownService = require('./service');

const reportBreakdown = async (req, res) => {
  try {
    const breakdown = await breakdownService.reportBreakdown(req.body);
    res.status(201).json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const scheduleEmergencyRepair = async (req, res) => {
  try {
    const repair = await breakdownService.scheduleEmergencyRepair(req.params.id, req.body);
    res.status(201).json({ success: true, data: repair });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackDowntime = async (req, res) => {
  try {
    const downtime = await breakdownService.trackDowntime(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: downtime });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateBreakdownReport = async (req, res) => {
  try {
    const report = await breakdownService.generateBreakdownReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  reportBreakdown,
  scheduleEmergencyRepair,
  trackDowntime,
  generateBreakdownReport
};
