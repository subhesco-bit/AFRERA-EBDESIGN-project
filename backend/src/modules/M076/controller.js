/**
 * Controller for Water Budgeting (M076)
 * Handles HTTP requests for water budgeting operations
 */

const waterBudgetService = require('./service');

const createWaterBudget = async (req, res) => {
  try {
    const budget = await waterBudgetService.createWaterBudget(req.body);
    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackWaterUsage = async (req, res) => {
  try {
    const usage = await waterBudgetService.trackWaterUsage(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: usage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const optimizeWaterAllocation = async (req, res) => {
  try {
    const optimization = await waterBudgetService.optimizeWaterAllocation(req.params.id, req.body);
    res.status(200).json({ success: true, data: optimization });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateBudgetReport = async (req, res) => {
  try {
    const report = await waterBudgetService.generateBudgetReport(req.params.id, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createWaterBudget,
  trackWaterUsage,
  optimizeWaterAllocation,
  generateBudgetReport
};
