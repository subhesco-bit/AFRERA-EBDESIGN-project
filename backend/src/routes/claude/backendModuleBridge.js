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
const { buildModuleContract } = require('../../core/moduleContract');
const claudeAICoordinator = require('../../core/claudeAICoordinator');
const { signalBus } = require('../../core/signalBus');
const { recordBestEffort } = require('../../services/moduleEventService');

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
    const correlationId = req.get('x-correlation-id') || `module-${moduleId}-${Date.now()}`;
    await recordBestEffort({ moduleId, operation, eventType: 'started', actorUserId: req.user.id, entityId: id, correlationId, payload: { method: req.method } });
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
    await recordBestEffort({ moduleId, operation, eventType: 'completed', actorUserId: req.user.id, entityId: id, correlationId, payload: { method: req.method } });
    signalBus.emitSignal(`${moduleId.toLowerCase()}.${operation}.completed`, { moduleId, operation, entityId: id }, { source: 'backendModuleBridge', correlationId, entityId: id });
    res.json({ success: true, data });
  } catch (error) {
    await recordBestEffort({ moduleId, operation, eventType: 'failed', actorUserId: req.user?.id, entityId: id, correlationId: req.get('x-correlation-id') || `module-${moduleId}-${Date.now()}`, errorCode: error.code, payload: { method: req.method } });
    res.status(500).json({ success: false, error: error.message });
  }
}

router.get('/:moduleId/contract', rateLimiters.api, authMiddleware, (req, res) => {
  const mod = loadModule(req.params.moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${req.params.moduleId}` });
  res.json({ success: true, data: buildModuleContract(req.params.moduleId, mod) });
});

router.post('/:moduleId/ai-advisory', rateLimiters.api, authMiddleware, async (req, res) => {
  const mod = loadModule(req.params.moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${req.params.moduleId}` });
  const contract = buildModuleContract(req.params.moduleId, mod);
  if (!req.body?.question || typeof req.body.question !== 'string' || req.body.question.length > 4000) {
    return res.status(400).json({ success: false, error: 'question is required and must be at most 4000 characters' });
  }
  try {
    const advisory = await claudeAICoordinator.coordinateAIRequest({
      requestType: 'module_advisory',
      query: req.body.question,
      context: { module_contract: contract, operation_context: req.body.context || {} },
      userId: req.user.id,
      sessionId: req.headers['x-session-id'] || `module-${req.params.moduleId}-${req.user.id}`
    });
    res.json({ success: true, data: { module: contract, advisory, decision_mode: contract.decision_mode, executes_commands: false } });
  } catch (error) {
    res.status(503).json({ success: false, error: 'AI advisory unavailable' });
  }
});

router.post('/:moduleId/ai-decision', rateLimiters.api, authMiddleware, async (req, res) => {
  const { moduleId } = req.params;
  const mod = loadModule(moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${moduleId}` });

  const { question, operation, context } = req.body || {};
  const contract = buildModuleContract(moduleId, mod);
  const operationExists = operation === undefined || (
    typeof operation === 'string' && typeof mod[operation] === 'function'
  );
  if (typeof question !== 'string' || question.trim().length === 0 || question.length > 4000 ||
      !operationExists ||
      (context !== undefined && (context === null || typeof context !== 'object' || Array.isArray(context)))) {
    return res.status(400).json({ success: false, error: 'question, operation, or context is invalid' });
  }

  try {
    const decision = await claudeAICoordinator.coordinateAIRequest({
      requestType: 'module_decision',
      query: question,
      context: {
        module_contract: contract,
        operation_context: { operation, context: context || {} }
      },
      userId: req.user.id,
      sessionId: req.headers['x-session-id'] || `module-${moduleId}-${req.user.id}`
    });
    const hasCommandOperations = contract.operations.some(item => item.kind === 'command');
    res.json({
      success: true,
      data: {
        module_contract: contract,
        decision,
        decision_mode: contract.decision_mode,
        executes_commands: false,
        human_approval_required: hasCommandOperations,
        provenance: {
          coordinator: 'claudeAICoordinator',
          request_type: 'module_decision',
          module_id: moduleId
        }
      }
    });
  } catch (error) {
    res.status(503).json({ success: false, error: 'AI decision unavailable' });
  }
});

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
