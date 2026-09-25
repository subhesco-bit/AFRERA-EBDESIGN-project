'use strict';

const express = require('express');
const { singleton: hybridRetrievalService } = require('../services/hybridRetrievalService');

const router = express.Router();

router.get('/health', async (req, res, next) => {
  try {
    await hybridRetrievalService.ensureReady();
    res.json({
      success: true,
      ...hybridRetrievalService.health(),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const query = String(req.query.q || req.query.query || '').trim();
    const result = await hybridRetrievalService.search(query, {
      limit: req.query.limit,
      filters: {
        type: req.query.type || undefined,
        category: req.query.category || undefined,
        status: req.query.status || undefined,
        pathPrefix: req.query.pathPrefix || undefined,
      },
    });
    res.json(result);
  } catch (error) {
    if (/query is required|at most 500/.test(error.message)) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.post('/hybrid', async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await hybridRetrievalService.search(body.query, {
      limit: body.limit,
      filters: body.filters || {},
      includeData: body.includeData === true,
    });
    res.json(result);
  } catch (error) {
    if (/query is required|at most 500/.test(error.message)) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.post('/explain', async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await hybridRetrievalService.explain(body.query, {
      limit: body.limit,
      filters: body.filters || {},
    });
    res.json(result);
  } catch (error) {
    if (/query is required|at most 500/.test(error.message)) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

module.exports = router;
