/**
 * Real backend routes for ChatInterface.jsx, backed by
 * services/legacy/conversationalAIService.js. createSession ->
 * createConversationSession(userId, domainId, language) (userId filled
 * from auth), getDomains -> getConversationDomains, respond ->
 * generateResponse, endSession -> endConversation (name differences).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/conversationalAIService');

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

router.post('/conversational-ai/session', wrap((req) => svc.createConversationSession(req.user?.id, req.body.domain_id, req.body.language)));
router.get('/conversational-ai/domains', wrap(() => svc.getConversationDomains()));
router.post('/conversational-ai/session/:sessionId/respond', wrap((req) => svc.generateResponse(req.params.sessionId, req.body.userMessage)));
router.post('/conversational-ai/session/:sessionId/end', wrap((req) => svc.endConversation(req.params.sessionId, req.body.resolution_status)));

module.exports = router;
