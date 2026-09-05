/**
 * Controller for Equipment Inventory (M103)
 * Handles HTTP requests for equipment inventory operations
 */

const equipmentService = require('./service');

const listEquipment = async (req, res) => {
  try {
    const result = await equipmentService.listEquipment(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getEquipment = async (req, res) => {
  try {
    const equipment = await equipmentService.getEquipment(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, error: 'Not found' });
    res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const registerEquipment = async (req, res) => {
  try {
    let equipment = await equipmentService.registerEquipment(req.body);
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateEquipmentStatus = async (req, res) => {
  try {
    const status = await equipmentService.updateEquipmentStatus(req.params.id, req.body);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackEquipmentUtilization = async (req, res) => {
  try {
    const utilization = await equipmentService.trackEquipmentUtilization(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: utilization });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const generateInventoryReport = async (req, res) => {
  try {
    const report = await equipmentService.generateInventoryReport(req.params.farmerId, req.query.reportType);
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  listEquipment,
  getEquipment,
  registerEquipment,
  updateEquipmentStatus,
  trackEquipmentUtilization,
  generateInventoryReport
};
