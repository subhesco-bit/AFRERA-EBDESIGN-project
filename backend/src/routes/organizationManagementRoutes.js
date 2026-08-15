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
const organizationManagementService = require('../services/organizationManagementService');
const { authMiddleware, requireRole } = require('../middleware/auth');

const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

// Create organization
router.post('/organizations', authMiddleware, requireRole("admin"), async (req, res) => {
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
      entityId: result.organization.id
    });
    
    res.json(result);
  } catch (error) {
    logger.error('organizationManagementRoutes:createOrganization', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get organization
router.get('/organizations/:id', authMiddleware, async (req, res) => {
  try {
    const organization = await organizationManagementService.getOrganization(req.params.id);
    res.json(organization);
  } catch (error) {
    logger.error('organizationManagementRoutes:getOrganization', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update organization
router.put('/organizations/:id', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await organizationManagementService.updateOrganization(req.params.id, req.body);
    
    // Emit signal for organization update
    signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
      organizationId: req.params.id,
      updates: req.body
    }, {
      severity: SEVERITY.INFO,
      source: 'organization_management_routes',
      entityId: req.params.id
    });
    
    res.json(result);
  } catch (error) {
    logger.error('organizationManagementRoutes:updateOrganization', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Optimize structure
router.post('/organizations/:id/optimize-structure', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const optimization = await organizationManagementService.optimizeStructure(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('organizationManagementRoutes:optimizeStructure', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recommend hierarchy changes
router.get('/organizations/:id/recommend-hierarchy', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const recommendations = await organizationManagementService.recommendHierarchyChanges(req.params.id);
    res.json(recommendations);
  } catch (error) {
    logger.error('organizationManagementRoutes:recommendHierarchy', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Predict unit performance
router.get('/organizations/:id/units/:unitId/predict-performance', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { timeframe = '90d' } = req.query;
    const prediction = await organizationManagementService.predictUnitPerformance(req.params.id, req.params.unitId, timeframe);
    res.json(prediction);
  } catch (error) {
    logger.error('organizationManagementRoutes:predictUnitPerformance', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Optimize resource allocation
router.post('/organizations/:id/optimize-resources', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const optimization = await organizationManagementService.optimizeResourceAllocation(req.params.id);
    res.json(optimization);
  } catch (error) {
    logger.error('organizationManagementRoutes:optimizeResources', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze change impact
router.post('/organizations/:id/analyze-change-impact', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const analysis = await organizationManagementService.analyzeChangeImpact(req.params.id, req.body);
    res.json(analysis);
  } catch (error) {
    logger.error('organizationManagementRoutes:analyzeChangeImpact', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get organization units
router.get('/organizations/:id/units', authMiddleware, async (req, res) => {
  try {
    const units = await organizationManagementService.getOrganizationUnits(req.params.id);
    res.json(units);
  } catch (error) {
    logger.error('organizationManagementRoutes:getUnits', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add organizational unit
router.post('/organizations/:id/units', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await organizationManagementService.addUnit(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    logger.error('organizationManagementRoutes:addUnit', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
