/**
 * Controller for Fleet Management (M105)
 * Handles HTTP requests for fleet management operations
 */

const fleetService = require('./service');

const registerFleetVehicle = async (req, res) => {
  try {
    const vehicle = await fleetService.registerFleetVehicle(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createDispatchSchedule = async (req, res) => {
  try {
    const dispatch = await fleetService.createDispatchSchedule(req.body);
    res.status(201).json({ success: true, data: dispatch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackFleetPerformance = async (req, res) => {
  try {
    const performance = await fleetService.trackFleetPerformance(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateFleetReport = async (req, res) => {
  try {
    const report = await fleetService.generateFleetReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerFleetVehicle,
  createDispatchSchedule,
  trackFleetPerformance,
  generateFleetReport
};
