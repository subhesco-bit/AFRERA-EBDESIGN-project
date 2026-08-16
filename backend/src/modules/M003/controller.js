/**
 * Controller for Tenant Management (M003)
 * Handles HTTP requests for tenant management operations
 */

const tenantService = require('./service');

const createTenant = async (req, res) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTenant = async (req, res) => {
  try {
    const tenant = await tenantService.getTenant(req.params.id);
    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTenant = async (req, res) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTenantUsageMetrics = async (req, res) => {
  try {
    const metrics = await tenantService.getTenantUsageMetrics(req.params.id);
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listTenants = async (req, res) => {
  try {
    const tenants = await tenantService.listTenants(req.query);
    res.status(200).json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createTenant,
  getTenant,
  updateTenant,
  getTenantUsageMetrics,
  listTenants
};
