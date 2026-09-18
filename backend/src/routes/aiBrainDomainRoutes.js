/**
 * Real backend routes for AIBrainPage.jsx, backed by
 * services/legacy/aiBrainService.js (NOT services/ai/aiBrainService.js, a
 * 37-line stub).
 *
 * getKnowledgeGraph and getMemoryState wrap the service's exported
 * knowledgeGraph/workingMemory/longTermMemory Maps directly (real data,
 * just needed a serializable getter, not invented). getCognitiveLoad and
 * executeDecision, which the page also calls, have no implementation
 * anywhere - not wired, flagged instead of faked. The processX methods
 * are named <verb>Process in the real service, not process<Noun>, and
 * some page calls pass either a raw payload or a {field: payload} wrapper
 * depending on the action card - handled per real function's actual
 * argument shape.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/aiBrainService');

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

router.get('/ai-brain/knowledge-graph', wrap(() => Array.from(svc.knowledgeGraph.entries())));
router.get('/ai-brain/memory-state', wrap(() => ({
  workingMemory: Array.from(svc.workingMemory.entries()),
  longTermMemory: Array.from(svc.longTermMemory.entries()),
})));
router.post('/ai-brain/attention', wrap((req) => svc.attentionProcess(req.body, req.body.goals || [])));
router.post('/ai-brain/decision', wrap((req) => svc.decisionProcess(req.body)));
router.post('/ai-brain/learning', wrap((req) => svc.learningProcess(
  req.body.experience !== undefined ? req.body.experience : req.body,
  req.body.outcome || {},
)));
router.post('/ai-brain/perception', wrap((req) => svc.perceptionProcess(req.body)));
router.post('/ai-brain/planning', wrap((req) => svc.planningProcess(req.body)));
router.post('/ai-brain/reasoning', wrap((req) => svc.reasoningProcess(
  req.body.attention !== undefined ? req.body.attention : req.body,
  req.body.knowledge || {},
)));
router.get('/ai-brain/cognitive-state', wrap(() => svc.getCognitiveState()));

module.exports = router;
