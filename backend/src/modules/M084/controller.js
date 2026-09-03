/**
 * Controller for Trend Analysis (M084)
 * Handles HTTP requests for trend analysis operations
 */

const trendService = require('./service');

function sendError(res, error) {
  const status = error.statusCode || (error.code === 'VALIDATION_ERROR' ? 400 : 500);
  res.status(status).json({ success: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } });
}

const createTrendDefinition = async (req, res) => {
  try {
    const trend = await trendService.createTrendDefinition(req.body);
    res.status(201).json({ success: true, data: trend });
  } catch (error) {
    sendError(res, error);
  }
};

const addDataPoint = async (req, res) => {
  try {
    const dataPoint = await trendService.addDataPoint(req.params.id, req.body);
    res.status(201).json({ success: true, data: dataPoint });
  } catch (error) {
    sendError(res, error);
  }
};

const getTrendDataPoints = async (req, res) => {
  try {
    const dataPoints = await trendService.getTrendDataPoints(req.params.id, req.query);
    res.status(200).json({ success: true, data: dataPoints });
  } catch (error) {
    sendError(res, error);
  }
};

const analyzeTrend = async (req, res) => {
  try {
    const { trend_id, analysis_type, period_start, period_end } = req.body;
    const analysis = await trendService.analyzeTrend(trend_id, analysis_type, period_start, period_end);
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    sendError(res, error);
  }
};

const generateTrendForecast = async (req, res) => {
  try {
    const { trend_id, forecast_type, forecast_horizon } = req.body;
    const forecast = await trendService.generateTrendForecast(trend_id, forecast_type, forecast_horizon);
    res.status(201).json({ success: true, data: forecast });
  } catch (error) {
    sendError(res, error);
  }
};

const detectSeasonality = async (req, res) => {
  try {
    const seasonality = await trendService.detectSeasonality(req.params.id);
    res.status(201).json({ success: true, data: seasonality });
  } catch (error) {
    sendError(res, error);
  }
};

const calculateCorrelation = async (req, res) => {
  try {
    const { trend_id, correlated_metric } = req.body;
    const correlation = await trendService.calculateCorrelation(trend_id, correlated_metric);
    res.status(201).json({ success: true, data: correlation });
  } catch (error) {
    sendError(res, error);
  }
};

const detectBreakpoints = async (req, res) => {
  try {
    const breakpoints = await trendService.detectBreakpoints(req.params.id);
    res.status(201).json({ success: true, data: breakpoints });
  } catch (error) {
    sendError(res, error);
  }
};

const createTrendAlert = async (req, res) => {
  try {
    const alert = await trendService.createTrendAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    sendError(res, error);
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
  getTrendAlerts,
  createDisasterAlert: async (req, res) => {
    try { res.status(201).json({ success: true, data: await trendService.createDisasterAlert(req.body) }); }
    catch (error) { sendError(res, error); }
  },
  listDisasterAlerts: async (req, res) => {
    try { res.json({ success: true, data: await trendService.listDisasterAlerts(req.query) }); }
    catch (error) { sendError(res, error); }
  },
  getDisasterAlert: async (req, res) => {
    try { const alert = await trendService.getDisasterAlert(req.params.id); if (!alert) return res.status(404).json({ success: false, error: 'Disaster alert not found' }); res.json({ success: true, data: alert }); }
    catch (error) { sendError(res, error); }
  },
  cancelDisasterAlert: async (req, res) => {
    try { const alert = await trendService.cancelDisasterAlert(req.params.id, req.body); if (!alert) return res.status(404).json({ success: false, error: 'Disaster alert not found or already cancelled' }); res.json({ success: true, data: alert }); }
    catch (error) { sendError(res, error); }
  },
  getDisasterAlertAdvisory: async (req, res) => {
    try { const advisory = await trendService.getDisasterAlertAdvisory(req.params.id); if (!advisory) return res.status(404).json({ success: false, error: 'Disaster alert not found' }); res.json({ success: true, data: advisory }); }
    catch (error) { sendError(res, error); }
  }
};
