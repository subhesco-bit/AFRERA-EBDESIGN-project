/**
 * Controller for Village Registry (M041)
 */

const villageRegistryService = require('./service');

const createVillage = async (req, res) => {
  try {
    const village = await villageRegistryService.createVillage(req.body);
    res.status(201).json({ success: true, data: village });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addVillageResource = async (req, res) => {
  try {
    const resource = await villageRegistryService.addVillageResource(req.params.villageId, req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVillageAnalytics = async (req, res) => {
  try {
    const analytics = await villageRegistryService.getVillageAnalytics(req.params.villageId);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createVillage,
  addVillageResource,
  getVillageAnalytics
};
