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
const tenantManagementService = require('../services/tenantManagementService');
const { authMiddleware, requireRole } = require('../middleware/auth');

const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

// Create tenant
router.post('/tenants', authMiddleware, requireRole("admin"), async (req, res) => {
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
      entityId: result.tenant.id
    });
    
    res.json(result);
  } catch (error) {
    logger.error('tenantManagementRoutes:createTenant', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tenant
router.get('/tenants/:id', authMiddleware, async (req, res) => {
  try {
    const tenant = await tenantManagementService.getTenant(req.params.id);
    res.json(tenant);
  } catch (error) {
    logger.error('tenantManagementRoutes:getTenant', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tenants
router.get('/tenants', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const tenants = await tenantManagementService.getAllTenants(req.query);
    res.json(tenants);
  } catch (error) {
    logger.error('tenantManagementRoutes:getAllTenants', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update tenant
router.put('/tenants/:id', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await tenantManagementService.updateTenant(req.params.id, req.body);
    
    // Emit signal for tenant update
    signalBus.emitSignal(SIGNAL.TENANT_UPDATED, {
      tenantId: req.params.id,
      updates: req.body
    }, {
      severity: SEVERITY.INFO,
      source: 'tenant_management_routes',
      entityId: req.params.id
    });
    
    res.json(result);
  } catch (error) {
    logger.error('tenantManagementRoutes:updateTenant', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete tenant
router.delete('/tenants/:id', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await tenantManagementService.deleteTenant(req.params.id);
    
    // Emit signal for tenant deletion
    signalBus.emitSignal(SIGNAL.TENANT_DELETED, {
      tenantId: req.params.id
    }, {
      severity: SEVERITY.WARNING,
      source: 'tenant_management_routes',
      entityId: req.params.id
    });
    
    res.json(result);
  } catch (error) {
    logger.error('tenantManagementRoutes:deleteTenant', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Optimize tenant resources
router.post('/tenants/:id/optimize-resources', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const optimization = await tenantManagementService.optimizeTenantResources(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('tenantManagementRoutes:optimizeResources', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Predict tenant usage
router.get('/tenants/:id/predict-usage', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const prediction = await tenantManagementService.predictTenantUsage(req.params.id, timeframe);
    res.json(prediction);
  } catch (error) {
    logger.error('tenantManagementRoutes:predictUsage', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recommend tier
router.get('/tenants/:id/recommend-tier', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const recommendation = await tenantManagementService.recommendTier(req.params.id);
    res.json(recommendation);
  } catch (error) {
    logger.error('tenantManagementRoutes:recommendTier', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Optimize tenant cost
router.post('/tenants/:id/optimize-cost', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const optimization = await tenantManagementService.optimizeTenantCost(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('tenantManagementRoutes:optimizeCost', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
