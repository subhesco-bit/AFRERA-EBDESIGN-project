/**
 * Controller for Comparative Analytics (M085)
 * Handles HTTP requests for comparative analytics operations
 */

const comparisonService = require('./service');

const createComparisonGroup = async (req, res) => {
  try {
    const group = await comparisonService.createComparisonGroup(req.body);
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createComparisonConfig = async (req, res) => {
  try {
    const config = await comparisonService.createComparisonConfig(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const runComparison = async (req, res) => {
  try {
    const { config_id, comparison_date, period_start, period_end } = req.body;
    const result = await comparisonService.runComparison(config_id, comparison_date, period_start, period_end);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addBenchmark = async (req, res) => {
  try {
    const benchmark = await comparisonService.addBenchmark(req.body);
    res.status(201).json({ success: true, data: benchmark });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getBenchmarks = async (req, res) => {
  try {
    const benchmarks = await comparisonService.getBenchmarks(req.params.id);
    res.status(200).json({ success: true, data: benchmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createComparisonAlert = async (req, res) => {
  try {
    const alert = await comparisonService.createComparisonAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getComparisonAlerts = async (req, res) => {
  try {
    const alerts = await comparisonService.getComparisonAlerts(req.params.id, req.query);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSnapshot = async (req, res) => {
  try {
    const { config_id, snapshot_name, comparison_date, created_by } = req.body;
    const snapshot = await comparisonService.createSnapshot(config_id, snapshot_name, comparison_date, created_by);
    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createComparisonGroup,
  createComparisonConfig,
  runComparison,
  addBenchmark,
  getBenchmarks,
  createComparisonAlert,
  getComparisonAlerts,
  createSnapshot
};
