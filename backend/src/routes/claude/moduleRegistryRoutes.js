/**
 * Claude AI <-> plug-and-play module registry bridge.
 *
 * Exposes the existing ModuleRegistry (src/core/moduleRegistry.js) over HTTP so
 * Claude-facing callers can discover, load, execute, and health-check any of the
 * modules under the repo-root `modules/` directory generically, instead of each
 * capability needing its own hand-wired route. Does not duplicate the registry -
 * this is a thin HTTP shim over the one existing ModuleRegistry instance.
 */

'use strict';

const express = require('express');
const router = express.Router();
const ModuleRegistry = require('../../core/moduleRegistry');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimiters } = require('../../middleware/rateLimit');

const registry = new ModuleRegistry();
let initPromise = null;

function ensureInitialized() {
  if (!initPromise) {
    initPromise = registry.initialize().catch(error => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

router.get('/discover', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const { query = '', ...context } = req.query;
    const result = await registry.discover(query, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    res.json({ success: true, data: registry.getStatistics() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/loaded', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    res.json({ success: true, data: registry.getLoadedModules() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:moduleId/load', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    let result = await registry.load(req.params.moduleId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:moduleId/execute', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const { operation, parameters = {}, context = {} } = req.body || {};
    if (!operation) {
      return res.status(400).json({ success: false, error: 'operation is required' });
    }
    let result = await registry.execute(req.params.moduleId, operation, parameters, context);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:moduleId/health', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    let result = await registry.getHealth(req.params.moduleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
