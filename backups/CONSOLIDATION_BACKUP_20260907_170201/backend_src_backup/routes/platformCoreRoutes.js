/**
 * M001 Platform Core Routes
 * Platform configuration and core functionality endpoints
 */

const express = require('express');
const router = express.Router();
const platformCoreService = require('../services/dual-use/platformCoreService');
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
 * Get static best-practice platform optimization recommendations (not
 * AI-generated - see platformCoreService.js's getPlatformOptimizations()).
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

/**
 * F1 fix (2026-08-30) — frontend `platformCoreAPI` (frontend/src/services/api.js:416-426)
 * calls 9 endpoints below that have no backend route at all, and
 * services/dual-use/platformCoreService.js has no backing methods for any of
 * them (checked: only getPlatformConfig/updatePlatformConfig/getPlatformHealth/
 * getPlatformStats/getPlatformOptimizations exist - no initialize, scaling,
 * capacity, disaster-recovery, performance-monitor, self-healing, optimized-
 * configuration, metrics, or system-state method anywhere in that file or any
 * sibling service). Rather than fabricate scaling/capacity/DR/self-healing
 * logic that doesn't exist, these fail honestly with 501, same pattern as
 * aiGatewayRoutes.js's notImplemented() helper.
 */
const notImplemented = (feature) => (req, res) => {
  res.status(501).json({ success: false, error: `${feature} is not implemented`, code: 'NOT_IMPLEMENTED' });
};

router.post('/initialize', authMiddleware, adminMiddleware, notImplemented('Platform initialize'));
router.get('/scaling/recommendations', authMiddleware, adminMiddleware, notImplemented('Platform scaling recommendations'));
router.get('/capacity/predict', authMiddleware, adminMiddleware, notImplemented('Platform capacity prediction'));
router.post('/disaster-recovery', authMiddleware, adminMiddleware, notImplemented('Platform disaster recovery trigger'));
router.get('/performance/monitor', authMiddleware, adminMiddleware, notImplemented('Platform performance monitoring'));
router.post('/self-healing', authMiddleware, adminMiddleware, notImplemented('Platform self-healing trigger'));
router.get('/configuration/optimized', authMiddleware, adminMiddleware, notImplemented('Optimized configuration retrieval'));
router.post('/configuration/apply', authMiddleware, adminMiddleware, notImplemented('Configuration apply'));
router.get('/metrics', authMiddleware, adminMiddleware, notImplemented('Platform metrics'));
router.get('/state', authMiddleware, adminMiddleware, notImplemented('Platform system state'));

module.exports = router;
