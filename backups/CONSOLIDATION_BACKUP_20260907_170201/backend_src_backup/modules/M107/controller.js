/**
 * Controller for Breakdown Maintenance (M107)
 * Handles HTTP requests for breakdown maintenance operations
 */

const breakdownService = require('./service');

const listBreakdowns = async (req, res) => {
  try {
    const result = await breakdownService.listBreakdowns(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getBreakdown = async (req, res) => {
  try {
    const breakdown = await breakdownService.getBreakdown(req.params.id);
    if (!breakdown) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
  listBreakdowns,
  getBreakdown,
  reportBreakdown,
  scheduleEmergencyRepair,
  trackDowntime,
  generateBreakdownReport
};
