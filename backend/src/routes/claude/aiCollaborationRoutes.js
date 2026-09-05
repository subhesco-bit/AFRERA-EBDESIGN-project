/**
 * AI Collaboration Routes
 * API endpoints for Devin-Claude AI collaboration
 */

const express = require('express.js');
const router = express.Router();
const aiCollaborationService = require('../../services/claude/aiCollaborationService.js');

/**
 * Get shared project context
 */
router.get('/context', async (req, res) => {
  try {
    const context = await aiCollaborationService.getSharedContext();
    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update shared context
 */
router.put('/context', async (req, res) => {
  try {
    const updatedContext = await aiCollaborationService.updateSharedContext(req.body);
    res.json({
      success: true,
      data: updatedContext
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Log work from AI
 */
router.post('/log-work', async (req, res) => {
  try {
    const { ai_source, work_data } = req.body;
    
    if (!ai_source || !work_data) {
      return res.status(400).json({
        success: false,
        error: 'ai_source and work_data are required'
      });
    }

    const workEntry = await aiCollaborationService.logWork(ai_source, work_data);
    
    res.json({
      success: true,
      data: workEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get work history for specific AI
 */
router.get('/work-history/:aiSource', async (req, res) => {
  try {
    const { aiSource } = req.params;
    const { limit } = req.query;
    
    const workHistory = await aiCollaborationService.getWorkHistory(aiSource, parseInt(limit) || 20);
    
    res.json({
      success: true,
      data: {
        ai_source: aiSource,
        work_history: workHistory,
        count: workHistory.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get continuable work for AI
 */
router.get('/continuable/:currentAI', async (req, res) => {
  try {
    const { currentAI } = req.params;
    const continuableWork = await aiCollaborationService.getContinuableWork(currentAI);
    
    res.json({
      success: true,
      data: {
        current_ai: currentAI,
        continuable_work: continuableWork,
        count: continuableWork.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create handoff between AIs
 */
router.post('/handoff', async (req, res) => {
  try {
    const { from_ai, to_ai, work_data } = req.body;
    
    if (!from_ai || !to_ai || !work_data) {
      return res.status(400).json({
        success: false,
        error: 'from_ai, to_ai, and work_data are required'
      });
    }

    const handoff = await aiCollaborationService.createHandoff(from_ai, to_ai, work_data);
    
    res.json({
      success: true,
      data: handoff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Accept handoff
 */
router.post('/handoff/:handoffId/accept', async (req, res) => {
  try {
    const { handoffId } = req.params;
    const { accepting_ai } = req.body;
    
    if (!accepting_ai) {
      return res.status(400).json({
        success: false,
        error: 'accepting_ai is required'
      });
    }

    let handoff = await aiCollaborationService.acceptHandoff(handoffId, accepting_ai);
    
    res.json({
      success: true,
      data: handoff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get pending handoffs for AI
 */
router.get('/handoffs/pending/:forAI', async (req, res) => {
  try {
    const { forAI } = req.params;
    const pendingHandoffs = await aiCollaborationService.getPendingHandoffs(forAI);
    
    res.json({
      success: true,
      data: {
        for_ai: forAI,
        pending_handoffs: pendingHandoffs,
        count: pendingHandoffs.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get collaboration statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await aiCollaborationService.getCollaborationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate collaboration report
 */
router.get('/report', async (req, res) => {
  try {
    const report = await aiCollaborationService.generateCollaborationReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
