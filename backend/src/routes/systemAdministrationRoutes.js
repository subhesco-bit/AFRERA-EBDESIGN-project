/**
 * System Administration Module Routes - AI Enhanced
 * 
 * Routes for system administration with AI-powered capabilities:
 * - System initialization
 * - Incident prediction
 * - Root cause analysis
 * - Self-healing
 * - Capacity forecasting
 * - Security threat detection
 * - System health dashboard
 * - Automated maintenance
 */

const express = require('express');
const router = express.Router();
const systemAdministrationService = require('../services/legacy/systemAdministrationService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/inputValidation');

const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

const requestId = (req) => req.get('x-correlation-id') || `system-admin-${Date.now()}`;
const fail = (req, res, error, operation) => {
  const id = requestId(req);
  logger.error(`systemAdministrationRoutes:${operation}`, { error: error.message, requestId: id });
  return res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR', requestId: id });
};
const body = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ success: false, error: 'Request body must be an object', code: 'INVALID_INPUT' });
  next();
};
const timeframe = (req, res, next) => {
  if (req.query.timeframe !== undefined && !/^\d{1,4}[hdwmy]$/.test(req.query.timeframe)) return res.status(400).json({ success: false, error: 'timeframe is invalid', code: 'INVALID_INPUT' });
  next();
};
const admin = [rateLimiters.api, authMiddleware, requireRole('admin')];
const writeAdmin = [rateLimiters.write, authMiddleware, requireRole('admin')];

// Initialize system administration
router.post('/initialize', ...writeAdmin, async (req, res) => {
  try {
    const result = await systemAdministrationService.initialize();
    res.json(result);
  } catch (error) {
    logger.error('systemAdministrationRoutes:initialize', { error: error.message });
    return fail(req, res, error, 'initialize');
  }
});

// Predict incidents
router.get('/incidents/predict', ...admin, timeframe, async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const prediction = await systemAdministrationService.predictIncidents(timeframe);
    res.json(prediction);
  } catch (error) {
    logger.error('systemAdministrationRoutes:predictIncidents', { error: error.message });
    return fail(req, res, error, 'predictIncidents');
  }
});

// Analyze root cause
router.post('/incidents/root-cause', ...writeAdmin, validateBody(), body, (req, res, next) => {
  if (typeof req.body.id !== 'string' || req.body.id.length < 1 || req.body.id.length > 128) return res.status(400).json({ success: false, error: 'incident id is required', code: 'INVALID_INPUT' });
  next();
}, async (req, res) => {
  try {
    const analysis = await systemAdministrationService.analyzeRootCause(req.body);
    res.json(analysis);
  } catch (error) {
    logger.error('systemAdministrationRoutes:analyzeRootCause', { error: error.message });
    return fail(req, res, error, 'analyzeRootCause');
  }
});

// Trigger self-healing
router.post('/self-healing', ...writeAdmin, validateBody(), body, (req, res, next) => {
  if (typeof req.body.id !== 'string' || req.body.id.length < 1 || req.body.id.length > 128) return res.status(400).json({ success: false, error: 'issue id is required', code: 'INVALID_INPUT' });
  next();
}, async (req, res) => {
  try {
    const result = await systemAdministrationService.triggerSelfHealing(req.body);
    
    // Emit signal for self-healing action
    signalBus.emitSignal(SIGNAL.SYSTEM_HEALTH_CHANGED, {
      issueId: req.body.id,
      action: result.action,
      success: result.success,
      confidence: result.confidence
    }, {
      severity: result.success ? SEVERITY.INFO : SEVERITY.WARNING,
      source: 'system_administration_routes',
      entityId: req.body.id,
      correlationId: requestId(req)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('systemAdministrationRoutes:triggerSelfHealing', { error: error.message });
    return fail(req, res, error, 'triggerSelfHealing');
  }
});

// Forecast capacity
router.get('/capacity/forecast', ...admin, timeframe, async (req, res) => {
  try {
    const { timeframe = '90d' } = req.query;
    const forecast = await systemAdministrationService.forecastCapacity(timeframe);
    
    // Emit signal for capacity forecast update
    signalBus.emitSignal(SIGNAL.CAPACITY_FORECAST_UPDATED, {
      timeframe: timeframe,
      forecast: forecast.forecastedCapacity,
      recommendations: forecast.recommendations
    }, {
      severity: SEVERITY.INFO,
      source: 'system_administration_routes',
      correlationId: requestId(req)
    });
    
    res.json(forecast);
  } catch (error) {
    logger.error('systemAdministrationRoutes:forecastCapacity', { error: error.message });
    return fail(req, res, error, 'forecastCapacity');
  }
});

// Detect security threats
router.post('/security/threats/detect', ...writeAdmin, async (req, res) => {
  try {
    const detection = await systemAdministrationService.detectSecurityThreats();
    
    // Emit signal for security threats if found
    if (detection.threats && detection.threats.length > 0) {
      signalBus.emitSignal(SIGNAL.SECURITY_THREAT_DETECTED, {
        scanId: detection.scanId,
        threats: detection.threats,
        riskLevel: detection.riskLevel
      }, {
        severity: detection.riskLevel === 'high' ? SEVERITY.CRITICAL : SEVERITY.WARNING,
        source: 'system_administration_routes',
        correlationId: requestId(req)
      });
    }
    
    res.json(detection);
  } catch (error) {
    logger.error('systemAdministrationRoutes:detectSecurityThreats', { error: error.message });
    return fail(req, res, error, 'detectSecurityThreats');
  }
});

// Get system health dashboard
router.get('/dashboard/health', ...admin, async (req, res) => {
  try {
    const dashboard = await systemAdministrationService.getSystemHealthDashboard();
    res.json(dashboard);
  } catch (error) {
    logger.error('systemAdministrationRoutes:getSystemHealthDashboard', { error: error.message });
    return fail(req, res, error, 'getSystemHealthDashboard');
  }
});

// Perform automated maintenance
router.post('/maintenance/automated', ...writeAdmin, async (req, res) => {
  try {
    const result = await systemAdministrationService.performAutomatedMaintenance();
    res.json(result);
  } catch (error) {
    logger.error('systemAdministrationRoutes:performAutomatedMaintenance', { error: error.message });
    return fail(req, res, error, 'performAutomatedMaintenance');
  }
});

module.exports = router;
