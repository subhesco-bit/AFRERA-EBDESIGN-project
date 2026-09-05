/**
 * Organization Management Module Routes - AI Enhanced
 * 
 * Routes for organization management with AI-powered capabilities:
 * - Organization CRUD operations
 * - Structure optimization
 * - Hierarchy recommendations
 * - Performance prediction
 * - Resource allocation optimization
 * - Change impact analysis
 */

const express = require('express');
const router = express.Router();
const organizationManagementService = require('../services/legacy/organizationManagementService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/inputValidation');

const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

const requestId = (req) => req.get('x-correlation-id') || `organization-${Date.now()}`;
const fail = (req, res, error, operation) => {
  const id = requestId(req);
  logger.error(`organizationManagementRoutes:${operation}`, { error: error.message, requestId: id });
  return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR', requestId: id });
};
const validId = (req, res, next) => {
  if (typeof req.params.id !== 'string' || req.params.id.length < 1 || req.params.id.length > 128) return res.status(400).json({ success: false, error: 'Organization id is invalid', code: 'INVALID_INPUT' });
  next();
};
const body = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ success: false, error: 'Request body must be an object', code: 'INVALID_INPUT' });
  next();
};
const createBody = (req, res, next) => {
  if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.length > 200 ||
      (req.body.industry !== undefined && (typeof req.body.industry !== 'string' || req.body.industry.length > 100)) ||
      (req.body.size !== undefined && (typeof req.body.size !== 'string' || req.body.size.length > 50))) return res.status(400).json({ success: false, error: 'Organization payload is invalid', code: 'INVALID_INPUT' });
  next();
};
const updateBody = (req, res, next) => {
  if (!Object.keys(req.body).length || (req.body.name !== undefined && (typeof req.body.name !== 'string' || req.body.name.length > 200)) ||
      (req.body.structure !== undefined && (typeof req.body.structure !== 'object' || Array.isArray(req.body.structure))) ||
      (req.body.config !== undefined && (typeof req.body.config !== 'object' || Array.isArray(req.body.config)))) return res.status(400).json({ success: false, error: 'Organization update is invalid', code: 'INVALID_INPUT' });
  next();
};
const admin = [rateLimiters.api, authMiddleware, requireRole('admin')];
const writeAdmin = [rateLimiters.write, authMiddleware, requireRole('admin')];

// Create organization
router.post('/organizations', ...writeAdmin, validateBody(), body, createBody, async (req, res) => {
  try {
    const result = await organizationManagementService.createOrganization(req.body);
    
    // Emit signal for organization creation
    signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
      organizationId: result.organization.id,
      organizationName: result.organization.name,
      industry: result.organization.industry,
      structure: result.recommendedStructure
    }, {
      severity: SEVERITY.INFO,
      source: 'organization_management_routes',
      entityId: result.organization.id,
      correlationId: requestId(req)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('organizationManagementRoutes:createOrganization', { error: error.message });
    return fail(req, res, error, 'createOrganization');
  }
});

// Get organization
router.get('/organizations/:id', rateLimiters.read, authMiddleware, validId, async (req, res) => {
  try {
    const organization = await organizationManagementService.getOrganization(req.params.id);
    res.json(organization);
  } catch (error) {
    logger.error('organizationManagementRoutes:getOrganization', { error: error.message });
    return fail(req, res, error, 'getOrganization');
  }
});

// Update organization
router.put('/organizations/:id', ...writeAdmin, validId, validateBody(), body, updateBody, async (req, res) => {
  try {
    let result = await organizationManagementService.updateOrganization(req.params.id, req.body);
    
    // Emit signal for organization update
    signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
      organizationId: req.params.id,
      updates: req.body
    }, {
      severity: SEVERITY.INFO,
      source: 'organization_management_routes',
      entityId: req.params.id,
      correlationId: requestId(req)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('organizationManagementRoutes:updateOrganization', { error: error.message });
    return fail(req, res, error, 'updateOrganization');
  }
});

// Optimize structure
router.post('/organizations/:id/optimize-structure', ...writeAdmin, validId, async (req, res) => {
  try {
    const optimization = await organizationManagementService.optimizeStructure(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('organizationManagementRoutes:optimizeStructure', { error: error.message });
    return fail(req, res, error, 'optimizeStructure');
  }
});

// Recommend hierarchy changes
router.get('/organizations/:id/recommend-hierarchy', ...admin, validId, async (req, res) => {
  try {
    const recommendations = await organizationManagementService.recommendHierarchyChanges(req.params.id);
    res.json(recommendations);
  } catch (error) {
    logger.error('organizationManagementRoutes:recommendHierarchy', { error: error.message });
    return fail(req, res, error, 'recommendHierarchy');
  }
});

// Predict unit performance
router.get('/organizations/:id/units/:unitId/predict-performance', ...admin, validId, (req, res, next) => {
  if (typeof req.params.unitId !== 'string' || req.params.unitId.length < 1 || req.params.unitId.length > 128 ||
      (req.query.timeframe !== undefined && !/^\d{1,4}[hdwmy]$/.test(req.query.timeframe))) return res.status(400).json({ success: false, error: 'Unit id or timeframe is invalid', code: 'INVALID_INPUT' });
  next();
}, async (req, res) => {
  try {
    const { timeframe = '90d' } = req.query;
    const prediction = await organizationManagementService.predictUnitPerformance(req.params.id, req.params.unitId, timeframe);
    res.json(prediction);
  } catch (error) {
    logger.error('organizationManagementRoutes:predictUnitPerformance', { error: error.message });
    return fail(req, res, error, 'predictUnitPerformance');
  }
});

// Optimize resource allocation
router.post('/organizations/:id/optimize-resources', ...writeAdmin, validId, async (req, res) => {
  try {
    let optimization = await organizationManagementService.optimizeResourceAllocation(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('organizationManagementRoutes:optimizeResources', { error: error.message });
    return fail(req, res, error, 'optimizeResources');
  }
});

// Analyze change impact
router.post('/organizations/:id/analyze-change-impact', ...writeAdmin, validId, validateBody(), body, async (req, res) => {
  try {
    const analysis = await organizationManagementService.analyzeChangeImpact(req.params.id, req.body);
    res.json(analysis);
  } catch (error) {
    logger.error('organizationManagementRoutes:analyzeChangeImpact', { error: error.message });
    return fail(req, res, error, 'analyzeChangeImpact');
  }
});

// Get organization units
router.get('/organizations/:id/units', rateLimiters.read, authMiddleware, validId, async (req, res) => {
  try {
    const units = await organizationManagementService.getOrganizationUnits(req.params.id);
    res.json(units);
  } catch (error) {
    logger.error('organizationManagementRoutes:getUnits', { error: error.message });
    return fail(req, res, error, 'getUnits');
  }
});

// Add organizational unit
router.post('/organizations/:id/units', ...writeAdmin, validId, validateBody(), body, (req, res, next) => {
  if (typeof req.body.name !== 'string' || req.body.name.length < 1 || req.body.name.length > 200 ||
      (req.body.parentId !== undefined && (typeof req.body.parentId !== 'string' || req.body.parentId.length > 128)) ||
      (req.body.hierarchyLevel !== undefined && (!Number.isInteger(req.body.hierarchyLevel) || req.body.hierarchyLevel < 0 || req.body.hierarchyLevel > 100))) return res.status(400).json({ success: false, error: 'Organizational unit payload is invalid', code: 'INVALID_INPUT' });
  next();
}, async (req, res) => {
  try {
    let result = await organizationManagementService.addUnit(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('organizationManagementRoutes:addUnit', { error: error.message });
    return fail(req, res, error, 'addUnit');
  }
});

module.exports = router;
