/**
 * API Warning Routes
 * Production-Grade Warning System Endpoints
 * International Standards Compliance
 */

const express = require('express');
const router = express.Router();
const apiWarningService = require('../services/apiWarningService');
const { authMiddleware } = require('../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../middleware/roleGroups');
const { logger } = require('../utils/logger');

// Role-based middleware factory
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

/**
 * POST /api/v1/warnings/generate
 * Generate a new warning
 * Auth required
 */
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const {
      code,
      severity = 'warning',
      category = 'general',
      message,
      details,
      endpoint,
      metadata
    } = req.body;

    // Validate required fields
    if (!code || !message) {
      return res.status(400).json({
        success: false,
        error: 'code and message are required'
      });
    }

    const warning = apiWarningService.generateWarning({
      code,
      severity,
      category,
      message,
      details,
      userId: req.user?.id,
      requestId: req.id,
      endpoint: endpoint || req.path,
      metadata: {
        ...metadata,
        userAgent: req.get('user-agent'),
        ip: req.ip
      }
    });

    // Check if duplicate
    if (apiWarningService.isDuplicate(warning)) {
      logger.info('Duplicate warning detected', { warningId: warning.id });
      return res.status(200).json({
        success: true,
        data: warning,
        duplicate: true,
        message: 'Warning already exists, count incremented'
      });
    }

    // Persist warning asynchronously
    apiWarningService.persistWarning(warning).catch(err => {
      logger.error('Failed to persist warning', { error: err.message, warningId: warning.id });
    });

    res.status(201).json({
      success: true,
      data: warning,
      duplicate: false
    });
  } catch (error) {
    logger.error('Failed to generate warning', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate warning'
    });
  }
});

/**
 * GET /api/v1/warnings/user
 * Get warnings for current user
 * Auth required
 */
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const { severity, category, limit = 50, offset = 0 } = req.query;
    
    const warnings = await apiWarningService.getUserWarnings(req.user.id, {
      severity,
      category,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: warnings,
      count: warnings.length
    });
  } catch (error) {
    logger.error('Failed to fetch user warnings', { error: error.message, userId: req.user.id });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warnings'
    });
  }
});

/**
 * GET /api/v1/warnings/system
 * Get system-wide warnings (admin only)
 * Auth + Admin role required
 */
router.get('/system', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { severity, category, limit = 100, offset = 0, startDate, endDate } = req.query;
    
    const warnings = await apiWarningService.getSystemWarnings({
      severity,
      category,
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: warnings,
      count: warnings.length
    });
  } catch (error) {
    logger.error('Failed to fetch system warnings', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system warnings'
    });
  }
});

/**
 * GET /api/v1/warnings/stats
 * Get warning statistics
 * Auth required (admin for system stats)
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Non-admin users can only see their own stats
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const userWarnings = await apiWarningService.getUserWarnings(req.user.id, { limit: 1000 });
      
      const stats = {
        timeRange,
        total: userWarnings.length,
        bySeverity: userWarnings.reduce((acc, w) => {
          acc[w.severity] = (acc[w.severity] || 0) + 1;
          return acc;
        }, {}),
        byCategory: userWarnings.reduce((acc, w) => {
          acc[w.category] = (acc[w.category] || 0) + 1;
          return acc;
        }, {})
      };

      return res.json({
        success: true,
        data: stats
      });
    }

    // Admin users get full system stats
    const stats = await apiWarningService.getWarningStats(timeRange);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to fetch warning stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * POST /api/v1/warnings/:warningId/acknowledge
 * Acknowledge a warning
 * Auth required
 */
router.post('/:warningId/acknowledge', authMiddleware, async (req, res) => {
  try {
    const { warningId } = req.params;
    
    const success = await apiWarningService.acknowledgeWarning(warningId, req.user.id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Warning acknowledged'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to acknowledge warning'
      });
    }
  } catch (error) {
    logger.error('Failed to acknowledge warning', { error: error.message, warningId: req.params.warningId });
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge warning'
    });
  }
});

/**
 * POST /api/v1/warnings/cleanup
 * Clean expired warnings (admin only)
 * Auth + Admin role required
 */
router.post('/cleanup', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const count = await apiWarningService.clearExpiredWarnings();
    
    res.json({
      success: true,
      message: `Cleaned ${count} expired warnings`,
      count
    });
  } catch (error) {
    logger.error('Failed to clean expired warnings', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clean expired warnings'
    });
  }
});

/**
 * GET /api/v1/warnings/metrics
 * Get current in-memory metrics (admin only)
 * Auth + Admin role required
 */
router.get('/metrics', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const metrics = apiWarningService.getMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to fetch metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics'
    });
  }
});

/**
 * POST /api/v1/warnings/metrics/reset
 * Reset metrics (admin only)
 * Auth + Admin role required
 */
router.post('/metrics/reset', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    apiWarningService.resetMetrics();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    logger.error('Failed to reset metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
});

/**
 * GET /api/v1/warnings/health
 * Health check endpoint for warning system
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = apiWarningService.getMetrics();
    
    res.json({
      success: true,
      status: 'operational',
      data: {
        uptime: metrics.uptime,
        cacheSize: metrics.cacheSize,
        totalWarnings: metrics.total
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'degraded',
      error: error.message
    });
  }
});

module.exports = router;