/**
 * SAP-Style Module Architecture Routes
 * 
 * API endpoints for SAP-style independent module architecture including:
 * - Module registration and management
 * - Dependency management
 * - Lifecycle management
 * - Configuration management
 * - Version management
 * - MTA descriptor generation
 * - Architecture overview
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const sapModuleArchitectureService = require('../services/legacy/sapModuleArchitectureService');

/**
 * Get all modules
 * GET /api/sap-module-architecture/modules
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules', (req, res) => {
  try {
    const modules = sapModuleArchitectureService.getAllModules();
    
    res.json({
      success: true,
      modules: modules
    });
  } catch (error) {
    console.error('Error getting modules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get module by ID
 * GET /api/sap-module-architecture/modules/:id
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const module = sapModuleArchitectureService.getModule(id);
    
    if (!module) {
      return res.status(404).json({
        success: false,
        error: `Module ${id} not found`
      });
    }
    
    res.json({
      success: true,
      module: module
    });
  } catch (error) {
    console.error('Error getting module:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get modules by type
 * GET /api/sap-module-architecture/modules/type/:type
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    let modules = sapModuleArchitectureService.getModulesByType(type);
    
    res.json({
      success: true,
      modules: modules
    });
  } catch (error) {
    console.error('Error getting modules by type:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Register a new module
 * POST /api/sap-module-architecture/modules
 */
router.post
    // Log request
    logger.debug('router.post request');('/modules', (req, res) => {
  try {
    const { id, name, description, type, version, dependencies, capabilities } = req.body;
    
    if (!id || !name || !description || !type || !version) {
      return res.status(400).json({
        success: false,
        error: 'id, name, description, type, and version are required'
      });
    }
    
    sapModuleArchitectureService.registerModule(id, {
      name,
      description,
      type,
      version,
      dependencies: dependencies || [],
      capabilities: capabilities || []
    });
    
    let module = sapModuleArchitectureService.getModule(id);
    
    res.json({
      success: true,
      module: module
    });
  } catch (error) {
    console.error('Error registering module:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update module
 * PUT /api/sap-module-architecture/modules/:id
 */
router.put
    // Log request
    logger.debug('router.put request');('/modules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = sapModuleArchitectureService.updateModule(id, updates);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete module
 * DELETE /api/sap-module-architecture/modules/:id
 */
router.delete
    // Log request
    logger.debug('router.delete request');('/modules/:id', (req, res) => {
  try {
    const { id } = req.params;
    let result = sapModuleArchitectureService.deleteModule(id);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get module dependencies
 * GET /api/sap-module-architecture/modules/:id/dependencies
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id/dependencies', (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = sapModuleArchitectureService.getModuleDependencies(id);
    
    res.json({
      success: true,
      dependencies: dependencies
    });
  } catch (error) {
    console.error('Error getting module dependencies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get dependency graph
 * GET /api/sap-module-architecture/dependency-graph
 */
router.get
    // Log request
    logger.debug('router.get request');('/dependency-graph', (req, res) => {
  try {
    const graph = sapModuleArchitectureService.getDependencyGraph();
    
    res.json({
      success: true,
      graph: graph
    });
  } catch (error) {
    console.error('Error getting dependency graph:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Resolve dependencies
 * GET /api/sap-module-architecture/modules/:id/resolve-dependencies
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id/resolve-dependencies', (req, res) => {
  try {
    const { id } = req.params;
    const resolved = sapModuleArchitectureService.resolveDependencies(id);
    
    res.json({
      success: true,
      resolved: resolved
    });
  } catch (error) {
    console.error('Error resolving dependencies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get module configuration
 * GET /api/sap-module-architecture/modules/:id/configuration
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id/configuration', (req, res) => {
  try {
    const { id } = req.params;
    const configuration = sapModuleArchitectureService.getModuleConfiguration(id);
    
    res.json({
      success: true,
      configuration: configuration
    });
  } catch (error) {
    console.error('Error getting module configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Set module configuration
 * PUT /api/sap-module-architecture/modules/:id/configuration
 */
router.put
    // Log request
    logger.debug('router.put request');('/modules/:id/configuration', (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;
    
    let result = sapModuleArchitectureService.setModuleConfiguration(id, config);
    
    res.json(result);
  } catch (error) {
    console.error('Error setting module configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get module version
 * GET /api/sap-module-architecture/modules/:id/version
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id/version', (req, res) => {
  try {
    const { id } = req.params;
    const version = sapModuleArchitectureService.getModuleVersion(id);
    
    res.json({
      success: true,
      version: version
    });
  } catch (error) {
    console.error('Error getting module version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update module version
 * PUT /api/sap-module-architecture/modules/:id/version
 */
router.put
    // Log request
    logger.debug('router.put request');('/modules/:id/version', (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;
    
    if (!version) {
      return res.status(400).json({
        success: false,
        error: 'version is required'
      });
    }
    
    let result = sapModuleArchitectureService.updateModuleVersion(id, version);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating module version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Transition module state
 * POST /api/sap-module-architecture/modules/:id/transition
 */
router.post
    // Log request
    logger.debug('router.post request');('/modules/:id/transition', (req, res) => {
  try {
    const { id } = req.params;
    const { new_state } = req.body;
    
    if (!new_state) {
      return res.status(400).json({
        success: false,
        error: 'new_state is required'
      });
    }
    
    let result = sapModuleArchitectureService.transitionModuleState(id, new_state);
    
    res.json(result);
  } catch (error) {
    console.error('Error transitioning module state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get module lifecycle
 * GET /api/sap-module-architecture/modules/:id/lifecycle
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id/lifecycle', (req, res) => {
  try {
    const { id } = req.params;
    const lifecycle = sapModuleArchitectureService.getModuleLifecycle(id);
    
    res.json({
      success: true,
      lifecycle: lifecycle
    });
  } catch (error) {
    console.error('Error getting module lifecycle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get module compatibility
 * GET /api/sap-module-architecture/modules/:id/compatibility
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id/compatibility', (req, res) => {
  try {
    const { id } = req.params;
    const compatibility = sapModuleArchitectureService.getModuleCompatibility(id);
    
    res.json({
      success: true,
      compatibility: compatibility
    });
  } catch (error) {
    console.error('Error getting module compatibility:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate MTA descriptor
 * GET /api/sap-module-architecture/modules/:id/mta-descriptor
 */
router.get
    // Log request
    logger.debug('router.get request');('/modules/:id/mta-descriptor', (req, res) => {
  try {
    const { id } = req.params;
    const descriptor = sapModuleArchitectureService.generateMTADescriptor(id);
    
    res.json({
      success: true,
      descriptor: descriptor
    });
  } catch (error) {
    console.error('Error generating MTA descriptor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get architecture overview
 * GET /api/sap-module-architecture/overview
 */
router.get
    // Log request
    logger.debug('router.get request');('/overview', (req, res) => {
  try {
    const overview = sapModuleArchitectureService.getArchitectureOverview();
    
    res.json({
      success: true,
      overview: overview
    });
  } catch (error) {
    console.error('Error getting architecture overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for SAP Module Architecture service
 * GET /api/sap-module-architecture/service-health
 */
router.get
    // Log request
    logger.debug('router.get request');('/service-health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    modules_count: sapModuleArchitectureService.modules.size,
    dependencies_count: sapModuleArchitectureService.dependencies.size,
    configurations_count: sapModuleArchitectureService.configurations.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
