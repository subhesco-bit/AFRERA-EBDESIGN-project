/**
 * Controller for Trend Analysis (M084)
 * Handles HTTP requests for trend analysis operations
 */

const trendService = require('./service');

const createTrendDefinition = async (req, res) => {
  try {
    const trend = await trendService.createTrendDefinition(req.body);
    res.status(201).json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addDataPoint = async (req, res) => {
  try {
    const dataPoint = await trendService.addDataPoint(req.params.id, req.body);
    res.status(201).json({ success: true, data: dataPoint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTrendDataPoints = async (req, res) => {
  try {
    const dataPoints = await trendService.getTrendDataPoints(req.params.id, req.query);
    res.status(200).json({ success: true, data: dataPoints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const analyzeTrend = async (req, res) => {
  try {
    const { trend_id, analysis_type, period_start, period_end } = req.body;
    const analysis = await trendService.analyzeTrend(trend_id, analysis_type, period_start, period_end);
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateTrendForecast = async (req, res) => {
  try {
    const { trend_id, forecast_type, forecast_horizon } = req.body;
    const forecast = await trendService.generateTrendForecast(trend_id, forecast_type, forecast_horizon);
    res.status(201).json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const detectSeasonality = async (req, res) => {
  try {
    const seasonality = await trendService.detectSeasonality(req.params.id);
    res.status(201).json({ success: true, data: seasonality });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const calculateCorrelation = async (req, res) => {
  try {
    const { trend_id, correlated_metric } = req.body;
    const correlation = await trendService.calculateCorrelation(trend_id, correlated_metric);
    res.status(201).json({ success: true, data: correlation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const detectBreakpoints = async (req, res) => {
  try {
    const breakpoints = await trendService.detectBreakpoints(req.params.id);
    res.status(201).json({ success: true, data: breakpoints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createTrendAlert = async (req, res) => {
  try {
    const alert = await trendService.createTrendAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTrendAlerts = async (req, res) => {
  try {
    const alerts = await trendService.getTrendAlerts(req.params.id, req.query);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createTrendDefinition,
  addDataPoint,
  getTrendDataPoints,
  analyzeTrend,
  generateTrendForecast,
  detectSeasonality,
  calculateCorrelation,
  detectBreakpoints,
  createTrendAlert,
  getTrendAlerts
};
