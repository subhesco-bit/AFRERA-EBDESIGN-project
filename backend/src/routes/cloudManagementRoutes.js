/**
 * Cloud Management Routes
 * 
 * API endpoints for multi-cloud deployment management including:
 * - Provider management
 * - Infrastructure provisioning
 * - Resource management
 * - Deployment management
 * - Cost optimization
 * - Security management
 * - Monitoring and disaster recovery
 */

const express = require('express');
const router = express.Router();
const cloudManagementService = require('../services/cloudManagementService');

/**
 * Get all cloud providers
 * GET /api/cloud-management/providers
 */
router.get('/providers', (req, res) => {
  try {
    const providers = cloudManagementService.getAllProviders();
    
    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get provider by ID
 * GET /api/cloud-management/providers/:providerId
 */
router.get('/providers/:providerId', (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = cloudManagementService.getProvider(providerId);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: `Provider ${providerId} not found`
      });
    }
    
    res.json({
      success: true,
      provider: provider
    });
  } catch (error) {
    console.error('Error getting provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Enable provider
 * POST /api/cloud-management/providers/:providerId/enable
 */
router.post('/providers/:providerId/enable', (req, res) => {
  try {
    const { providerId } = req.params;
    const result = cloudManagementService.enableProvider(providerId);
    
    res.json(result);
  } catch (error) {
    console.error('Error enabling provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Disable provider
 * POST /api/cloud-management/providers/:providerId/disable
 */
router.post('/providers/:providerId/disable', (req, res) => {
  try {
    const { providerId } = req.params;
    const result = cloudManagementService.disableProvider(providerId);
    
    res.json(result);
  } catch (error) {
    console.error('Error disabling provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Provision infrastructure
 * POST /api/cloud-management/provision
 */
router.post('/provision', async (req, res) => {
  try {
    const { provider_id, resource_type, name, region, configuration } = req.body;
    
    if (!provider_id || !resource_type || !name) {
      return res.status(400).json({
        success: false,
        error: 'provider_id, resource_type, and name are required'
      });
    }
    
    const result = await cloudManagementService.provisionInfrastructure(provider_id, {
      resource_type,
      name,
      region,
      configuration
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error provisioning infrastructure:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all resources
 * GET /api/cloud-management/resources
 */
router.get('/resources', (req, res) => {
  try {
    const resources = cloudManagementService.getAllResources();
    
    res.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error getting resources:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get resource by ID
 * GET /api/cloud-management/resources/:resourceId
 */
router.get('/resources/:resourceId', (req, res) => {
  try {
    const { resourceId } = req.params;
    const resource = cloudManagementService.getResource(resourceId);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: `Resource ${resourceId} not found`
      });
    }
    
    res.json({
      success: true,
      resource: resource
    });
  } catch (error) {
    console.error('Error getting resource:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get resources by provider
 * GET /api/cloud-management/resources/provider/:providerId
 */
router.get('/resources/provider/:providerId', (req, res) => {
  try {
    const { providerId } = req.params;
    const resources = cloudManagementService.getResourcesByProvider(providerId);
    
    res.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error getting resources by provider:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update resource
 * PUT /api/cloud-management/resources/:resourceId
 */
router.put('/resources/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const updates = req.body;
    
    const result = await cloudManagementService.updateResource(resourceId, updates);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete resource
 * DELETE /api/cloud-management/resources/:resourceId
 */
router.delete('/resources/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const result = await cloudManagementService.deleteResource(resourceId);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create deployment
 * POST /api/cloud-management/deployments
 */
router.post('/deployments', async (req, res) => {
  try {
    const { name, environment, providers, resources } = req.body;
    
    if (!name || !resources) {
      return res.status(400).json({
        success: false,
        error: 'name and resources are required'
      });
    }
    
    const result = await cloudManagementService.createDeployment({
      name,
      environment,
      providers,
      resources
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating deployment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all deployments
 * GET /api/cloud-management/deployments
 */
router.get('/deployments', (req, res) => {
  try {
    const deployments = cloudManagementService.getAllDeployments();
    
    res.json({
      success: true,
      deployments: deployments
    });
  } catch (error) {
    console.error('Error getting deployments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get deployment by ID
 * GET /api/cloud-management/deployments/:deploymentId
 */
router.get('/deployments/:deploymentId', (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = cloudManagementService.getDeployment(deploymentId);
    
    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: `Deployment ${deploymentId} not found`
      });
    }
    
    res.json({
      success: true,
      deployment: deployment
    });
  } catch (error) {
    console.error('Error getting deployment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Scale deployment
 * POST /api/cloud-management/deployments/:deploymentId/scale
 */
router.post('/deployments/:deploymentId/scale', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const { type, instances } = req.body;
    
    if (!type || !instances) {
      return res.status(400).json({
        success: false,
        error: 'type and instances are required'
      });
    }
    
    const result = await cloudManagementService.scaleDeployment(deploymentId, {
      type,
      instances
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error scaling deployment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get cost summary
 * GET /api/cloud-management/costs
 */
router.get('/costs', (req, res) => {
  try {
    const summary = cloudManagementService.getCostSummary();
    
    res.json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error('Error getting cost summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Optimize costs
 * POST /api/cloud-management/costs/optimize
 */
router.post('/costs/optimize', async (req, res) => {
  try {
    const result = await cloudManagementService.optimizeCosts();
    
    res.json(result);
  } catch (error) {
    console.error('Error optimizing costs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get security status
 * GET /api/cloud-management/security
 */
router.get('/security', (req, res) => {
  try {
    const status = cloudManagementService.getSecurityStatus();
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting security status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Apply security policy
 * POST /api/cloud-management/security/policies/:policyId/apply
 */
router.post('/security/policies/:policyId/apply', async (req, res) => {
  try {
    const { policyId } = req.params;
    const { scope } = req.body;
    
    if (!scope) {
      return res.status(400).json({
        success: false,
        error: 'scope is required'
      });
    }
    
    const result = await cloudManagementService.applySecurityPolicy(policyId, scope);
    
    res.json(result);
  } catch (error) {
    console.error('Error applying security policy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get monitoring metrics
 * GET /api/cloud-management/monitoring
 */
router.get('/monitoring', (req, res) => {
  try {
    const metrics = cloudManagementService.getMonitoringMetrics();
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error getting monitoring metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Setup disaster recovery
 * POST /api/cloud-management/disaster-recovery
 */
router.post('/disaster-recovery', async (req, res) => {
  try {
    const { primary_region, backup_region, replication_schedule, retention_period } = req.body;
    
    if (!primary_region || !backup_region) {
      return res.status(400).json({
        success: false,
        error: 'primary_region and backup_region are required'
      });
    }
    
    const result = await cloudManagementService.setupDisasterRecovery({
      primary_region,
      backup_region,
      replication_schedule,
      retention_period
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error setting up disaster recovery:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get cloud overview
 * GET /api/cloud-management/overview
 */
router.get('/overview', (req, res) => {
  try {
    const overview = cloudManagementService.getCloudOverview();
    
    res.json({
      success: true,
      overview: overview
    });
  } catch (error) {
    console.error('Error getting cloud overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for Cloud Management service
 * GET /api/cloud-management/service-health
 */
router.get('/service-health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    providers_count: cloudManagementService.providers.size,
    resources_count: cloudManagementService.resources.size,
    deployments_count: cloudManagementService.deployments.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
