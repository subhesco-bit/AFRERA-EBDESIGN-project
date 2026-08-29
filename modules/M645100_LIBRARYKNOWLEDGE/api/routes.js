/**
 * Library Knowledge API routes.
 */

'use strict';

const express = require('express');
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
