/**
 * Controller for Real-time Monitoring (M086)
 * Handles HTTP requests for real-time monitoring operations
 */

const monitoringService = require('./service');

const createMonitoringSource = async (req, res) => {
  try {
    const source = await monitoringService.createMonitoringSource(req.body);
    res.status(201).json({ success: true, data: source });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addMonitoringMetric = async (req, res) => {
  try {
    const metric = await monitoringService.addMonitoringMetric(req.body);
    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const ingestRealTimeData = async (req, res) => {
  try {
    const { metric_id, value, timestamp, metadata } = req.body;
    const data = await monitoringService.ingestRealTimeData(metric_id, value, timestamp, metadata);
    res.status(201).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRealTimeData = async (req, res) => {
  try {
    let data = await monitoringService.getRealTimeData(req.params.id, req.query);
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createMonitoringDashboard = async (req, res) => {
  try {
    const dashboard = await monitoringService.createMonitoringDashboard(req.body);
    res.status(201).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addDashboardWidget = async (req, res) => {
  try {
    const widget = await monitoringService.addDashboardWidget(req.body);
    res.status(201).json({ success: true, data: widget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createMonitoringAlert = async (req, res) => {
  try {
    const alert = await monitoringService.createMonitoringAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMonitoringAlerts = async (req, res) => {
  try {
    const alerts = await monitoringService.getMonitoringAlerts(req.params.id);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const logMonitoringEvent = async (req, res) => {
  try {
    const event = await monitoringService.logMonitoringEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAlertHistory = async (req, res) => {
  try {
    const history = await monitoringService.getAlertHistory(req.params.id, req.query);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createMonitoringSource,
  addMonitoringMetric,
  ingestRealTimeData,
  getRealTimeData,
  createMonitoringDashboard,
  addDashboardWidget,
  createMonitoringAlert,
  getMonitoringAlerts,
  logMonitoringEvent,
  getAlertHistory
};
