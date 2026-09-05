/**
 * Controller for Organization Management (M004)
 * Handles HTTP requests for organization management operations
 */

const orgService = require('./service');

const createOrganization = async (req, res) => {
  try {
    const org = await orgService.createOrganization(req.body);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getOrganization = async (req, res) => {
  try {
    let org = await orgService.getOrganization(req.params.id);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateOrganization = async (req, res) => {
  try {
    let org = await orgService.updateOrganization(req.params.id, req.body);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listOrganizations = async (req, res) => {
  try {
    const orgs = await orgService.listOrganizations(req.query);
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createOrganization,
  getOrganization,
  updateOrganization,
  listOrganizations
};
