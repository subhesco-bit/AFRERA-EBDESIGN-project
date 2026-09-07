/**
 * Root compatibility service for Claude coordinator library enrichment.
 */

'use strict';

const { singleton: libraryKnowledgeService } = require('../../../modules/M645100_LIBRARYKNOWLEDGE/backend/service');

async function queryLibraryKnowledge(query, options = {}) {
  const results = await libraryKnowledgeService.searchLibrary(query, options);
  return results.slice(0, options.limit || 10).map((item) => ({
    id: item.key,
    type: item.type,
    name: item.data?.name || item.data?.moduleId || item.key,
    description: item.data?.description || item.data?.aiContext || item.path,
    relevance: item.relevance,
    path: item.path
  }));
}

module.exports = Object.assign(libraryKnowledgeService, {
  queryLibraryKnowledge
});
