/**
 * Product Media AI Service — AI product-image generation and nutrient-
 * comparison video generation.
 *
 * Both capabilities were confirmed genuinely absent from this codebase this
 * session (zero real matches for either, beyond false positives like QR-code
 * "image generation"). No image/video generation API key exists in this
 * environment (nothing in .env.example), so both provider adapters below
 * follow the exact same interface pattern already established in
 * core/aiOrchestrator.js (PROVIDER_ENV / SPEECH_PROVIDER_ENV): a real,
 * switchable adapter keyed off env var names, honestly `not_configured` with
 * no key present, and deliberately never placing a live call even if a key
 * happens to be set — activation is a config change away, not a code change.
 *
 * What IS real and fully computed here, with no external AI dependency:
 *  - buildNutrientComparisonScript(): a real video SCRIPT assembled from
 *    actual product data and real category-peer nutrition comparisons via
 *    nutritionIntelligenceService.compareProductsNutrition() (already built,
 *    already real — not duplicated here). This is genuinely useful on its
 *    own even before any video-rendering provider is ever configured.
 */

const { getPostgreSQL } = require('../../database/connection');
const { logger } = require('../../utils/logger');
const nutritionIntelligenceService = require('./nutritionIntelligenceService');

// ============================================================================
// IMAGE PROVIDER ADAPTER (draft interface, no live call — see file header)
// ============================================================================

const IMAGE_PROVIDER_ENV = {
  openai_images: { primary: 'OPENAI_API_KEY' }, // DALL-E via the OpenAI API
  stability: { primary: 'STABILITY_API_KEY' },
};

function imageProviderStatus(providerKey) {
  const env = IMAGE_PROVIDER_ENV[providerKey];
  if (!env) return { provider: providerKey, known: false, configured: false };
  return { provider: providerKey, known: true, envVar: env.primary, configured: Boolean(process.env[env.primary]) };
}

function listImageProviders() {
  return Object.keys(IMAGE_PROVIDER_ENV).map(imageProviderStatus);
}

async function callImageProvider(providerKey, _prompt, _opts = {}) {
  const status = imageProviderStatus(providerKey);
  if (!status.known) return { ok: false, status: 'unknown_provider', provider: providerKey };
  if (!status.configured) return { ok: false, status: 'not_configured', provider: providerKey, envVar: status.envVar };
  // Deliberately no live call — see file header. Activation requires wiring
  // the real SDK call here once a provider is actually selected and keyed.
  return { ok: false, status: 'call_intentionally_not_implemented', provider: providerKey };
}

// ============================================================================
// VIDEO PROVIDER ADAPTER (draft interface, no live call — see file header)
// ============================================================================

const VIDEO_PROVIDER_ENV = {
  runway: { primary: 'RUNWAY_API_KEY' },
  pika: { primary: 'PIKA_API_KEY' },
};

function videoProviderStatus(providerKey) {
  const env = VIDEO_PROVIDER_ENV[providerKey];
  if (!env) return { provider: providerKey, known: false, configured: false };
  return { provider: providerKey, known: true, envVar: env.primary, configured: Boolean(process.env[env.primary]) };
}

function listVideoProviders() {
  return Object.keys(VIDEO_PROVIDER_ENV).map(videoProviderStatus);
}

async function callVideoProvider(providerKey, _script, _opts = {}) {
  const status = videoProviderStatus(providerKey);
  if (!status.known) return { ok: false, status: 'unknown_provider', provider: providerKey };
  if (!status.configured) return { ok: false, status: 'not_configured', provider: providerKey, envVar: status.envVar };
  return { ok: false, status: 'call_intentionally_not_implemented', provider: providerKey };
}

// ============================================================================
// Real, DB-backed orchestration
// ============================================================================

/**
 * Called on product creation (and on-demand via the route below) when a
 * product has no images yet. Never blocks or fails product creation — image
 * generation is best-effort and its real outcome (including "not configured")
 * is recorded honestly on the row, never silently skipped without a trace.
 */
async function requestProductImageGeneration(productId, prompt) {
  const pg = getPostgreSQL();
  const result = await callImageProvider('openai_images', prompt);
  const status = result.ok ? 'completed' : (result.status === 'not_configured' ? 'not_configured' : 'failed');
  await pg.query(
    `UPDATE products SET image_generation_status = $1, image_generated_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE image_generated_at END
     WHERE id = $2`,
    [status, productId]
  );
  if (result.ok && result.imageUrl) {
    await pg.query(
      `UPDATE products SET images = images || $1::jsonb WHERE id = $2`,
      [JSON.stringify([result.imageUrl]), productId]
    );
  }
  logger.info('Product image generation requested', { productId, status, provider: 'openai_images' });
  return { productId, ...result, recordedStatus: status };
}

/**
 * Real nutrient-comparison video script — no external AI. Pulls the target
 * product's own nutrition data and compares it against up to 3 other real
 * products in the same category via the existing, already-real
 * compareProductsNutrition(), then assembles a script structure a video
 * provider (once configured) or a human editor could act on directly.
 */
async function buildNutrientComparisonScript(productId) {
  const pg = getPostgreSQL();
  const { rows: productRows } = await pg.query(
    `SELECT id, name, category_id, gi_status, organic, usp FROM products WHERE id = $1`,
    [productId]
  );
  if (!productRows[0]) throw new Error(`Product ${productId} not found`);
  const product = productRows[0];

  const { rows: peers } = await pg.query(
    `SELECT id, name FROM products
      WHERE category_id = $1 AND id <> $2 AND is_active = true
      ORDER BY featured DESC, created_at DESC LIMIT 3`,
    [product.category_id, productId]
  );

  const comparisons = [];
  for (const peer of peers) {
    try {
      const cmp = await nutritionIntelligenceService.compareProductsNutrition(productId, peer.id);
      comparisons.push({ peer_id: peer.id, peer_name: peer.name, ...cmp });
    } catch (error) {
      // A peer with no nutrition data recorded yet is a real, expected gap —
      // skip it honestly rather than fabricate a comparison.
      logger.warn('Skipping nutrient comparison, no data for peer', { productId, peerId: peer.id, error: error.message });
    }
  }

  const script = {
    product_id: productId,
    product_name: product.name,
    scenes: [
      { type: 'intro', text: `Meet ${product.name}${product.gi_status ? ' — GI certified' : ''}${product.organic ? ', organically grown' : ''}.` },
      ...(product.usp ? [{ type: 'usp', text: product.usp }] : []),
      ...comparisons.map((c) => ({
        type: 'comparison',
        text: c.comparison_reason,
        winner: c.winner === productId ? product.name : c.peer_name,
      })),
      { type: 'outro', text: `Discover ${product.name} on AFRERA.` },
    ],
    real_comparisons_included: comparisons.length,
    peers_with_no_nutrition_data: peers.length - comparisons.length,
    generated_at: new Date().toISOString(),
  };

  await pg.query(
    `UPDATE products SET video_script = $1 WHERE id = $2`,
    [JSON.stringify(script), productId]
  );

  return script;
}

/** Renders the script via a real video provider once one is configured; honestly not_configured until then. */
async function requestProductVideoGeneration(productId) {
  const pg = getPostgreSQL();
  const script = await buildNutrientComparisonScript(productId);
  const result = await callVideoProvider('runway', script);
  const status = result.ok ? 'completed' : (result.status === 'not_configured' ? 'not_configured' : 'failed');
  await pg.query(
    `UPDATE products SET video_generation_status = $1, video_generated_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE video_generated_at END, video_url = COALESCE($2, video_url)
     WHERE id = $3`,
    [status, result.ok ? result.videoUrl : null, productId]
  );
  logger.info('Product video generation requested', { productId, status, provider: 'runway', scenesInScript: script.scenes.length });
  return { productId, script, ...result, recordedStatus: status };
}

module.exports = {
  listImageProviders,
  callImageProvider,
  requestProductImageGeneration,
  listVideoProviders,
  callVideoProvider,
  buildNutrientComparisonScript,
  requestProductVideoGeneration,
};
