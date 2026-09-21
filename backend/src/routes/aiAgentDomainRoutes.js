/**
 * Real backend routes for AIAgentPage.jsx, backed by
 * backend/src/services/aiAgentService.js (a real, complete 540-line
 * multi-agent orchestrator with seeded default agents/tools - NOT the
 * 48-line stub at services/ai/aiAgentService.js, and not
 * services/claude/aiAgentService.js, a different Claude-specific service).
 *
 * Several page method names/shapes differ from the real ones: getTools ->
 * getToolDefinitions, getAgent -> getAgentStatus, executeTask({agent_name,
 * task, context}) -> executeAgentTask(agentName, task, context),
 * registerAgent/registerTool take (name, object) not one merged object,
 * coordinateAgents takes 3 positional args not one object.
 *
 * executeDecision, which the page also calls, has no implementation
 * anywhere - not wired, flagged instead of faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/aiAgentService');

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

router.get('/ai-agent/agents', wrap(() => svc.getAllAgents()));
router.get('/ai-agent/health', wrap(() => ({ status: 'healthy', service: 'aiAgentService' })));
router.get('/ai-agent/tools', wrap(() => svc.getToolDefinitions()));
router.post('/ai-agent/coordinate', wrap((req) => svc.coordinateAgents(req.body.agentNames, req.body.task, req.body.context)));
router.post('/ai-agent/agent/:agentName/clear-memory', wrap((req) => svc.clearAgentMemory(req.params.agentName)));
router.get('/ai-agent/agent/:agentName', wrap((req) => svc.getAgentStatus(req.params.agentName)));
router.post('/ai-agent/agent/:agentName/execute-task', wrap((req) => svc.executeAgentTask(req.params.agentName, req.body.task, req.body.context)));
router.post('/ai-agent/agent', wrap((req) => svc.registerAgent(req.body.name, { description: req.body.description, model: req.body.model, ...req.body })));
router.post('/ai-agent/tool', wrap((req) => svc.registerTool(req.body.name, { description: req.body.description, parameters: req.body.parameters })));
router.put('/ai-agent/agent/:agentName', wrap((req) => svc.updateAgent(req.params.agentName, req.body)));

module.exports = router;
