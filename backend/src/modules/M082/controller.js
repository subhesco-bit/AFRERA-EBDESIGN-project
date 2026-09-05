/**
 * Controller for Business Metrics & KPIs Tracking (M082)
 * Handles HTTP requests for KPI operations
 */

const kpiService = require('./service');

const createKPIDefinition = async (req, res) => {
  try {
    const kpi = await kpiService.createKPIDefinition(req.body);
    res.status(201).json({ success: true, data: kpi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getKPIDefinition = async (req, res) => {
  try {
    let kpi = await kpiService.getKPIDefinition(req.params.id);
    if (!kpi) {
      return res.status(404).json({ success: false, error: 'KPI definition not found' });
    }
    res.status(200).json({ success: true, data: kpi });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listKPIDefinitions = async (req, res) => {
  try {
    const kpis = await kpiService.listKPIDefinitions(req.query);
    res.status(200).json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordKPIMeasurement = async (req, res) => {
  try {
    const measurement = await kpiService.recordKPIMeasurement(req.body);
    res.status(201).json({ success: true, data: measurement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getKPIMeasurements = async (req, res) => {
  try {
    const measurements = await kpiService.getKPIMeasurements(req.params.id, req.query);
    res.status(200).json({ success: true, data: measurements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const setKPITarget = async (req, res) => {
  try {
    const target = await kpiService.setKPITarget(req.body);
    res.status(201).json({ success: true, data: target });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getKPITargets = async (req, res) => {
  try {
    const targets = await kpiService.getKPITargets(req.params.id, req.query);
    res.status(200).json({ success: true, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const calculateKPIScore = async (req, res) => {
  try {
    const { entity_id, entity_type, period_type, period_start, period_end } = req.body;
    const score = await kpiService.calculateKPIScore(entity_id, entity_type, period_type, period_start, period_end);
    res.status(200).json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createKPIAlert = async (req, res) => {
  try {
    const alert = await kpiService.createKPIAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getKPIAlerts = async (req, res) => {
  try {
    const alerts = await kpiService.getKPIAlerts(req.params.id);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addBenchmark = async (req, res) => {
  try {
    const benchmark = await kpiService.addBenchmark(req.body);
    res.status(201).json({ success: true, data: benchmark });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getBenchmarks = async (req, res) => {
  try {
    const benchmarks = await kpiService.getBenchmarks(req.params.id);
    res.status(200).json({ success: true, data: benchmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addDimension = async (req, res) => {
  try {
    const dimension = await kpiService.addDimension(req.body);
    res.status(201).json({ success: true, data: dimension });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDimensions = async (req, res) => {
  try {
    const dimensions = await kpiService.getDimensions(req.params.id);
    res.status(200).json({ success: true, data: dimensions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createKPIDefinition,
  getKPIDefinition,
  listKPIDefinitions,
  recordKPIMeasurement,
  getKPIMeasurements,
  setKPITarget,
  getKPITargets,
  calculateKPIScore,
  createKPIAlert,
  getKPIAlerts,
  addBenchmark,
  getBenchmarks,
  addDimension,
  getDimensions
};
