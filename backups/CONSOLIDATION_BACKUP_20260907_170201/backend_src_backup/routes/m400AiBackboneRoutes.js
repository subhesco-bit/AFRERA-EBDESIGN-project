/**
 * M400 AI Backbone Routes
 *
 * 2026-08-31: wires up a real, substantial (743-line) enterprise AI
 * coordination service that has sat in modules/M400_AI_BACKBONE/backend/
 * service.js completely unreferenced by backend/src since it was written -
 * not a duplicate of the other "AI backbone" module folders (M400_AI_CORE,
 * M401_AI_GATEWAY, M402_AI_ORCHESTRATION are all thin re-export shims that
 * already correctly defer to the real, already-mounted legacy services -
 * see their own file headers), and not the same thing as the already-live
 * backend/src/routes/aiBackboneRoutes.js (that one wraps
 * services/legacy/aiBackboneService.js, a different, real multi-provider
 * AI call router already mounted at /api/v1/ai-backbone) - genuinely
 * orphaned code, mounted here under its own non-colliding path.
 *
 * The service self-creates its own tables (ai_decisions, ai_strategies,
 * ai_intelligence_cache, ai_metrics) idempotently in initialize(), so no
 * separate migration is needed - confirmed by reading initializeDatabase().
 *
 * Mounted admin-only: this coordinates decisions/strategy across modules,
 * not a farmer/consumer-facing surface.
 */

'use strict';

const express = require('express');
const router = express.Router();
const AIBackboneService = require('../../../modules/M400_AI_BACKBONE/backend/service');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

const backbone = new AIBackboneService();
let initPromise = null;

function ensureInitialized() {
  if (!initPromise) {
    initPromise = backbone.initialize({}).then((result) => {
      if (!result || result.success === false) {
        // Allow a retry on the next request rather than caching a failed init forever.
        initPromise = null;
        throw new Error(result?.error?.message || 'AI Backbone failed to initialize');
      }
      return result;
    });
  }
  return initPromise;
}

// GET /api/v1/m400-ai-backbone/health - health check, safe to call before full init
router.get('/health', async (req, res) => {
  try {
    const health = await backbone.healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// POST /api/v1/m400-ai-backbone/execute - generic dispatch matching the service's own
// execute(operation, parameters, context) contract (operations: coordinate,
// decide, strategize, learn, predict, getIntelligence, registerModule, unregisterModule)
router.post('/execute', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const { operation, parameters, context } = req.body || {};
    if (!operation) {
      return res.status(400).json({ success: false, error: 'operation is required' });
    }
    const result = await backbone.execute(operation, parameters || {}, context || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/m400-ai-backbone/coordinate
router.post('/coordinate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const result = await backbone.coordinateAIRequest(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/m400-ai-backbone/decide
router.post('/decide', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const { parameters, context } = req.body || {};
    const result = await backbone.makeEnterpriseDecision(parameters || {}, context || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/m400-ai-backbone/strategize
router.post('/strategize', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const { parameters, context } = req.body || {};
    const result = await backbone.generateEnterpriseStrategy(parameters || {}, context || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/m400-ai-backbone/intelligence - cross-module intelligence cache lookup
router.get('/intelligence', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const result = await backbone.getCrossModuleIntelligence(req.query || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/m400-ai-backbone/modules - register a module with the backbone
router.post('/modules', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const result = await backbone.registerModule(req.body || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/v1/m400-ai-backbone/modules/:moduleId - unregister a module
router.delete('/modules/:moduleId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await ensureInitialized();
    const result = await backbone.unregisterModule({ moduleId: req.params.moduleId });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
