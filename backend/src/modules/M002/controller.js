/**
 * Controller for Platform Configuration (M002)
 * Handles HTTP requests for platform configuration operations
 */

const platformConfigService = require('./service');

const createConfiguration = async (req, res) => {
  try {
    const config = await platformConfigService.createConfiguration(req.body);
    res.status(201).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getConfiguration = async (req, res) => {
  try {
    let config = await platformConfigService.getConfiguration(req.params.key, req.query.environment);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateConfiguration = async (req, res) => {
  try {
    let config = await platformConfigService.updateConfiguration(req.params.id, req.body);
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const bulkUpdateConfigurations = async (req, res) => {
  try {
    const result = await platformConfigService.bulkUpdateConfigurations(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getConfigurationHistory = async (req, res) => {
  try {
    const history = await platformConfigService.getConfigurationHistory(req.params.id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createConfiguration,
  getConfiguration,
  updateConfiguration,
  bulkUpdateConfigurations,
  getConfigurationHistory
};
