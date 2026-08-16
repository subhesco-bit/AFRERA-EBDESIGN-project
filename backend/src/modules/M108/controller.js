/**
 * Controller for Fuel Management (M108)
 * Handles HTTP requests for fuel management operations
 */

const fuelService = require('./service');

const recordFuelPurchase = async (req, res) => {
  try {
    const purchase = await fuelService.recordFuelPurchase(req.body);
    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordFuelConsumption = async (req, res) => {
  try {
    const consumption = await fuelService.recordFuelConsumption(req.body);
    res.status(201).json({ success: true, data: consumption });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackFuelEfficiency = async (req, res) => {
  try {
    const efficiency = await fuelService.trackFuelEfficiency(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: efficiency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateFuelReport = async (req, res) => {
  try {
    const report = await fuelService.generateFuelReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  recordFuelPurchase,
  recordFuelConsumption,
  trackFuelEfficiency,
  generateFuelReport
};
