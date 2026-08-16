/**
 * Controller for Environment Management (M005)
 * Handles HTTP requests for environment management operations
 */

const envService = require('./service');

const createEnvironment = async (req, res) => {
  try {
    const env = await envService.createEnvironment(req.body);
    res.status(201).json({ success: true, data: env });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getEnvironment = async (req, res) => {
  try {
    const env = await envService.getEnvironment(req.params.id);
    res.status(200).json({ success: true, data: env });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateEnvironment = async (req, res) => {
  try {
    const env = await envService.updateEnvironment(req.params.id, req.body);
    res.status(200).json({ success: true, data: env });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listEnvironments = async (req, res) => {
  try {
    const envs = await envService.listEnvironments(req.query);
    res.status(200).json({ success: true, data: envs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createEnvironment,
  getEnvironment,
  updateEnvironment,
  listEnvironments
};
