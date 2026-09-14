/**
 * Library Knowledge Routes
 *
 * REST surface for services/libraryKnowledgeService.js, which is a thin
 * compatibility wrapper around modules/M645100_LIBRARYKNOWLEDGE/backend/service.js
 * (see that file for the real indexing/search logic - it indexes every
 * module under modules/, plus library catalogues, so this is how the rest
 * of the repo's tooling and the Claude AI coordinator discover what modules
 * exist and how they relate). Read-only and public, same as other reference
 * data in this codebase (e.g. market prices) - there is nothing here a
 * logged-out client shouldn't see.
 *
 * Workflow this exposes:
 *   1. GET  /              - list indexed modules (optionally filtered)
 *   2. GET  /search        - free-text search across the whole index
 *   3. GET  /discover      - search narrowed to just modules, richer shape
 *   4. GET  /:id           - full detail for one module
 *   5. GET  /:id/dependencies - dependency resolution order for one module
 *   6. POST /ai-context    - build a context bundle for an LLM prompt
 *   7. GET  /meta/stats    - index statistics
 *   8. GET  /meta/health   - health check
 */

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const libraryKnowledgeService = require('../services/libraryKnowledgeService');

function fail(res, error, status = 500) {
  logger.error('Library route failed', { error: error.message });
  res.status(status).json({ success: false, error: error.message });
}

/**
 * GET / - list indexed modules, optionally filtered by ?status=&category=
 */
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;
    const modules = await libraryKnowledgeService.listModules({ status, category });
    res.json({ success: true, data: modules, count: modules.length });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /search?q=&type= - free-text search across the whole library index
 */
router.get('/search', async (req, res) => {
  try {
    const { q = '', type, limit } = req.query;
    const results = await libraryKnowledgeService.searchLibrary(q, { type });
    const bounded = limit ? results.slice(0, Number(limit)) : results;
    res.json({ success: true, data: bounded, count: bounded.length });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /discover?q= - search narrowed to modules, with capabilities/status
 */
router.get('/discover', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const result = await libraryKnowledgeService.discoverModules(q, req.query);
    res.json(result);
  } catch (error) {
    fail(res, error);
  }
});

/**
 * POST /ai-context - build a context bundle for an LLM prompt
 * Body: { query: string, context?: object }
 */
router.post('/ai-context', async (req, res) => {
  try {
    const { query = '', context = {} } = req.body || {};
    const bundle = await libraryKnowledgeService.buildAIContext(query, context);
    res.json({ success: true, data: bundle });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /meta/stats - index statistics
 */
router.get('/meta/stats', async (req, res) => {
  try {
    res.json({ success: true, data: libraryKnowledgeService.getStatistics() });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /meta/health - health check
 */
router.get('/meta/health', async (req, res) => {
  try {
    res.json({ success: true, data: await libraryKnowledgeService.healthCheck() });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * POST /meta/reindex - force a full rebuild of the in-memory index from
 * disk (the index otherwise only builds once, at first use, per process).
 */
router.post('/meta/reindex', async (req, res) => {
  try {
    res.json(await libraryKnowledgeService.reindex());
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /meta/duplicates - files sharing a basename across different
 * backend/src subtrees (routes/services/controllers), hashed so identical
 * copies are distinguished from diverged ones. Report-only - never
 * deletes or merges anything.
 */
router.get('/meta/duplicates', async (req, res) => {
  try {
    res.json({ success: true, data: await libraryKnowledgeService.findDuplicateFilenames() });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /meta/org-chart - Project -> System -> Branch -> Files tree of the
 * whole indexed library, with same-name files under different branches
 * flagged as duplicate:true. Read-only - never renames or moves anything.
 */
router.get('/meta/org-chart', async (req, res) => {
  try {
    res.json({ success: true, data: await libraryKnowledgeService.buildOrgChart() });
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /meta/manifest - read the last-generated manifest (org chart +
 * duplicate report + stats) from disk.
 * POST /meta/manifest - regenerate it now and persist to .ai/library-manifest.json.
 */
router.get('/meta/manifest', async (req, res) => {
  const result = libraryKnowledgeService.getManifest();
  res.status(result.success ? 200 : 404).json(result);
});

router.post('/meta/manifest', async (req, res) => {
  try {
    res.json(await libraryKnowledgeService.generateManifest());
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /:id/dependencies - dependency resolution order for one module
 * (must be registered before GET /:id so it doesn't get swallowed by it)
 */
router.get('/:id/dependencies', async (req, res) => {
  try {
    const result = await libraryKnowledgeService.resolveDependencies(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    fail(res, error);
  }
});

/**
 * GET /:id - full detail for one module
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await libraryKnowledgeService.getModule(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    fail(res, error);
  }
});

module.exports = router;
