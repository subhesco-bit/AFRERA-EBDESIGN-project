/**
 * AI Brain Routes
 * 
 * API endpoints for cognitive processing capabilities including:
 * - Cognitive cycle execution
 * - Knowledge management
 * - Cognitive state monitoring
 * - Learning and adaptation
 * - Reasoning and inference
 */

const express = require('express');
const router = express.Router();
const aiBrainService = require('../services/aiBrainService');

/**
 * Execute full cognitive cycle
 * POST /api/ai-brain/cycle
 */
router.post('/cycle', async (req, res) => {
  try {
    const { input, context, goals, constraints } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'input is required'
      });
    }
    
    const result = await aiBrainService.executeCognitiveCycle(
      input,
      context || {},
      goals || [],
      constraints || {}
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error executing cognitive cycle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute perception process
 * POST /api/ai-brain/perception
 */
router.post('/perception', async (req, res) => {
  try {
    const { input, context } = req.body;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'input is required'
      });
    }
    
    const result = await aiBrainService.perceptionProcess(input, context || {});
    
    res.json(result);
  } catch (error) {
    console.error('Error in perception process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute attention process
 * POST /api/ai-brain/attention
 */
router.post('/attention', async (req, res) => {
  try {
    const { perception, goals } = req.body;
    
    if (!perception) {
      return res.status(400).json({
        success: false,
        error: 'perception is required'
      });
    }
    
    const result = await aiBrainService.attentionProcess(perception, goals || []);
    
    res.json(result);
  } catch (error) {
    console.error('Error in attention process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute reasoning process
 * POST /api/ai-brain/reasoning
 */
router.post('/reasoning', async (req, res) => {
  try {
    const { attention, knowledge } = req.body;
    
    if (!attention) {
      return res.status(400).json({
        success: false,
        error: 'attention is required'
      });
    }
    
    const result = await aiBrainService.reasoningProcess(attention, knowledge || {});
    
    res.json(result);
  } catch (error) {
    console.error('Error in reasoning process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute learning process
 * POST /api/ai-brain/learning
 */
router.post('/learning', async (req, res) => {
  try {
    const { experience, outcome } = req.body;
    
    if (!experience || !outcome) {
      return res.status(400).json({
        success: false,
        error: 'experience and outcome are required'
      });
    }
    
    const result = await aiBrainService.learningProcess(experience, outcome);
    
    res.json(result);
  } catch (error) {
    console.error('Error in learning process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute decision process
 * POST /api/ai-brain/decision
 */
router.post('/decision', async (req, res) => {
  try {
    const { reasoning, context, constraints } = req.body;
    
    if (!reasoning) {
      return res.status(400).json({
        success: false,
        error: 'reasoning is required'
      });
    }
    
    const result = await aiBrainService.decisionProcess(
      reasoning,
      context || {},
      constraints || {}
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in decision process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute planning process
 * POST /api/ai-brain/planning
 */
router.post('/planning', async (req, res) => {
  try {
    const { decision, current_state, target_state } = req.body;
    
    if (!decision) {
      return res.status(400).json({
        success: false,
        error: 'decision is required'
      });
    }
    
    const result = await aiBrainService.planningProcess(
      decision,
      current_state || {},
      target_state || {}
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in planning process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add knowledge to knowledge graph
 * POST /api/ai-brain/knowledge
 */
router.post('/knowledge', (req, res) => {
  try {
    const { domain, knowledge } = req.body;
    
    if (!domain || !knowledge) {
      return res.status(400).json({
        success: false,
        error: 'domain and knowledge are required'
      });
    }
    
    aiBrainService.addKnowledge(domain, knowledge);
    
    res.json({
      success: true,
      domain: domain,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error adding knowledge:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get knowledge from knowledge graph
 * GET /api/ai-brain/knowledge/:domain
 */
router.get('/knowledge/:domain', (req, res) => {
  try {
    const { domain } = req.params;
    const knowledge = aiBrainService.getKnowledge(domain);
    
    if (!knowledge) {
      return res.status(404).json({
        success: false,
        error: `Knowledge domain ${domain} not found`
      });
    }
    
    res.json({
      success: true,
      domain: domain,
      knowledge: knowledge
    });
  } catch (error) {
    console.error('Error getting knowledge:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all knowledge domains
 * GET /api/ai-brain/knowledge
 */
router.get('/knowledge', (req, res) => {
  try {
    const knowledge = Array.from(aiBrainService.knowledgeGraph.entries()).map(([domain, data]) => ({
      domain,
      timestamp: data.timestamp,
      confidence: data.confidence
    }));
    
    res.json({
      success: true,
      domains: knowledge
    });
  } catch (error) {
    console.error('Error getting knowledge domains:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get cognitive state
 * GET /api/ai-brain/state
 */
router.get('/state', (req, res) => {
  try {
    const state = aiBrainService.getCognitiveState();
    
    res.json({
      success: true,
      state: state
    });
  } catch (error) {
    console.error('Error getting cognitive state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update context
 * PUT /api/ai-brain/context
 */
router.put('/context', (req, res) => {
  try {
    const context = req.body;
    
    aiBrainService.updateContext(context);
    
    res.json({
      success: true,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear working memory
 * DELETE /api/ai-brain/working-memory
 */
router.delete('/working-memory', (req, res) => {
  try {
    const result = aiBrainService.clearWorkingMemory();
    
    res.json(result);
  } catch (error) {
    console.error('Error clearing working memory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for AI Brain service
 * GET /api/ai-brain/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    knowledge_domains: aiBrainService.knowledgeGraph.size,
    working_memory_size: aiBrainService.workingMemory.size,
    long_term_memory_size: aiBrainService.longTermMemory.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
