/**
 * Controller for Performance Analytics (M083)
 * Handles HTTP requests for performance analytics operations
 */

const performanceService = require('./service');

const recordPerformanceMetric = async (req, res) => {
  try {
    const metric = await performanceService.recordPerformanceMetric(req.body);
    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPerformanceMetrics = async (req, res) => {
  try {
    const metrics = await performanceService.getPerformanceMetrics(req.params.entityId, req.params.entityType, req.query);
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generatePerformanceReport = async (req, res) => {
  try {
    const { entity_id, entity_type, report_type, period_type, period_start, period_end } = req.body;
    const report = await performanceService.generatePerformanceReport(entity_id, entity_type, report_type, period_type, period_start, period_end);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const analyzePerformanceTrends = async (req, res) => {
  try {
    const { entity_id, entity_type, metric_name, period_start, period_end } = req.body;
    const trend = await performanceService.analyzePerformanceTrends(entity_id, entity_type, metric_name, period_start, period_end);
    res.status(201).json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const comparePerformance = async (req, res) => {
  try {
    const comparison = await performanceService.comparePerformance(req.body);
    res.status(201).json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const setPerformanceTarget = async (req, res) => {
  try {
    const target = await performanceService.setPerformanceTarget(req.body);
    res.status(201).json({ success: true, data: target });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPerformanceTargets = async (req, res) => {
  try {
    const targets = await performanceService.getPerformanceTargets(req.params.entityId, req.params.entityType);
    res.status(200).json({ success: true, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createPerformanceAlert = async (req, res) => {
  try {
    const alert = await performanceService.createPerformanceAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPerformanceAlerts = async (req, res) => {
  try {
    const alerts = await performanceService.getPerformanceAlerts(req.params.entityId, req.params.entityType, req.query);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  recordPerformanceMetric,
  getPerformanceMetrics,
  generatePerformanceReport,
  analyzePerformanceTrends,
  comparePerformance,
  setPerformanceTarget,
  getPerformanceTargets,
  createPerformanceAlert,
  getPerformanceAlerts
};
