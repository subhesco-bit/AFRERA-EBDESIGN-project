/**
 * Crop Value-Compound Research Service — "when a product is added, AI
 * searches and adds/updates the reference data."
 *
 * READ BEFORE EXTENDING: an LLM asked to recall "what's the curcumin % of
 * turmeric" from memory alone can produce a plausible-sounding but wrong or
 * outdated number — the exact fabrication risk this codebase's discipline
 * exists to prevent. This service instead GROUNDS the AI call in real
 * search results (snippets it must quote from, not invent from), and every
 * row it writes goes in with verified = FALSE — a human must review and
 * confirm it (see reviewSuggestion()) before it is ever used in a
 * customer-facing "why this costs more" claim (nutritionIntelligenceService
 * .calculateValuePerNutrient only reads verified rows — see that file).
 *
 * Same honest not_configured adapter pattern as aiBackboneService.js /
 * productMediaAIService.js: no live search call is placed unless a real
 * provider key is set, and this never blocks product creation.
 */

const fetch = require('node-fetch');
const { getPostgreSQL } = require('../../database\/connection');
const { logger } = require('../../utils\/logger');
const aiBackboneService = require('./aiBackboneService');

const SEARCH_PROVIDER_ENV = {
  bing: { primary: 'BING_SEARCH_API_KEY' },
  serpapi: { primary: 'SERPAPI_KEY' },
};

function searchProviderStatus(providerKey) {
  const env = SEARCH_PROVIDER_ENV[providerKey];
  if (!env) return { provider: providerKey, known: false, configured: false };
  return { provider: providerKey, known: true, envVar: env.primary, configured: Boolean(process.env[env.primary]) };
}

function listSearchProviders() {
  return Object.keys(SEARCH_PROVIDER_ENV).map(searchProviderStatus);
}

async function callBingSearch(query) {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5`, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
  });
  if (!response.ok) throw new Error(`Bing search failed: ${response.status} - ${await response.text()}`);
  const data = await response.json();
  return (data.webPages?.value || []).map((r) => ({ title: r.name, snippet: r.snippet, url: r.url }));
}

async function callSerpApiSearch(query) {
  let apiKey = process.env.SERPAPI_KEY;
  let response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5`);
  if (!response.ok) throw new Error(`SerpAPI search failed: ${response.status} - ${await response.text()}`);
  let data = await response.json();
  return (data.organic_results || []).map((r) => ({ title: r.title, snippet: r.snippet, url: r.link }));
}

async function search(query) {
  if (searchProviderStatus('bing').configured) return callBingSearch(query);
  if (searchProviderStatus('serpapi').configured) return callSerpApiSearch(query);
  const err = new Error('No web search provider is configured (set BING_SEARCH_API_KEY or SERPAPI_KEY)');
  err.code = 'not_configured';
  throw err;
}

const COMPOUND_HINT = {
  CURCUMIN_PCT: 'curcumin content percentage',
  CAPSAICIN_SHU: 'Scoville heat units capsaicin',
  ASTA_COLOR: 'ASTA color value',
  PIPERINE_PCT: 'piperine content percentage',
  GINGEROL_PCT: 'gingerol content percentage',
  CATECHIN_PCT: 'catechin content percentage',
  PRO: 'protein content per 100g',
  IRON: 'iron content per 100g',
};

/**
 * Search for and propose a reference row for one variety + compound.
 * Never writes verified=TRUE — always leaves it for reviewSuggestion().
 * Returns an honest not_configured/no_result status rather than a guess
 * when search or extraction can't produce a real, cited answer.
 */
async function researchValueCompound(varietyName, compoundKey) {
  const hint = COMPOUND_HINT[compoundKey];
  if (!hint) throw new Error(`Unknown compound_key: ${compoundKey}`);

  const results = await search(`${varietyName} ${hint} published research`);
  if (results.length === 0) {
    return { status: 'no_search_results', variety_name: varietyName, compound_key: compoundKey };
  }

  const snippetBlock = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`).join('\n\n');
  const prompt = `You are extracting a published reference range for "${varietyName}" — specifically its ${hint}.
Here are real web search results (use ONLY information explicitly stated in them; do not use outside knowledge):

${snippetBlock}

If the results state a numeric range or value for this, respond with ONLY this JSON (no other text):
{"typical_min": <number or null>, "typical_max": <number or null>, "unit": "<unit string>", "source_url": "<the exact URL from the result that supports this>", "notes": "<one sentence, quoting or closely paraphrasing the supporting snippet>"}
If none of the results actually state a number for this, respond with ONLY: {"not_found": true}`;

  let aiResult;
  try {
    aiResult = await aiBackboneService.callAI(prompt, { maxTokens: 400, temperature: 0.1 });
  } catch (aiError) {
    return { status: 'ai_not_configured', variety_name: varietyName, compound_key: compoundKey, message: aiError.message, raw_search_results: results };
  }

  let parsed;
  try {
    parsed = JSON.parse(aiResult.content.trim());
  } catch {
    return { status: 'unparseable_ai_response', variety_name: varietyName, compound_key: compoundKey, raw_response: aiResult.content };
  }

  if (parsed.not_found) {
    return { status: 'not_found_in_results', variety_name: varietyName, compound_key: compoundKey };
  }

  const pg = getPostgreSQL();
  const { rows } = await pg.query(
    `INSERT INTO crop_value_compound_reference
       (variety_name, compound_key, typical_min, typical_max, unit, notes, source_type, source_url, last_verified_date, verified)
     VALUES ($1, $2, $3, $4, $5, $6, 'published_study', $7, CURRENT_DATE, FALSE)
     ON CONFLICT (variety_name, compound_key, source_url) DO NOTHING
     RETURNING *`,
    [varietyName, compoundKey, parsed.typical_min, parsed.typical_max, parsed.unit || 'unknown', parsed.notes || null, parsed.source_url]
  );

  logger.info('AI-suggested crop value compound reference saved (unverified)', { varietyName, compoundKey });
  return { status: 'suggested_pending_review', variety_name: varietyName, compound_key: compoundKey, row: rows[0] || null };
}

/** Best-effort, non-blocking: called from product/variety creation, never throws upward. */
async function researchOnProductAdded(varietyName, compoundKeys) {
  for (const key of compoundKeys) {
    researchValueCompound(varietyName, key).catch((error) =>
      logger.warn('Crop value research failed (non-blocking)', { varietyName, compoundKey: key, error: error.message })
    );
  }
}

async function getPendingSuggestions() {
  let pg = getPostgreSQL();
  const { rows } = await pg.query(
    `SELECT * FROM crop_value_compound_reference WHERE verified = FALSE ORDER BY created_at DESC`
  );
  return rows;
}

async function reviewSuggestion(id, approve, userId) {
  let pg = getPostgreSQL();
  if (approve) {
    const { rows } = await pg.query(
      `UPDATE crop_value_compound_reference SET verified = TRUE, verified_by = $1, verified_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [userId, id]
    );
    return rows[0];
  }
  await pg.query(`DELETE FROM crop_value_compound_reference WHERE id = $1`, [id]);
  return { deleted: true, id };
}

module.exports = {
  listSearchProviders,
  researchValueCompound,
  researchOnProductAdded,
  getPendingSuggestions,
  reviewSuggestion,
};



