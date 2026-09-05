/**
 * Routes for realtimeMonitoringService.js — a real, self-contained
 * (in-memory, no DB dependency) resource monitoring/alerting/automation
 * engine that had zero callers anywhere in the app (confirmed via a
 * repo-wide require() cross-reference, 2026-08-28). Nothing else duplicates
 * this capability, so it's exposed directly rather than merged into
 * anything.
 */

'use strict';

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../middleware/roleGroups');
const realtimeMonitoringService = require('../services/legacy/realtimeMonitoringService');

router.post
    // Log request
    logger.debug('router.post request');('/monitors', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { resourceId, config } = req.body || {};
    if (!resourceId) return res.status(400).json({ success: false, error: 'resourceId is required' });
    const monitor = await realtimeMonitoringService.startMonitoring(resourceId, config || {});
    res.status(201).json({ success: true, data: monitor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/monitors', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const monitors = await realtimeMonitoringService.getAllMonitors();
    res.json({ success: true, data: monitors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/monitors/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const status = await realtimeMonitoringService.getMonitoringStatus(req.params.id);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.delete
    // Log request
    logger.debug('router.delete request');('/monitors/:id', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const monitor = await realtimeMonitoringService.stopMonitoring(req.params.id);
    res.json({ success: true, data: monitor });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/health', async (req, res) => {
  try {
    const health = await realtimeMonitoringService.healthCheck();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
