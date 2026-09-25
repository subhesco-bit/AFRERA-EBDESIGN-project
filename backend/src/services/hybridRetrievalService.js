'use strict';

const crypto = require('crypto');
const { singleton: defaultKnowledgeService } = require('../../../modules/M645100_LIBRARYKNOWLEDGE/backend/service');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_RRF_K = 60;
const FEATURE_DIMENSIONS = 256;

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function stableFeatureIndex(token, dimensions = FEATURE_DIMENSIONS) {
  const digest = crypto.createHash('sha256').update(token).digest();
  return digest.readUInt32BE(0) % dimensions;
}

function hashedVector(text, dimensions = FEATURE_DIMENSIONS) {
  const vector = new Array(dimensions).fill(0);
  const terms = tokenize(text);
  for (const term of terms) vector[stableFeatureIndex(term, dimensions)] += 1;
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0)) || 1;
  return vector.map((value) => value / norm);
}

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aa += a[index] * a[index];
    bb += b[index] * b[index];
  }
  if (!aa || !bb) return 0;
  return dot / (Math.sqrt(aa) * Math.sqrt(bb));
}

function normalizeLimit(limit) {
  const parsed = Number(limit || DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

class HybridRetrievalService {
  constructor(options = {}) {
    this.knowledgeService = options.knowledgeService || defaultKnowledgeService;
    this.vectorProvider = options.vectorProvider || null;
    this.rrfK = Number(options.rrfK || DEFAULT_RRF_K);
    this._cacheKey = null;
    this._documents = [];
    this._documentFrequency = new Map();
    this._averageLength = 1;
  }

  async ensureReady() {
    await this.knowledgeService.ensureInitialized();
    const cacheKey = [
      this.knowledgeService.index.size,
      this.knowledgeService.contentHashes.size,
      this.knowledgeService.indexingWarnings.length,
    ].join(':');
    if (cacheKey !== this._cacheKey) {
      this._rebuildCorpus();
      this._cacheKey = cacheKey;
    }
  }

  _rebuildCorpus() {
    const docs = [];
    const df = new Map();

    for (const [key, item] of this.knowledgeService.index.entries()) {
      const fields = this._extractFields(key, item);
      const tokens = tokenize(fields.searchText);
      const counts = new Map();
      for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
      for (const token of new Set(tokens)) df.set(token, (df.get(token) || 0) + 1);

      docs.push({
        key,
        item,
        fields,
        tokens,
        termCounts: counts,
        tokenLength: Math.max(tokens.length, 1),
      });
    }

    this._documents = docs;
    this._documentFrequency = df;
    this._averageLength = docs.length
      ? docs.reduce((sum, doc) => sum + doc.tokenLength, 0) / docs.length
      : 1;
  }

  _extractFields(key, item) {
    const data = item.data || {};
    const name = data.name || data.ModuleName || data.moduleId || data.module_id || key;
    const description = data.description || data.aiContext || data.discovery?.aiContext || '';
    const capabilities = [
      ...(data.capabilities || []),
      ...(data.discovery?.capabilities || []),
      ...(data.discovery?.keywords || []),
    ].filter(Boolean);
    const category = data.category || data.domain || data.Domain || '';
    const status = data.status || data.Status || '';
    const relativePath = data.relativePath || item.path || '';

    return {
      name: String(name),
      description: String(description),
      capabilities: capabilities.map(String),
      category: String(category),
      status: String(status),
      relativePath: String(relativePath),
      searchText: [
        key,
        item.type,
        name,
        description,
        category,
        status,
        relativePath,
        capabilities.join(' '),
      ].join(' '),
    };
  }

  _filterDocuments(filters = {}) {
    return this._documents.filter((doc) => {
      const { item, fields } = doc;
      if (filters.type && item.type !== filters.type) return false;
      if (filters.category && fields.category !== String(filters.category)) return false;
      if (filters.status && fields.status !== String(filters.status)) return false;
      if (filters.pathPrefix && !fields.relativePath.replace(/\\/g, '/').startsWith(String(filters.pathPrefix))) return false;
      return true;
    });
  }

  _bm25(queryTerms, docs) {
    const totalDocs = Math.max(this._documents.length, 1);
    const k1 = 1.5;
    const b = 0.75;
    return docs.map((doc) => {
      let score = 0;
      for (const term of queryTerms) {
        const tf = doc.termCounts.get(term) || 0;
        if (!tf) continue;
        const df = this._documentFrequency.get(term) || 0;
        const idf = Math.log(1 + ((totalDocs - df + 0.5) / (df + 0.5)));
        const denom = tf + k1 * (1 - b + b * (doc.tokenLength / this._averageLength));
        score += idf * ((tf * (k1 + 1)) / denom);
      }
      return { key: doc.key, score };
    }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  }

  _fieldScore(query, queryTerms, docs) {
    const q = String(query || '').toLowerCase().trim();
    return docs.map((doc) => {
      const { fields } = doc;
      let score = 0;
      const name = fields.name.toLowerCase();
      const description = fields.description.toLowerCase();
      const capabilityText = fields.capabilities.join(' ').toLowerCase();
      const pathText = fields.relativePath.toLowerCase();

      if (q && name === q) score += 10;
      if (q && name.startsWith(q)) score += 6;
      if (q && name.includes(q)) score += 4;
      if (q && capabilityText.includes(q)) score += 5;
      if (q && description.includes(q)) score += 2.5;
      if (q && pathText.includes(q)) score += 2;
      for (const term of queryTerms) {
        if (name.includes(term)) score += 1.5;
        if (capabilityText.includes(term)) score += 1.25;
        if (description.includes(term)) score += 0.5;
      }

      return { key: doc.key, score };
    }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  }

  _graphScore(queryTerms, docs) {
    const matchedModuleIds = new Set();
    const moduleById = new Map();

    for (const doc of docs) {
      const data = doc.item.data || {};
      const moduleId = data.moduleId || data.module_id;
      if (moduleId) moduleById.set(String(moduleId).toLowerCase(), doc);
      const haystack = [moduleId, doc.fields.name, ...doc.fields.capabilities].join(' ').toLowerCase();
      if (queryTerms.some((term) => haystack.includes(term)) && moduleId) matchedModuleIds.add(String(moduleId).toLowerCase());
    }

    const scored = [];
    for (const doc of docs) {
      const data = doc.item.data || {};
      const moduleId = String(data.moduleId || data.module_id || '').toLowerCase();
      const dependencies = (data.dependencies?.modules || []).map((value) => String(value).toLowerCase());
      let score = 0;

      if (moduleId && matchedModuleIds.has(moduleId)) score += 2;
      score += dependencies.filter((dep) => matchedModuleIds.has(dep)).length * 1.5;

      for (const matchedId of matchedModuleIds) {
        const matchedDoc = moduleById.get(matchedId);
        const reverseDeps = (matchedDoc?.item?.data?.dependencies?.modules || []).map((value) => String(value).toLowerCase());
        if (moduleId && reverseDeps.includes(moduleId)) score += 1;
      }

      if (score > 0) scored.push({ key: doc.key, score });
    }
    return scored.sort((a, b) => b.score - a.score);
  }

  async _semanticScore(query, docs, candidateKeys) {
    const candidateDocs = docs.filter((doc) => candidateKeys.has(doc.key)).slice(0, 150);
    if (!candidateDocs.length) return { mode: 'none', results: [] };

    if (this.vectorProvider && typeof this.vectorProvider.embedTexts === 'function') {
      const texts = [query, ...candidateDocs.map((doc) => doc.fields.searchText)];
      const vectors = await this.vectorProvider.embedTexts(texts);
      if (Array.isArray(vectors) && vectors.length === texts.length) {
        const [queryVector, ...docVectors] = vectors;
        return {
          mode: 'embedding-provider',
          results: candidateDocs.map((doc, index) => ({
            key: doc.key,
            score: cosine(queryVector, docVectors[index]),
          })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score),
        };
      }
    }

    const queryVector = hashedVector(query);
    return {
      mode: 'hashed-vector-fallback',
      results: candidateDocs.map((doc) => ({
        key: doc.key,
        score: cosine(queryVector, hashedVector(doc.fields.searchText)),
      })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score),
    };
  }

  _rrf(channels) {
    const fused = new Map();
    for (const [channel, entries] of Object.entries(channels)) {
      entries.forEach((entry, index) => {
        const current = fused.get(entry.key) || { key: entry.key, score: 0, channels: {} };
        const contribution = 1 / (this.rrfK + index + 1);
        current.score += contribution;
        current.channels[channel] = {
          rank: index + 1,
          rawScore: entry.score,
          rrfContribution: contribution,
        };
        fused.set(entry.key, current);
      });
    }
    return [...fused.values()].sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  }

  async search(query, options = {}) {
    await this.ensureReady();
    const cleanQuery = String(query || '').trim();
    if (!cleanQuery) throw new Error('query is required');
    if (cleanQuery.length > 500) throw new Error('query must be at most 500 characters');

    const limit = normalizeLimit(options.limit);
    const queryTerms = [...new Set(tokenize(cleanQuery))];
    const docs = this._filterDocuments(options.filters || options);
    const lexical = this._bm25(queryTerms, docs);
    const field = this._fieldScore(cleanQuery, queryTerms, docs);
    const graph = this._graphScore(queryTerms, docs);

    const candidateKeys = new Set([
      ...lexical.slice(0, 150).map((entry) => entry.key),
      ...field.slice(0, 150).map((entry) => entry.key),
      ...graph.slice(0, 150).map((entry) => entry.key),
    ]);
    if (!candidateKeys.size) docs.slice(0, 150).forEach((doc) => candidateKeys.add(doc.key));

    const semantic = await this._semanticScore(cleanQuery, docs, candidateKeys);
    const fused = this._rrf({ lexical, field, semantic: semantic.results, graph });
    const byKey = new Map(docs.map((doc) => [doc.key, doc]));

    const results = fused.slice(0, limit).map((entry) => {
      const doc = byKey.get(entry.key);
      const hashRecord = this.knowledgeService.contentHashes.get(entry.key);
      return {
        key: entry.key,
        type: doc.item.type,
        name: doc.fields.name,
        description: doc.fields.description,
        category: doc.fields.category || null,
        status: doc.fields.status || null,
        path: doc.item.path,
        relevance: entry.score,
        channels: entry.channels,
        provenance: {
          contentHash: hashRecord?.hash || null,
          fileSize: hashRecord?.size ?? doc.item.fileSize ?? null,
          lastModified: doc.item.lastModified || null,
          source: 'library-knowledge-index',
        },
        data: options.includeData === true ? doc.item.data : undefined,
      };
    });

    return {
      success: true,
      query: cleanQuery,
      mode: semantic.mode === 'embedding-provider' ? 'hybrid-embedding' : 'hybrid-deterministic',
      semanticMode: semantic.mode,
      rrfK: this.rrfK,
      filters: options.filters || {},
      totalCorpusItems: docs.length,
      returned: results.length,
      results,
    };
  }

  async explain(query, options = {}) {
    const result = await this.search(query, { ...options, includeData: false });
    return {
      ...result,
      explanation: {
        channels: {
          lexical: 'BM25-style token relevance over canonical library fields',
          field: 'Exact/prefix/name/capability/description/path weighting',
          semantic: result.semanticMode === 'embedding-provider'
            ? 'Cosine similarity from configured embedding provider'
            : 'Deterministic hashed-vector cosine fallback; no external model required',
          graph: 'Module dependency and reverse-dependency relevance',
        },
        fusion: 'Reciprocal Rank Fusion (RRF)',
        noLLMRequiredForRanking: true,
      },
    };
  }

  health() {
    return {
      status: 'healthy',
      service: 'hybridRetrievalService',
      semanticProviderConfigured: Boolean(this.vectorProvider),
      deterministicFallback: true,
      corpusItems: this._documents.length,
      rrfK: this.rrfK,
    };
  }
}

module.exports = HybridRetrievalService;
module.exports.createService = (options) => new HybridRetrievalService(options);
module.exports.singleton = new HybridRetrievalService();
module.exports.tokenize = tokenize;
module.exports.hashedVector = hashedVector;
module.exports.cosine = cosine;
