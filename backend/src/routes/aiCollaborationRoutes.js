/**
 * Root AI collaboration routes for Devin-Claude handoff state.
 * SECURITY: All routes require authentication + Claude API verification
 */

'use strict';

const express = require('express');
const aiCollaborationService = require('../services/claude/aiCollaborationService');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Verify Claude API is configured
const ensureClaudeConfigured = (req, res, next) => {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: 'Claude API not configured. Set ANTHROPIC_API_KEY in backend/.env',
      code: 'CLAUDE_API_NOT_CONFIGURED'
    });
  }
  next();
};

// Rate limiting for handoff operations
const handoffLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many handoff requests, please try again later',
});

// Apply authentication to all routes
router.use(authMiddleware);
router.use(ensureClaudeConfigured);

router.get('/context', async (req, res) => {
  try {
    const context = await aiCollaborationService.getSharedContext();
    res.json({ success: true, data: context });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/context', async (req, res) => {
  try {
    const context = await aiCollaborationService.updateSharedContext(req.body || {});
    res.json({ success: true, data: context });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/log-work', async (req, res) => {
  try {
    const { ai_source: aiSource, work_data: workData } = req.body || {};
    if (!aiSource || !workData) {
      return res.status(400).json({ success: false, error: 'ai_source and work_data are required' });
    }
    const entry = await aiCollaborationService.logWork(aiSource, workData);
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/work-history/:aiSource', async (req, res) => {
  try {
    const history = await aiCollaborationService.getWorkHistory(
      req.params.aiSource,
      parseInt(req.query.limit, 10) || 20,
    );
    res.json({ success: true, data: { ai_source: req.params.aiSource, work_history: history, count: history.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/continuable/:currentAI', async (req, res) => {
  try {
    const work = await aiCollaborationService.getContinuableWork(req.params.currentAI);
    res.json({ success: true, data: { current_ai: req.params.currentAI, continuable_work: work, count: work.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handoff operations require additional rate limiting
router.post('/handoff', handoffLimiter, async (req, res) => {
  try {
    const { from_ai: fromAI, to_ai: toAI, work_data: workData } = req.body || {};
    if (!fromAI || !toAI || !workData) {
      return res.status(400).json({ success: false, error: 'from_ai, to_ai, and work_data are required' });
    }
    const handoff = await aiCollaborationService.createHandoff(fromAI, toAI, workData);
    res.json({ success: true, data: handoff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/handoff/:handoffId/accept', handoffLimiter, async (req, res) => {
  try {
    const acceptingAI = req.body?.accepting_ai;
    if (!acceptingAI) {
      return res.status(400).json({ success: false, error: 'accepting_ai is required' });
    }
    const handoff = await aiCollaborationService.acceptHandoff(req.params.handoffId, acceptingAI);
    res.json({ success: true, data: handoff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/handoffs/pending/:forAI', async (req, res) => {
  try {
    const handoffs = await aiCollaborationService.getPendingHandoffs(req.params.forAI);
    res.json({ success: true, data: { for_ai: req.params.forAI, pending_handoffs: handoffs, count: handoffs.length } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await aiCollaborationService.getCollaborationStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/report', async (req, res) => {
  try {
    const report = await aiCollaborationService.generateCollaborationReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
