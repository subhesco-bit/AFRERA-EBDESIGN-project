/**
 * Module Support Infrastructure Routes
 * 
 * Express routes for the Module Support Infrastructure service,
 * providing endpoints for module management, dependency resolution,
 * configuration management, health monitoring, and AI support recommendations.
 */

const express = require('express');
const router = express.Router();
const moduleSupportInfrastructureService = require('../services/moduleSupportInfrastructureService');

/**
 * Module Management Routes
 */

// Get all modules
router.get('/modules', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      healthStatus: req.query.healthStatus
    };
    
    const modules = moduleSupportInfrastructureService.getModules(filters);
    res.json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get a specific module
router.get('/modules/:moduleId', (req, res) => {
  try {
    const module = moduleSupportInfrastructureService.getModule(req.params.moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        error: 'Module not found'
      });
    }
    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a new module
router.post('/modules', (req, res) => {
  try {
    const module = moduleSupportInfrastructureService.registerModule(req.body);
    res.status(201).json({
      success: true,
      message: 'Module registered successfully',
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a module
router.put('/modules/:moduleId', (req, res) => {
  try {
    const module = moduleSupportInfrastructureService.updateModule(req.params.moduleId, req.body);
    res.json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unregister a module
router.delete('/modules/:moduleId', (req, res) => {
  try {
    const result = moduleSupportInfrastructureService.unregisterModule(req.params.moduleId);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Dependency Management Routes
 */

// Get module dependencies
router.get('/modules/:moduleId/dependencies', (req, res) => {
  try {
    const dependencies = moduleSupportInfrastructureService.getModuleDependencies(req.params.moduleId);
    res.json({
      success: true,
      data: dependencies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check dependency graph
router.get('/dependencies/graph', (req, res) => {
  try {
    const graph = moduleSupportInfrastructureService.checkDependencyGraph();
    res.json({
      success: true,
      data: graph
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve dependency order
router.get('/dependencies/order', (req, res) => {
  try {
    const order = moduleSupportInfrastructureService.resolveDependencyOrder();
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Configuration Management Routes
 */

// Set module configuration
router.post('/modules/:moduleId/configuration', (req, res) => {
  try {
    const config = moduleSupportInfrastructureService.setModuleConfiguration(req.params.moduleId, req.body);
    res.status(201).json({
      success: true,
      message: 'Configuration set successfully',
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get module configuration
router.get('/modules/:moduleId/configuration', (req, res) => {
  try {
    const config = moduleSupportInfrastructureService.getModuleConfiguration(req.params.moduleId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Service Registry Routes
 */

// Get all services
router.get('/services', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      moduleId: req.query.moduleId
    };
    
    const services = moduleSupportInfrastructureService.getServices(filters);
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a new service
router.post('/services', (req, res) => {
  try {
    const service = moduleSupportInfrastructureService.registerService(req.body);
    res.status(201).json({
      success: true,
      message: 'Service registered successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health Monitoring Routes
 */

// Perform health check on a module
router.post('/modules/:moduleId/health-check', async (req, res) => {
  try {
    const healthCheck = await moduleSupportInfrastructureService.performHealthCheck(req.params.moduleId);
    res.json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all health status
router.get('/health-status', (req, res) => {
  try {
    const healthStatus = moduleSupportInfrastructureService.getAllHealthStatus();
    res.json({
      success: true,
      count: healthStatus.length,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Support Ticket Routes
 */

// Get all support tickets
router.get('/support-tickets', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      moduleId: req.query.moduleId
    };
    
    const tickets = moduleSupportInfrastructureService.getSupportTickets(filters);
    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a support ticket
router.post('/support-tickets', (req, res) => {
  try {
    const ticket = moduleSupportInfrastructureService.createSupportTicket(req.body);
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a support ticket
router.put('/support-tickets/:ticketId', (req, res) => {
  try {
    const ticket = moduleSupportInfrastructureService.updateSupportTicket(req.params.ticketId, req.body);
    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI Support Recommendation Routes
 */

// Generate AI support recommendations
router.post('/ai-recommendations', async (req, res) => {
  try {
    const { moduleId, issueType } = req.body;
    if (!moduleId || !issueType) {
      return res.status(400).json({
        success: false,
        error: 'moduleId and issueType are required in request body'
      });
    }
    
    const recommendations = await moduleSupportInfrastructureService.generateAIRecommendations(moduleId, issueType);
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Resource Allocation Routes
 */

// Allocate resources to a module
router.post('/modules/:moduleId/resources', (req, res) => {
  try {
    const allocation = moduleSupportInfrastructureService.allocateResources(req.params.moduleId, req.body);
    res.status(201).json({
      success: true,
      message: 'Resources allocated successfully',
      data: allocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get resource allocation
router.get('/modules/:moduleId/resources', (req, res) => {
  try {
    const allocation = moduleSupportInfrastructureService.getResourceAllocation(req.params.moduleId);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        error: 'Resource allocation not found'
      });
    }
    res.json({
      success: true,
      data: allocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Infrastructure Overview Routes
 */

// Get infrastructure overview
router.get('/overview', (req, res) => {
  try {
    const overview = moduleSupportInfrastructureService.getInfrastructureOverview();
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health Route
 */

// Get service health status
router.get('/health', (req, res) => {
  try {
    const health = moduleSupportInfrastructureService.getHealthStatus();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
