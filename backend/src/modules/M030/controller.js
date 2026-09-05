// Controller for Farmer Advisory (M030) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Advisory generation
async function generateAdvisory(req, res) {
  try {
    const { farmerId, advisoryType } = req.body;
    const result = await service.generateAdvisory(farmerId, advisoryType);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('generateAdvisory error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Advisory management
async function getFarmerAdvisories(req, res) {
  try {
    const { farmerId, advisoryType, limit } = req.query;
    const advisories = await service.getFarmerAdvisories(farmerId, { advisoryType, limit });
    res.json({ success: true, data: advisories });
  } catch (error) {
    logger.error('getFarmerAdvisories error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getAdvisory(req, res) {
  try {
    const advisory = await service.getAdvisory(req.params.advisoryId);
    if (!advisory) return res.status(404).json({ success: false, error: 'Advisory not found' });
    res.json({ success: true, data: advisory });
  } catch (error) {
    logger.error('getAdvisory error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// IoT integration
async function registerIoTDevice(req, res) {
  try {
    const device = await service.registerIoTDevice(req.body.farmerId, req.body);
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    logger.error('registerIoTDevice error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getIoTDeviceData(req, res) {
  try {
    const { farmerId, deviceId, timeframe } = req.query;
    const data = await service.getIoTDeviceData(farmerId, deviceId, { timeframe });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('getIoTDeviceData error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Alerts
async function createAlert(req, res) {
  try {
    const alert = await service.createAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    logger.error('createAlert error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getFarmerAlerts(req, res) {
  try {
    const { farmerId, unreadOnly, limit } = req.query;
    const alerts = await service.getFarmerAlerts(farmerId, { unreadOnly, limit });
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('getFarmerAlerts error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function markAlertAsRead(req, res) {
  try {
    let result = await service.markAlertAsRead(req.params.alertId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('markAlertAsRead error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getAdvisoryAnalytics(req, res) {
  try {
    const { startDate, endDate, advisoryType } = req.query;
    const analytics = await service.getAdvisoryAnalytics({ startDate, endDate, advisoryType });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getAdvisoryAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  generateAdvisory,
  getFarmerAdvisories,
  getAdvisory,
  registerIoTDevice,
  getIoTDeviceData,
  createAlert,
  getFarmerAlerts,
  markAlertAsRead,
  getAdvisoryAnalytics,
};