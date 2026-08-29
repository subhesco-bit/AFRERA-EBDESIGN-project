/**
 * Wikipedia Knowledge Reference Service.
 *
 * Real integration with Wikipedia's public REST API (no API key required —
 * Wikimedia's REST API is free for reasonable, attributed use). Used to pull
 * real encyclopedic reference material for crops, livestock breeds, pests,
 * and traditional-wellness topics the platform discusses, instead of the
 * platform inventing descriptive text itself.
 *
 * Etiquette (Wikimedia API policy requires a descriptive User-Agent
 * identifying the application and a contact point — not optional):
 * External docs: https://meta.wikimedia.org/wiki/User-Agent_policy
 *
 * Scope: read-only reference lookups. Never used to fabricate agronomic or
 * medical claims — see nutritionIntelligenceService.js / wellness_natural_practices
 * for the platform's own sourced data; this service supplements with real,
 * cited external summaries and always returns the source URL so the caller
 * can show attribution.
 */

'use strict';

const axios = require('axios');
const { logger } = require('../../utils/logger');

const USER_AGENT = 'AFRERA-Platform/1.0 (rural-economy-erp; contact: subhesco@gmail.com)';
const API_BASE = 'https://en.wikipedia.org';
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — encyclopedic summaries change rarely

// Simple in-memory TTL cache. No DB table needed: this is a pass-through
// cache for an external, publicly-cited source, not platform-owned data.
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { value, storedAt: Date.now() });
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
});

/**
 * Finds the best-matching Wikipedia page title for a free-text query using
 * the real Wikipedia search API (action=query&list=search).
 * Returns null (not a guess) if no result is found.
 */
async function findBestTitle(query) {
  if (!query || !query.trim()) throw new Error('query is required');
  const cacheKey = `search:${query.trim().toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await client.get('/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: 1,
        format: 'json',
        origin: '*',
      },
    });
    const hits = response.data?.query?.search || [];
    const title = hits.length > 0 ? hits[0].title : null;
    setCached(cacheKey, title);
    return title;
  } catch (error) {
    logger.warn('Wikipedia search failed', { query, error: error.message });
    return null;
  }
}

/**
 * Fetches the real Wikipedia page summary for an exact title via the REST
 * summary endpoint. Returns null (not fabricated) on 404 or network failure
 * — callers must handle "no reference found" honestly.
 */
async function getSummaryByTitle(title) {
  if (!title || !title.trim()) throw new Error('title is required');
  const cacheKey = `summary:${title.trim().toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await client.get(`/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    const data = response.data;
    const summary = {
      title: data.title,
      extract: data.extract,
      description: data.description || null,
      thumbnailUrl: data.thumbnail?.source || null,
      sourceUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      lastFetchedAt: new Date().toISOString(),
      source: 'wikipedia',
    };
    setCached(cacheKey, summary);
    return summary;
  } catch (error) {
    if (error.response?.status === 404) {
      setCached(cacheKey, null);
      return null;
    }
    logger.warn('Wikipedia summary fetch failed', { title, error: error.message });
    return null;
  }
}

/**
 * Convenience: free-text query -> search for best title -> fetch its real
 * summary. Returns null (never a fabricated fallback) if nothing is found.
 */
async function lookup(query) {
  const title = await findBestTitle(query);
  if (!title) return null;
  return getSummaryByTitle(title);
}

module.exports = {
  lookup,
  findBestTitle,
  getSummaryByTitle,
};
