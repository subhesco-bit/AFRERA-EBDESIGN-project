/**
 * Claude AI <-> plug-and-play module registry bridge.
 *
 * Exposes the existing ModuleRegistry (src/core/moduleRegistry.js) over HTTP so
 * Claude-facing callers can discover, load, execute, and health-check any of the
 * modules under the repo-root `modules/` directory generically, instead of each
 * capability needing its own hand-wired route. Does not duplicate the registry -
 * this is a thin HTTP shim over the one existing ModuleRegistry instance.
 *
 * Recovered from the old-new-folder dump — real file, verified its
 * dependencies (core/moduleRegistry.js, modules/M645100_LIBRARYKNOWLEDGE,
 * middleware/rateLimit.js's rateLimiters.api) all exist live; never copied
 * into the live routes/ tree or mounted.
 */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const ModuleRegistry = require('../core/moduleRegistry');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/rateLimit');

// Merged in from routes/claude/moduleRegistryRoutes.js (retired 2026-09-13),
// which shared this filename and so was never mounted.
const modulesDir = path.join(__dirname, '../modules');

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

// Merged in from routes/claude/moduleRegistryRoutes.js. These read module.json
// off disk, which is a different view from the registry's runtime state above:
// they report what a module DECLARES (AI capabilities, whether it ships a
// service.js / routes.js), including modules the registry has never loaded.
//
// Declared before the '/:moduleId/...' patterns so a module literally named
// "health" cannot make '/modules/health' fall through to '/:moduleId/health'.
router.get('/modules', rateLimiters.api, authMiddleware, (req, res) => {
  if (!fs.existsSync(modulesDir)) return res.json({ success: true, data: { modules: [] } });

  const modules = fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const modulePath = path.join(modulesDir, d.name);
      const manifestPath = path.join(modulePath, 'module.json');
      let manifest = null;
      if (fs.existsSync(manifestPath)) {
        try {
          manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch (error) {
          // A malformed manifest is reported as absent rather than failing the
          // whole listing — one bad module should not hide the other 600.
          manifest = null;
        }
      }
      return {
        name: d.name,
        description: manifest?.description || 'No description',
        version: manifest?.version || '1.0.0',
        hasAI: manifest?.ai?.enabled || false,
        aiCapabilities: manifest?.ai?.capabilities || [],
        hasService: fs.existsSync(path.join(modulePath, 'service.js')),
        hasRoutes: fs.existsSync(path.join(modulePath, 'routes.js')),
      };
    });

  res.json({ success: true, data: { modules, count: modules.length } });
});

router.get('/modules/:moduleName', rateLimiters.api, authMiddleware, (req, res) => {
  const modulePath = path.join(modulesDir, req.params.moduleName);
  if (!path.resolve(modulePath).startsWith(path.resolve(modulesDir)) || !fs.existsSync(modulePath)) {
    return res.status(404).json({ success: false, error: 'Module not found' });
  }

  const manifestPath = path.join(modulePath, 'module.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      return res.status(500).json({ success: false, error: 'Failed to load module config' });
    }
  }

  res.json({
    success: true,
    data: {
      name: req.params.moduleName,
      description: manifest?.description || 'No description',
      version: manifest?.version || '1.0.0',
      ai: manifest?.ai || { enabled: false, capabilities: [] },
      backend: manifest?.backend || {},
      frontend: manifest?.frontend || {},
    },
  });
});

router.post('/:moduleId/load', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const result = await registry.load(req.params.moduleId);
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
    const result = await registry.execute(req.params.moduleId, operation, parameters, context);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:moduleId/health', rateLimiters.api, authMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const result = await registry.getHealth(req.params.moduleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
