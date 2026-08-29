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

const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');

// Initialize system administration
router.post('/initialize', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await systemAdministrationService.initialize();
    res.json(result);
  } catch (error) {
    logger.error('systemAdministrationRoutes:initialize', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Predict incidents
router.get('/incidents/predict', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const prediction = await systemAdministrationService.predictIncidents(timeframe);
    res.json(prediction);
  } catch (error) {
    logger.error('systemAdministrationRoutes:predictIncidents', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analyze root cause
router.post('/incidents/root-cause', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const analysis = await systemAdministrationService.analyzeRootCause(req.body);
    res.json(analysis);
  } catch (error) {
    logger.error('systemAdministrationRoutes:analyzeRootCause', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger self-healing
router.post('/self-healing', authMiddleware, requireRole("admin"), async (req, res) => {
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
      entityId: req.body.id
    });
    
    res.json(result);
  } catch (error) {
    logger.error('systemAdministrationRoutes:triggerSelfHealing', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Forecast capacity
router.get('/capacity/forecast', authMiddleware, requireRole("admin"), async (req, res) => {
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
      source: 'system_administration_routes'
    });
    
    res.json(forecast);
  } catch (error) {
    logger.error('systemAdministrationRoutes:forecastCapacity', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Detect security threats
router.post('/security/threats/detect', authMiddleware, requireRole("admin"), async (req, res) => {
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
        source: 'system_administration_routes'
      });
    }
    
    res.json(detection);
  } catch (error) {
    logger.error('systemAdministrationRoutes:detectSecurityThreats', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system health dashboard
router.get('/dashboard/health', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const dashboard = await systemAdministrationService.getSystemHealthDashboard();
    res.json(dashboard);
  } catch (error) {
    logger.error('systemAdministrationRoutes:getSystemHealthDashboard', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Perform automated maintenance
router.post('/maintenance/automated', authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await systemAdministrationService.performAutomatedMaintenance();
    res.json(result);
  } catch (error) {
    logger.error('systemAdministrationRoutes:performAutomatedMaintenance', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
