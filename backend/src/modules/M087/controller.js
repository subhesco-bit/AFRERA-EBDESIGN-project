/**
 * Controller for Alert Management (M087)
 * Handles HTTP requests for alert management operations
 */

const alertService = require('./service');

const createAlertRule = async (req, res) => {
  try {
    const rule = await alertService.createAlertRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addNotification = async (req, res) => {
  try {
    const notification = await alertService.addNotification(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createIncident = async (req, res) => {
  try {
    const incident = await alertService.createIncident(req.body);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const acknowledgeIncident = async (req, res) => {
  try {
    const { acknowledged_by } = req.body;
    let incident = await alertService.acknowledgeIncident(req.params.id, acknowledged_by);
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const resolveIncident = async (req, res) => {
  try {
    const { resolved_by, resolution_details } = req.body;
    let incident = await alertService.resolveIncident(req.params.id, resolved_by, resolution_details);
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getIncidents = async (req, res) => {
  try {
    const incidents = await alertService.getIncidents(req.query);
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addEscalation = async (req, res) => {
  try {
    const escalation = await alertService.addEscalation(req.body);
    res.status(201).json({ success: true, data: escalation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSuppression = async (req, res) => {
  try {
    const suppression = await alertService.createSuppression(req.body);
    res.status(201).json({ success: true, data: suppression });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createMaintenanceWindow = async (req, res) => {
  try {
    const window = await alertService.createMaintenanceWindow(req.body);
    res.status(201).json({ success: true, data: window });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const calculateAlertStatistics = async (req, res) => {
  try {
    const { rule_id, period_type, period_start, period_end } = req.body;
    const stats = await alertService.calculateAlertStatistics(rule_id, period_type, period_start, period_end);
    res.status(201).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createAlertRule,
  addNotification,
  createIncident,
  acknowledgeIncident,
  resolveIncident,
  getIncidents,
  addEscalation,
  createSuppression,
  createMaintenanceWindow,
  calculateAlertStatistics
};
