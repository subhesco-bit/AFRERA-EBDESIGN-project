/**
 * Real backend routes for CommunityForumPage.jsx / KnowledgeBasePage.jsx,
 * backed by services/legacy/knowledgeGraphService.js. searchNodes ->
 * searchKnowledgeNodes (name diff).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/knowledgeGraphService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/knowledge-graph/search', wrap((req) => svc.searchKnowledgeNodes(req.query.q, req.query.nodeType)));

module.exports = router;
