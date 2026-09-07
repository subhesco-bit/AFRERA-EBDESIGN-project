/**
 * Controller for Implement Management (M102)
 * Handles HTTP requests for implement management operations
 */

const implementService = require('./service');

const listImplements = async (req, res) => {
  try {
    const result = await implementService.listImplements(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getImplement = async (req, res) => {
  try {
    const implement = await implementService.getImplement(req.params.id);
    if (!implement) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, data: implement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const registerImplement = async (req, res) => {
  try {
    const implement = await implementService.registerImplement(req.body);
    res.status(201).json({ success: true, data: implement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateImplementMaintenance = async (req, res) => {
  try {
    const maintenance = await implementService.updateImplementMaintenance(req.params.id, req.body);
    res.status(200).json({ success: true, data: maintenance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackImplementUsage = async (req, res) => {
  try {
    const usage = await implementService.trackImplementUsage(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: usage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateImplementReport = async (req, res) => {
  try {
    const report = await implementService.generateImplementReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  listImplements,
  getImplement,
  registerImplement,
  updateImplementMaintenance,
  trackImplementUsage,
  generateImplementReport
};
