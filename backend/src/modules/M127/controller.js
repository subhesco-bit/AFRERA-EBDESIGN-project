/**
 * Controller for Animal Health Management (M127)
 * Handles HTTP requests for animal health operations
 */

const animalHealthService = require('./service');

const createHealthRecord = async (req, res) => {
  try {
    const record = await animalHealthService.createHealthRecord(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const scheduleVaccination = async (req, res) => {
  try {
    const vaccination = await animalHealthService.scheduleVaccination(req.body);
    res.status(201).json({ success: true, data: vaccination });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const monitorHerdHealth = async (req, res) => {
  try {
    const monitoring = await animalHealthService.monitorHerdHealth(req.params.farmerId, req.query.animalType);
    res.status(200).json({ success: true, data: monitoring });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateHealthReport = async (req, res) => {
  try {
    const report = await animalHealthService.generateHealthReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createHealthRecord,
  scheduleVaccination,
  monitorHerdHealth,
  generateHealthReport
};
