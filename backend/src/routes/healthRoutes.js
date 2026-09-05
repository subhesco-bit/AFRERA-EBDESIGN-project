/**
 * Health Check Routes
 * Production-ready health monitoring endpoints
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const redisCacheService = require('../services/redisCacheService');

// Basic health check
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// Detailed health check with database and cache status
router.get('/detailed', async (req, res) => {
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'unknown', message: 'Not checked' },
      redis: { status: 'unknown', message: 'Not checked' },
      memory: { status: 'unknown', message: 'Not checked' },
      disk: { status: 'unknown', message: 'Not checked' }
    }
  };

  let overallStatus = 'healthy';

  try {
    // Check database connection
    try {
      const db = getPostgreSQL();
      await db.query('SELECT 1');
      health.checks.database = {
        status: 'healthy',
        message: 'Database connection successful'
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        message: error.message
      };
      overallStatus = 'degraded';
    }

    // Check Redis connection
    try {
      const stats = await redisCacheService.getStats();
      health.checks.redis = {
        status: stats.connected ? 'healthy' : 'unhealthy',
        message: stats.connected ? 'Redis connection successful' : 'Redis not connected',
        keys: stats.keys,
        memory: stats.memory
      };
      if (!stats.connected) {
        overallStatus = 'degraded';
      }
    } catch (error) {
      health.checks.redis = {
        status: 'unhealthy',
        message: error.message
      };
      overallStatus = 'degraded';
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    const memoryPercent = (memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) * 100;
    health.checks.memory = {
      status: memoryPercent > 90 ? 'unhealthy' : memoryPercent > 70 ? 'degraded' : 'healthy',
      message: `Memory usage: ${memoryPercent.toFixed(2)}%`,
      usage: memoryUsageMB
    };

    if (memoryPercent > 90) {
      overallStatus = 'unhealthy';
    } else if (memoryPercent > 70) {
      overallStatus = 'degraded';
    }

    // Check disk space (if available)
    try {
      const fs = require('fs');
      let stats = fs.statSync('.');
      health.checks.disk = {
        status: 'healthy',
        message: 'Disk space check not implemented'
      };
    } catch (error) {
      health.checks.disk = {
        status: 'unknown',
        message: 'Could not check disk space'
      };
    }

    health.status = overallStatus;
    res.status(overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503).json(health);

  } catch (error) {
    logger.error('Detailed health check failed', error);
    health.status = 'unhealthy';
    health.success = false;
    res.status(503).json(health);
  }
});

// Readiness check (for Kubernetes/containers)
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    let db = getPostgreSQL();
    await db.query('SELECT 1');

    res.status(200).json({
      success: true,
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed', error);
    res.status(503).json({
      success: false,
      status: 'not ready',
      error: error.message
    });
  }
});

// Liveness check (for Kubernetes/containers)
router.get('/live', async (req, res) => {
  try {
    // Check if the process is responsive
    res.status(200).json({
      success: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Liveness check failed', error);
    res.status(503).json({
      success: false,
      status: 'dead',
      error: error.message
    });
  }
});

// Metrics endpoint (for monitoring systems)
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    // Add custom metrics if available
    if (global.customMetrics) {
      metrics.custom = global.customMetrics;
    }

    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Metrics collection failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect metrics'
    });
  }
});

module.exports = router;