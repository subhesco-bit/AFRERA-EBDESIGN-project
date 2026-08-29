/**
 * Generic REST bridge for backend/src/modules/M0XX (the plain function-export
 * family). Exposes whatever real operations a module actually has, under its
 * own real function names - never invents a CRUD shape a module doesn't have.
 *
 * Mounted per-module at /api/v1/backend-modules/:moduleId/:operation/:id?.
 * GET maps query params to the function's object argument; POST/PUT/DELETE
 * map the body. The optional :id path segment covers the common
 * fn(id) / fn(id, payload) shape (e.g. getOrchard(id), updateOrchard(id,
 * payload)) that a single merged-body argument can't express - dispatch is
 * based on the real function's arity (Function.length), not guessed per
 * module, so this works generically across every module without per-module
 * mapping code. An unknown operation returns the real list of what's
 * callable, same contract as the Claude AI module registry's execute()
 * endpoint - this is the same underlying code path, just reachable via a
 * conventional REST verb for frontend pages that were built expecting one.
 */

'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimiters } = require('../../middleware/rateLimit');

const moduleCache = new Map();

function loadModule(moduleId) {
  if (moduleCache.has(moduleId)) return moduleCache.get(moduleId);
  if (!/^M\d+$/.test(moduleId)) return null;
  const svcPath = path.join(__dirname, '../../modules', moduleId, 'service.js');
  let mod;
  try {
    mod = require(svcPath);
  } catch (e) {
    moduleCache.set(moduleId, null);
    return null;
  }
  moduleCache.set(moduleId, mod);
  return mod;
}

async function handle(req, res) {
  const { moduleId, operation, id } = req.params;
  const mod = loadModule(moduleId);
  if (!mod) {
    return res.status(404).json({ success: false, error: `No backend module found for ${moduleId}` });
  }
  const fn = mod[operation];
  if (typeof fn !== 'function') {
    const available = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    return res.status(404).json({
      success: false,
      error: `Unknown operation "${operation}" on ${moduleId}. Available: ${available.join(', ')}`
    });
  }
  try {
    const body = req.method === 'GET' ? req.query : req.body;
    let args;
    if (id !== undefined) {
      // fn(id) or fn(id, payload) depending on real arity - never fn(object)
      // when the real function expects a bare id string.
      args = fn.length >= 2 ? [id, body] : [id];
    } else {
      args = [body];
    }
    const data = await fn(...args);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

router.get('/:moduleId/:operation/:id', rateLimiters.api, authMiddleware, handle);
router.get('/:moduleId/:operation', rateLimiters.api, authMiddleware, handle);
router.post('/:moduleId/:operation/:id', rateLimiters.api, authMiddleware, handle);
router.post('/:moduleId/:operation', rateLimiters.api, authMiddleware, handle);
router.put('/:moduleId/:operation/:id', rateLimiters.api, authMiddleware, handle);
router.put('/:moduleId/:operation', rateLimiters.api, authMiddleware, handle);
router.delete('/:moduleId/:operation/:id', rateLimiters.api, authMiddleware, handle);
router.delete('/:moduleId/:operation', rateLimiters.api, authMiddleware, handle);

// Lists which operations actually exist on a module - lets a frontend page
// discover real function names instead of guessing.
router.get('/:moduleId', rateLimiters.api, authMiddleware, (req, res) => {
  const mod = loadModule(req.params.moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${req.params.moduleId}` });
  res.json({ success: true, operations: Object.keys(mod).filter(k => typeof mod[k] === 'function') });
});

module.exports = router;
