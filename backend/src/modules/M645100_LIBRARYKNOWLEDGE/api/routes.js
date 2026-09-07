/**
 * Library Knowledge API routes.
 */

'use strict';

// This file lives outside backend/ (a "plug-and-play module" per
// backend/src/routes/libraryRoutes.js), so a bare require('express') can't
// find backend/node_modules from here via normal upward resolution -
// "Cannot find module 'express'" the first time any test actually required
// this file transitively (via src/index.js -> libraryRoutes.js), which was
// most of the 21 failing Jest suites in this repo's first real CI run.
// Resolve explicitly from backend/, where express is actually installed.
const path = require('path');
const express = require(require.resolve('express', { paths: [path.join(__dirname, '..', '..', '..', 'backend')] }));
const { singleton: libraryKnowledgeService } = require('../backend/service');

const router = express.Router();

router.post('/initialize', async (req, res) => {
  const result = await libraryKnowledgeService.execute('initialize', req.body || {});
  res.status(result.success ? 200 : 500).json(result);
});

router.get('/statistics', async (req, res) => {
  const result = await libraryKnowledgeService.execute('statistics');
  res.status(result.success ? 200 : 500).json(result);
});

router.get('/verify', async (req, res) => {
  const result = await libraryKnowledgeService.execute('verify');
  res.status(result.success ? 200 : 500).json(result);
});

router.get('/search', async (req, res) => {
  const result = await libraryKnowledgeService.execute('search', {
    query: req.query.query || req.query.q || '',
    type: req.query.type
  });
  res.status(result.success ? 200 : 500).json(result);
});

router.get('/modules', async (req, res) => {
  const result = await libraryKnowledgeService.execute('modules', req.query || {});
  res.status(result.success ? 200 : 500).json(result);
});

router.get('/modules/:moduleId', async (req, res) => {
  const result = await libraryKnowledgeService.execute('getModule', {
    moduleId: req.params.moduleId
  });
  res.status(result.success ? 200 : 404).json(result);
});

router.post('/ai-context', async (req, res) => {
  const result = await libraryKnowledgeService.execute(
    'aiContext',
    { query: req.body?.query || '', limit: req.body?.limit },
    req.body?.context || {}
  );
  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
