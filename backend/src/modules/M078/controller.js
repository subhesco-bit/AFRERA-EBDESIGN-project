/**
 * Controller for Rainwater Harvesting (M078)
 * Handles HTTP requests for rainwater harvesting operations
 */

const harvestingService = require('./service');

const designHarvestingSystem = async (req, res) => {
  try {
    const system = await harvestingService.designHarvestingSystem(req.body);
    res.status(201).json({ success: true, data: system });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const monitorCollection = async (req, res) => {
  try {
    const monitoring = await harvestingService.monitorCollection(req.params.id, req.query.period);
    res.status(200).json({ success: true, data: monitoring });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const calculateWaterBudget = async (req, res) => {
  try {
    const budget = await harvestingService.calculateWaterBudget(req.params.id, req.query.timeFrame);
    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const manageStorageCapacity = async (req, res) => {
  try {
    const management = await harvestingService.manageStorageCapacity(req.params.id, req.body);
    res.status(200).json({ success: true, data: management });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  designHarvestingSystem,
  monitorCollection,
  calculateWaterBudget,
  manageStorageCapacity
};
