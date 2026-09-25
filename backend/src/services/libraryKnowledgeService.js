/**
 * Root compatibility service for Claude coordinator library enrichment.
 */

'use strict';

const { singleton: libraryKnowledgeService } = require('../../../modules/M645100_LIBRARYKNOWLEDGE/backend/service');
const { singleton: hybridRetrievalService } = require('./hybridRetrievalService');

async function queryLibraryKnowledge(query, options = {}) {
  const results = await libraryKnowledgeService.searchLibrary(query, options);
  return results.slice(0, options.limit || 10).map((item) => ({
    id: item.key,
    type: item.type,
    name: item.data?.name || item.data?.moduleId || item.key,
    description: item.data?.description || item.data?.aiContext || item.path,
    relevance: item.relevance,
    path: item.path,
  }));
}

async function queryHybridLibraryKnowledge(query, options = {}) {
  const result = await hybridRetrievalService.search(query, options);
  return result.results.map((item) => ({
    id: item.key,
    type: item.type,
    name: item.name,
    description: item.description,
    relevance: item.relevance,
    path: item.path,
    channels: item.channels,
    provenance: item.provenance,
  }));
}

module.exports = Object.assign(libraryKnowledgeService, {
  queryLibraryKnowledge,
  queryHybridLibraryKnowledge,
  hybridRetrievalService,
});
