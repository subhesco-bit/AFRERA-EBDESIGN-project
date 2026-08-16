/**
 * Controller for Platform Core (M001)
 * Handles HTTP requests for platform core operations
 */

const platformCoreService = require('./service');

const initializePlatform = async (req, res) => {
  try {
    const config = await platformCoreService.initializePlatform(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPlatformHealth = async (req, res) => {
  try {
    const health = await platformCoreService.getPlatformHealth();
    res.status(200).json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPlatformMetrics = async (req, res) => {
  try {
    const metrics = await platformCoreService.getPlatformMetrics(req.query);
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePlatformConfiguration = async (req, res) => {
  try {
    const config = await platformCoreService.updatePlatformConfiguration(req.params.id, req.body);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  initializePlatform,
  getPlatformHealth,
  getPlatformMetrics,
  updatePlatformConfiguration
};
