/**
 * Controller for Equipment Inventory (M042)
 */

const equipmentInventoryService = require('./service');

const createEquipment = async (req, res) => {
  try {
    const equipment = await equipmentInventoryService.createEquipment(req.body);
    res.status(201).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const recordEquipmentUsage = async (req, res) => {
  try {
    const usage = await equipmentInventoryService.recordEquipmentUsage(req.params.equipmentId, req.body);
    res.status(201).json({ success: true, data: usage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getEquipmentByOwner = async (req, res) => {
  try {
    const equipment = await equipmentInventoryService.getEquipmentByOwner(req.params.ownerId);
    res.status(200).json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMaintenancePredictions = async (req, res) => {
  try {
    const predictions = await equipmentInventoryService.getMaintenancePredictions(req.query.category);
    res.status(200).json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createEquipment,
  recordEquipmentUsage,
  getEquipmentByOwner,
  getMaintenancePredictions
};
