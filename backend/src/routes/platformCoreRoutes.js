/**
 * M001 Platform Core Routes
 * Platform configuration and core functionality endpoints
 */

const express = require('express');
const router = express.Router();
const platformCoreService = require('../services/platformCoreService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

/**
 * GET /api/v1/platform/config
 * Get platform configuration
 */
router.get('/config', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const config = await platformCoreService.getPlatformConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get platform config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform configuration'
    });
  }
});

/**
 * PUT /api/v1/platform/config/:key
 * Update platform configuration
 */
router.put('/config/:key', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updatedBy = req.user.id;
    
    const updatedConfig = await platformCoreService.updatePlatformConfig(key, value, updatedBy);
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Platform configuration updated successfully'
    });
  } catch (error) {
    console.error('Update platform config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update platform configuration'
    });
  }
});

/**
 * GET /api/v1/platform/health
 * Get platform health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await platformCoreService.getPlatformHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    console.error('Get platform health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform health'
    });
  }
});

/**
 * GET /api/v1/platform/stats
 * Get platform statistics
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await platformCoreService.getPlatformStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform statistics'
    });
  }
});

/**
 * GET /api/v1/platform/optimizations
 * Get AI-powered platform optimization recommendations
 */
router.get('/optimizations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const optimizations = await platformCoreService.getPlatformOptimizations();
    
    res.json({
      success: true,
      data: optimizations
    });
  } catch (error) {
    console.error('Get platform optimizations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform optimizations'
    });
  }
});

module.exports = router;
