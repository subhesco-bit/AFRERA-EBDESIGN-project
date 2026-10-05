/**
 * Unified Claude AI Coordinator — a thin, real coordination layer over the
 * existing core/aiOrchestrator.js engine registry. Does not duplicate
 * aiOrchestrator's dispatch/classification/learning-loop logic; exposes it
 * through a single entry point for routes/unifiedAIRoutes.js.
 */
const orchestrator = require('./aiOrchestrator');
const { logger } = require('../utils/logger');

/**
 * Handle a unified AI request. If `taskType` is given, dispatch deterministically;
 * otherwise classify `query` against the engine registry's keyword map.
 */
async function handleRequest({ taskType, query, payload = {}, actorId } = {}) {
  if (taskType) {
    return orchestrator.route(taskType, payload, { actorId });
  }
  if (query) {
    return orchestrator.classifyAndRoute(query, payload, { actorId });
  }
  return {
    ok: false,
    status: 'invalid_request',
    reason: 'Provide either taskType (exact engine key) or query (free text to classify).',
    availableTaskTypes: Object.keys(orchestrator.ENGINES),
  };
}

function engineCatalog() {
  return orchestrator.listEngines();
}

async function coordinatorHealth() {
  const engines = orchestrator.listEngines();
  const callable = engines.filter((e) => e.callable).length;
  logger.info('claudeAICoordinator health check', { total: engines.length, callable });
  return {
    total_engines: engines.length,
    callable_engines: callable,
    engines,
  };
}

module.exports = { handleRequest, engineCatalog, coordinatorHealth };
