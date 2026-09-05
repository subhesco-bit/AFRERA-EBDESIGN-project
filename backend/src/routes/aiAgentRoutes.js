/**
 * AI Agent Routes
 * 
 * API endpoints for agentic AI capabilities including:
 * - Agent task execution
 * - Multi-agent coordination
 * - Agent management
 * - Tool registration
 * - Agent monitoring
 */

const express = require('express');
const router = express.Router();
const aiAgentService = require('../services/aiAgentService');

/**
 * Execute an agent task
 * POST /api/ai-agent/execute
 */
router.post('/execute', async (req, res) => {
  try {
    const { agent_name, task, context } = req.body;
    
    if (!agent_name || !task) {
      return res.status(400).json({
        success: false,
        error: 'agent_name and task are required'
      });
    }
    
    const result = await aiAgentService.executeAgentTask(agent_name, task, context);
    
    res.json(result);
  } catch (error) {
    console.error('Error executing agent task:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Coordinate multiple agents
 * POST /api/ai-agent/coordinate
 */
router.post('/coordinate', async (req, res) => {
  try {
    const { agent_names, task, context } = req.body;
    
    if (!agent_names || !task) {
      return res.status(400).json({
        success: false,
        error: 'agent_names and task are required'
      });
    }
    
    let result = await aiAgentService.coordinateAgents(agent_names, task, context);
    
    res.json(result);
  } catch (error) {
    console.error('Error coordinating agents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get agent status
 * GET /api/ai-agent/agent/:agent_name
 */
router.get('/agent/:agent_name', (req, res) => {
  try {
    const { agent_name } = req.params;
    const status = aiAgentService.getAgentStatus(agent_name);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: `Agent ${agent_name} not found`
      });
    }
    
    res.json({
      success: true,
      agent: status
    });
  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all agents
 * GET /api/ai-agent/agents
 */
router.get('/agents', (req, res) => {
  try {
    const agents = aiAgentService.getAllAgents();
    
    res.json({
      success: true,
      agents: agents
    });
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Register a new agent
 * POST /api/ai-agent/agent
 */
router.post('/agent', (req, res) => {
  try {
    const { name, description, capabilities, model, system_prompt } = req.body;
    
    if (!name || !description || !model) {
      return res.status(400).json({
        success: false,
        error: 'name, description, and model are required'
      });
    }
    
    aiAgentService.registerAgent(name, {
      description,
      capabilities: capabilities || [],
      model,
      system_prompt: system_prompt || ''
    });
    
    let status = aiAgentService.getAgentStatus(name);
    
    res.json({
      success: true,
      agent: status
    });
  } catch (error) {
    console.error('Error registering agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update agent configuration
 * PUT /api/ai-agent/agent/:agent_name
 */
router.put('/agent/:agent_name', (req, res) => {
  try {
    const { agent_name } = req.params;
    const updates = req.body;
    
    let result = aiAgentService.updateAgent(agent_name, updates);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear agent memory
 * DELETE /api/ai-agent/agent/:agent_name/memory
 */
router.delete('/agent/:agent_name/memory', (req, res) => {
  try {
    const { agent_name } = req.params;
    let result = aiAgentService.clearAgentMemory(agent_name);
    
    res.json(result);
  } catch (error) {
    console.error('Error clearing agent memory:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Register a new tool
 * POST /api/ai-agent/tool
 */
router.post('/tool', (req, res) => {
  try {
    const { name, description, parameters, handler } = req.body;
    
    if (!name || !description || !parameters) {
      return res.status(400).json({
        success: false,
        error: 'name, description, and parameters are required'
      });
    }
    
    aiAgentService.registerTool(name, {
      description,
      parameters,
      handler: handler || (async () => ({ success: true, message: 'Tool executed' }))
    });
    
    res.json({
      success: true,
      tool: { name, description, parameters }
    });
  } catch (error) {
    console.error('Error registering tool:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get available tools
 * GET /api/ai-agent/tools
 */
router.get('/tools', (req, res) => {
  try {
    const tools = Array.from(aiAgentService.tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      parameters: tool.parameters
    }));
    
    res.json({
      success: true,
      tools: tools
    });
  } catch (error) {
    console.error('Error getting tools:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for AI Agent service
 * GET /api/ai-agent/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    agents_count: aiAgentService.agents.size,
    tools_count: aiAgentService.tools.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
