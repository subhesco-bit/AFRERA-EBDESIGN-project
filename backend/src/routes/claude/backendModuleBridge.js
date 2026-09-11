/**
 * Generic REST bridge for backend/src/modules/M### services.
 * Exposes the real exported operations under /api/v1/backend-modules.
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
  if (!/^M\d{3}$/.test(moduleId)) return null;
  const svcPath = path.join(__dirname, '../../modules', moduleId, 'service.js');
  let mod;
  try {
    mod = require(svcPath);
  } catch (error) {
    moduleCache.set(moduleId, null);
    return null;
  }
  moduleCache.set(moduleId, mod);
  return mod;
}

function callableOperations(mod) {
  return Object.keys(mod || {}).filter(key => typeof mod[key] === 'function');
}

function deriveArguments(fn, id, payload) {
  if (id !== undefined) return fn.length >= 2 ? [id, payload] : [id];
  if (fn.length < 2) return [payload];

  // Legacy module clients often send an operation's entity identifier in the
  // request body instead of the URL (e.g. { villageId, ...resourceData }).
  // Only adapt this shape when there is exactly one unambiguous identifier
  // key; otherwise fail instead of guessing and calling real business logic
  // with the wrong argument order.
  const body = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const idKeys = Object.keys(body).filter(key => /(?:^id$|Id$|_id$)/.test(key));
  if (idKeys.length !== 1) {
    const error = new Error('Operation requires two arguments. Supply the entity id in the URL or exactly one id field in the request payload.');
    error.statusCode = 400;
    throw error;
  }
  const idKey = idKeys[0];
  const first = body[idKey];
  const second = { ...body };
  delete second[idKey];
  return [first, second];
}

async function handle(req, res) {
  const { moduleId, operation, id } = req.params;
  const mod = loadModule(moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${moduleId}` });

  const fn = mod[operation];
  if (typeof fn !== 'function') {
    return res.status(404).json({
      success: false,
      error: `Unknown operation "${operation}" on ${moduleId}`,
      available: callableOperations(mod),
    });
  }

  const correlationId = req.get('x-correlation-id') || `module-${moduleId}-${Date.now()}`;
  try {
    await recordBestEffort({ moduleId, operation, eventType: 'started', actorUserId: req.user.id, entityId: id, correlationId, payload: { method: req.method } });
    const payload = req.method === 'GET' ? req.query : req.body;
    const data = await fn(...deriveArguments(fn, id, payload));
    await recordBestEffort({ moduleId, operation, eventType: 'completed', actorUserId: req.user.id, entityId: id, correlationId, payload: { method: req.method } });
    signalBus.emitSignal(`${moduleId.toLowerCase()}.${operation}.completed`, { moduleId, operation, entityId: id }, { source: 'backendModuleBridge', correlationId, entityId: id });
    return res.json({ success: true, data, provenance: { moduleId, operation, correlationId, implementation: 'real-module-service' } });
  } catch (error) {
    await recordBestEffort({ moduleId, operation, eventType: 'failed', actorUserId: req.user?.id, entityId: id, correlationId, errorCode: error.code, payload: { method: req.method } });
    return res.status(error.statusCode || 500).json({ success: false, error: error.message, correlationId });
  }
}

router.get('/:moduleId/contract', rateLimiters.api, authMiddleware, (req, res) => {
  const mod = loadModule(req.params.moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${req.params.moduleId}` });
  return res.json({ success: true, data: buildModuleContract(req.params.moduleId, mod) });
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
      sessionId: req.headers['x-session-id'] || `module-${req.params.moduleId}-${req.user.id}`,
    });
    return res.json({ success: true, data: { module: contract, advisory, decision_mode: contract.decision_mode, executes_commands: false } });
  } catch (error) {
    return res.status(503).json({ success: false, error: 'AI advisory unavailable' });
  }
});

router.post('/:moduleId/ai-decision', rateLimiters.api, authMiddleware, async (req, res) => {
  const { moduleId } = req.params;
  const mod = loadModule(moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${moduleId}` });
  const { question, operation, context } = req.body || {};
  const contract = buildModuleContract(moduleId, mod);
  const operationExists = operation === undefined || (typeof operation === 'string' && typeof mod[operation] === 'function');
  if (typeof question !== 'string' || question.trim().length === 0 || question.length > 4000 || !operationExists ||
      (context !== undefined && (context === null || typeof context !== 'object' || Array.isArray(context)))) {
    return res.status(400).json({ success: false, error: 'question, operation, or context is invalid' });
  }
  try {
    const decision = await claudeAICoordinator.coordinateAIRequest({
      requestType: 'module_decision',
      query: question,
      context: { module_contract: contract, operation_context: { operation, context: context || {} } },
      userId: req.user.id,
      sessionId: req.headers['x-session-id'] || `module-${moduleId}-${req.user.id}`,
    });
    const hasCommandOperations = contract.operations.some(item => item.kind === 'command');
    return res.json({
      success: true,
      data: {
        module_contract: contract,
        decision,
        decision_mode: contract.decision_mode,
        executes_commands: false,
        human_approval_required: hasCommandOperations,
        provenance: { coordinator: 'claudeAICoordinator', request_type: 'module_decision', module_id: moduleId },
      },
    });
  } catch (error) {
    return res.status(503).json({ success: false, error: 'AI decision unavailable' });
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

router.get('/:moduleId', rateLimiters.api, authMiddleware, (req, res) => {
  const mod = loadModule(req.params.moduleId);
  if (!mod) return res.status(404).json({ success: false, error: `No backend module found for ${req.params.moduleId}` });
  return res.json({ success: true, moduleId: req.params.moduleId, operations: callableOperations(mod), implementation: 'real-module-service' });
});

router.__ebdesign = {
  contract: 'backend-module-bridge-v2',
  canonicalMount: '/api/v1/backend-modules',
  realServiceDispatch: true,
  authenticationRequired: true,
  fakeSuccessStubs: false,
};

module.exports = router;
