/**
 * Controller for Equipment Inventory (M103)
 * Handles HTTP requests for equipment inventory operations
 */

const equipmentService = require('./service');

const registerEquipment = async (req, res) => {
  try {
    const equipment = await equipmentService.registerEquipment(req.body);
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
  registerEquipment,
  updateEquipmentStatus,
  trackEquipmentUtilization,
  generateInventoryReport
};
