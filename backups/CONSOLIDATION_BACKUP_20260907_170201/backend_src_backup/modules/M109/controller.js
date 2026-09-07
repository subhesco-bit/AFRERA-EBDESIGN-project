/**
 * Controller for Spare Parts Management (M109)
 * Handles HTTP requests for spare parts management operations
 */

const partsService = require('./service');

const listSpareParts = async (req, res) => {
  try {
    const result = await partsService.listSpareParts(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSparePart = async (req, res) => {
  try {
    const part = await partsService.getSparePart(req.params.id);
    if (!part) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, data: part });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const registerSparePart = async (req, res) => {
  try {
    const part = await partsService.registerSparePart(req.body);
    res.status(201).json({ success: true, data: part });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordPartConsumption = async (req, res) => {
  try {
    const consumption = await partsService.recordPartConsumption(req.body);
    res.status(201).json({ success: true, data: consumption });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackInventoryStatus = async (req, res) => {
  try {
    const status = await partsService.trackInventoryStatus(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateInventoryReport = async (req, res) => {
  try {
    const report = await partsService.generateInventoryReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  listSpareParts,
  getSparePart,
  registerSparePart,
  recordPartConsumption,
  trackInventoryStatus,
  generateInventoryReport
};
