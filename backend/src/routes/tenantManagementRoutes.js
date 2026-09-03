/**
 * Tenant Management Module Routes - AI Enhanced
 * 
 * Routes for tenant management with AI-powered capabilities:
 * - Tenant CRUD operations
 * - Resource allocation optimization
 * - Usage pattern prediction
 * - Tier recommendations
 * - Cost optimization
 * - Health scoring
 */

const express = require('express');
const router = express.Router();
const tenantManagementService = require('../services/legacy/tenantManagementService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/inputValidation');

const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

const requestId = (req) => req.get('x-correlation-id') || `tenant-${Date.now()}`;
const fail = (req, res, error, operation) => {
  const id = requestId(req);
  logger.error(`tenantManagementRoutes:${operation}`, { error: error.message, requestId: id });
  return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR', requestId: id });
};
const validId = (req, res, next) => {
  if (typeof req.params.id !== 'string' || req.params.id.length < 1 || req.params.id.length > 128) {
    return res.status(400).json({ success: false, error: 'Tenant id is invalid', code: 'INVALID_INPUT' });
  }
  next();
};
const body = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ success: false, error: 'Request body must be an object', code: 'INVALID_INPUT' });
  next();
};
const createBody = (req, res, next) => {
  if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.length > 200 ||
      (req.body.domain !== undefined && (typeof req.body.domain !== 'string' || req.body.domain.length > 253)) ||
      (req.body.tier !== undefined && !['basic', 'standard', 'premium', 'enterprise'].includes(req.body.tier)) ||
      (req.body.expectedUsers !== undefined && (!Number.isInteger(req.body.expectedUsers) || req.body.expectedUsers < 0 || req.body.expectedUsers > 100000000)) ||
      (req.body.expectedLoad !== undefined && (!Number.isFinite(req.body.expectedLoad) || req.body.expectedLoad < 0 || req.body.expectedLoad > 1000000000))) {
    return res.status(400).json({ success: false, error: 'Tenant payload is invalid', code: 'INVALID_INPUT' });
  }
  next();
};
const updateBody = (req, res, next) => {
  if (Object.keys(req.body).length === 0 || (req.body.name !== undefined && (typeof req.body.name !== 'string' || req.body.name.length > 200)) ||
      (req.body.tier !== undefined && !['basic', 'standard', 'premium', 'enterprise'].includes(req.body.tier)) ||
      (req.body.allocatedResources !== undefined && (typeof req.body.allocatedResources !== 'object' || Array.isArray(req.body.allocatedResources))) ||
      (req.body.config !== undefined && (typeof req.body.config !== 'object' || Array.isArray(req.body.config)))) {
    return res.status(400).json({ success: false, error: 'Tenant update is invalid', code: 'INVALID_INPUT' });
  }
  next();
};
const admin = [rateLimiters.api, authMiddleware, requireRole('admin')];
const writeAdmin = [rateLimiters.write, authMiddleware, requireRole('admin')];

// Create tenant
router.post('/tenants', ...writeAdmin, validateBody(), body, createBody, async (req, res) => {
  try {
    const result = await tenantManagementService.createTenant(req.body);
    
    // Emit signal for tenant creation
    signalBus.emitSignal(SIGNAL.TENANT_CREATED, {
      tenantId: result.tenant.id,
      tenantName: result.tenant.name,
      tier: result.tenant.tier,
      resourceAllocation: result.resourceAllocation
    }, {
      severity: SEVERITY.INFO,
      source: 'tenant_management_routes',
      entityId: result.tenant.id,
      correlationId: requestId(req)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('tenantManagementRoutes:createTenant', { error: error.message });
    return fail(req, res, error, 'createTenant');
  }
});

// Get tenant
router.get('/tenants/:id', rateLimiters.read, authMiddleware, requireRole('admin'), validId, async (req, res) => {
  try {
    const tenant = await tenantManagementService.getTenant(req.params.id);
    res.json(tenant);
  } catch (error) {
    logger.error('tenantManagementRoutes:getTenant', { error: error.message });
    return fail(req, res, error, 'getTenant');
  }
});

// Get all tenants
router.get('/tenants', ...admin, (req, res, next) => {
  if ((req.query.tier !== undefined && (typeof req.query.tier !== 'string' || req.query.tier.length > 30)) ||
      (req.query.status !== undefined && (typeof req.query.status !== 'string' || req.query.status.length > 30))) return res.status(400).json({ success: false, error: 'Tenant filters are invalid', code: 'INVALID_INPUT' });
  next();
}, async (req, res) => {
  try {
    const tenants = await tenantManagementService.getAllTenants(req.query);
    res.json(tenants);
  } catch (error) {
    logger.error('tenantManagementRoutes:getAllTenants', { error: error.message });
    return fail(req, res, error, 'getAllTenants');
  }
});

// Update tenant
router.put('/tenants/:id', ...writeAdmin, validId, validateBody(), body, updateBody, async (req, res) => {
  try {
    const result = await tenantManagementService.updateTenant(req.params.id, req.body);
    
    // Emit signal for tenant update
    signalBus.emitSignal(SIGNAL.TENANT_UPDATED, {
      tenantId: req.params.id,
      updates: req.body
    }, {
      severity: SEVERITY.INFO,
      source: 'tenant_management_routes',
      entityId: req.params.id,
      correlationId: requestId(req)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('tenantManagementRoutes:updateTenant', { error: error.message });
    return fail(req, res, error, 'updateTenant');
  }
});

// Delete tenant
router.delete('/tenants/:id', ...writeAdmin, validId, async (req, res) => {
  try {
    const result = await tenantManagementService.deleteTenant(req.params.id);
    
    // Emit signal for tenant deletion
    signalBus.emitSignal(SIGNAL.TENANT_DELETED, {
      tenantId: req.params.id
    }, {
      severity: SEVERITY.WARNING,
      source: 'tenant_management_routes',
      entityId: req.params.id,
      correlationId: requestId(req)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('tenantManagementRoutes:deleteTenant', { error: error.message });
    return fail(req, res, error, 'deleteTenant');
  }
});

// Optimize tenant resources
router.post('/tenants/:id/optimize-resources', ...writeAdmin, validId, async (req, res) => {
  try {
    const optimization = await tenantManagementService.optimizeTenantResources(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('tenantManagementRoutes:optimizeResources', { error: error.message });
    return fail(req, res, error, 'optimizeResources');
  }
});

// Predict tenant usage
router.get('/tenants/:id/predict-usage', ...admin, validId, (req, res, next) => {
  if (req.query.timeframe !== undefined && !/^\d{1,4}[hdwmy]$/.test(req.query.timeframe)) return res.status(400).json({ success: false, error: 'timeframe is invalid', code: 'INVALID_INPUT' });
  next();
}, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const prediction = await tenantManagementService.predictTenantUsage(req.params.id, timeframe);
    res.json(prediction);
  } catch (error) {
    logger.error('tenantManagementRoutes:predictUsage', { error: error.message });
    return fail(req, res, error, 'predictUsage');
  }
});

// Recommend tier
router.get('/tenants/:id/recommend-tier', ...admin, validId, async (req, res) => {
  try {
    const recommendation = await tenantManagementService.recommendTier(req.params.id);
    res.json(recommendation);
  } catch (error) {
    logger.error('tenantManagementRoutes:recommendTier', { error: error.message });
    return fail(req, res, error, 'recommendTier');
  }
});

// Optimize tenant cost
router.post('/tenants/:id/optimize-cost', ...writeAdmin, validId, async (req, res) => {
  try {
    const optimization = await tenantManagementService.optimizeTenantCost(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('tenantManagementRoutes:optimizeCost', { error: error.message });
    return fail(req, res, error, 'optimizeCost');
  }
});

module.exports = router;
