/**
 * Controller for Platform Core (M001)
 * Handles HTTP requests for platform core operations
 */

const platformCoreService = require('./service');

function sendError(res, error) {
  const status = error.statusCode || (error.code === 'VALIDATION_ERROR' ? 400 : 500);
  res.status(status).json({ success: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } });
}

const initializePlatform = async (req, res) => {
  try {
    const config = await platformCoreService.initializePlatform(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    sendError(res, error);
  }
};

const getPlatformHealth = async (req, res) => {
  try {
    const health = await platformCoreService.getPlatformHealth();
    res.status(200).json({ success: true, data: health });
  } catch (error) {
    sendError(res, error);
  }
};

const getPlatformMetrics = async (req, res) => {
  try {
    const metrics = await platformCoreService.getPlatformMetrics(req.query);
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    sendError(res, error);
  }
};

const updatePlatformConfiguration = async (req, res) => {
  try {
    let config = await platformCoreService.updatePlatformConfiguration(req.params.id, req.body);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  initializePlatform,
  getPlatformHealth,
  getPlatformMetrics,
  updatePlatformConfiguration
};
