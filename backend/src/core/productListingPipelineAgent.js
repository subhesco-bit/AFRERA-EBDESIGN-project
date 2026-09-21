/**
 * Product Listing Pipeline Agent — farmer lists a product, AI enrichment follows.
 *
 * Strategy Card
 * Purpose:  Run the post-listing enrichment sequence a farmer expects when they
 *           put a product on the platform: understand the product, and if it is
 *           food, value it by its nutrient content rather than by weight alone,
 *           then give it page copy that states that value.
 * Actors:   farmer (human, indirectly — they only create the listing),
 *           marketplace buyers (human, they read the result),
 *           this agent (system).
 * Decision: advisory only. Nothing here changes a price a buyer pays or a
 *           farmer receives; it records recommended pricing and tier for a
 *           human to accept. See ACTION_BOUNDARY.
 * Algorithm: subscribe to commerce.product.listed, then run the stages below in
 *           order, each independently guarded. A stage that cannot run records
 *           why and the sequence continues.
 * Data:     reads the products row carried on the signal; writes through the
 *           existing nutrition/nutrient services, which own their own tables.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every component of this flow already existed and worked, but nothing called
 * them in sequence, so the flow did not happen:
 *
 *   - middleware/productImageAutoGenerationHooks.js exports
 *     registerAutoGenerationHooks(productService) with the comment "Call this
 *     during app initialization". Nothing required or called it.
 *   - That module registers via productService.on('created', ...), but
 *     productService is not an EventEmitter and emits nothing, so the
 *     registration would have silently no-opped behind its own
 *     `typeof productService.on === 'function'` guard even if it had run.
 *   - nutritionIntelligenceService.calculateNutritionPricing had zero callers
 *     anywhere in the codebase.
 *
 * Stage 1 of the flow — AI image generation — is deliberately NOT here.
 * services/productService.js createProduct already fires
 * productMediaAIService.requestProductImageGeneration() best-effort on a
 * product created with no images, and records its real outcome (including
 * "not_configured") on the row. Duplicating it would generate two images.
 *
 * HONESTY RULES
 * -------------
 *  - No stage fabricates. A stage that cannot run returns status 'unavailable'
 *    (dependency absent) or 'skipped' (precondition not met) with a reason.
 *    It never returns a plausible-looking number.
 *  - Food is never guessed. classifyFood() returns isFood: null when the
 *    product data does not say, and the nutrition stages are skipped rather
 *    than assuming.
 *  - A failing stage never fails the farmer's listing. The listing is already
 *    committed before this runs, and signalBus guarantees a throwing subscriber
 *    cannot propagate back into the emitter. Each stage is additionally guarded
 *    so one failure does not abort the others.
 */

const { logger } = require('../utils/logger');
const { signalBus, SIGNAL } = require('./signalBus');

/** This agent recommends; it never authorises a price or a sale. */
const ACTION_BOUNDARY = 'advisory_only';
const PIPELINE_VERSION = '1.0.0';

/** Stage outcome vocabulary. */
const STATUS = Object.freeze({
  OK: 'ok',
  SKIPPED: 'skipped',
  UNAVAILABLE: 'unavailable',
  FAILED: 'failed',
});

/**
 * Services are required lazily inside stages rather than at module load.
 * This file is required from index.js during startup, and the nutrition /
 * nutrient / marketing services each pull in the database and route layers;
 * loading them here would deepen the circular-dependency chain that already
 * produces "Accessing non-existent property of module exports inside circular
 * dependency" warnings at boot.
 */
function lazy(path) {
  return () => require(path);
}
const getNutritionIntelligence = lazy('../services/nutritionIntelligenceService');
const getNutrientValueSales = lazy('../services/nutrientValueSalesService');
const getAiBackbone = lazy('../services/legacy/aiBackboneService');

/**
 * Decide whether this product is food, from what the listing actually states.
 *
 * Returns isFood: null when the data does not say. The caller then SKIPS the
 * nutrient stages instead of assuming, because assuming "food" would attach
 * nutrient pricing to a non-food product, and assuming "not food" would deny a
 * farmer the nutrient premium their produce qualifies for.
 */
function classifyFood(product) {
  const nutrition = product.nutrition_data;
  const hasNutrition =
    nutrition &&
    typeof nutrition === 'object' &&
    !Array.isArray(nutrition) &&
    Object.keys(nutrition).length > 0;

  if (hasNutrition) {
    return { isFood: true, basis: 'nutrition_data present on the listing' };
  }

  const tags = Array.isArray(product.tags) ? product.tags.map((t) => String(t).toLowerCase()) : [];
  if (tags.includes('food') || tags.includes('edible') || tags.includes('produce')) {
    return { isFood: true, basis: 'listing tagged as food/edible/produce' };
  }
  if (tags.includes('non-food') || tags.includes('inedible')) {
    return { isFood: false, basis: 'listing tagged as non-food' };
  }

  return {
    isFood: null,
    basis:
      'listing carries no nutrition_data and no food/non-food tag; not inferred from name or category',
  };
}

/** Extract a nutrient map suitable for calculateNutrientValuePrice(productId, nutrientContent). */
function nutrientContentFrom(product) {
  const nutrition = product.nutrition_data;
  if (!nutrition || typeof nutrition !== 'object' || Array.isArray(nutrition)) return null;
  const keys = Object.keys(nutrition);
  return keys.length > 0 ? nutrition : null;
}

class ProductListingPipelineAgent {
  constructor() {
    this.subscribers = [];
    this.initialized = false;
    this.stats = { runs: 0, stagesOk: 0, stagesSkipped: 0, stagesUnavailable: 0, stagesFailed: 0 };
  }

  initialize() {
    if (this.initialized) {
      logger.warn('ProductListingPipelineAgent already initialized');
      return;
    }
    const sub = signalBus.onSignal(SIGNAL.PRODUCT_LISTED, this.handleProductListed.bind(this));
    this.subscribers.push(sub);
    this.initialized = true;
    logger.info('ProductListingPipelineAgent initialized', {
      subscribedSignals: [SIGNAL.PRODUCT_LISTED],
      pipelineVersion: PIPELINE_VERSION,
      actionBoundary: ACTION_BOUNDARY,
    });
  }

  /** Run one stage, converting any throw into a recorded FAILED outcome. */
  async runStage(name, fn) {
    try {
      const outcome = await fn();
      return { stage: name, ...outcome };
    } catch (error) {
      return {
        stage: name,
        status: STATUS.FAILED,
        reason: error && error.message ? error.message : String(error),
      };
    }
  }

  /**
   * signalBus dispatches the whole signal envelope
   * ({ type, payload, severity, source, entityId, correlationId, timestamp }),
   * not (payload, meta) -- see emitSignal/_safeEmit in core/signalBus.js. The
   * emitted fields therefore live under `signal.payload`, which is the
   * convention core/reflexEngine.js, core/decisionEngine.js and
   * core/effectors.js all follow.
   */
  async handleProductListed(signal = {}) {
    const payload = signal.payload || {};
    const metadata = signal;
    const product = payload.product;
    if (!product || !product.id) {
      logger.warn('ProductListingPipelineAgent: signal carried no product row; nothing to enrich', {
        signal: SIGNAL.PRODUCT_LISTED,
      });
      return;
    }

    const startedAt = new Date().toISOString();
    const t0 = Date.now();
    const stages = [];

    // --- Stage 2: understand the product -----------------------------------
    stages.push(
      await this.runStage('attribute_extraction', async () => {
        const { aiAPI } = getAiBackbone();
        const envelope = await aiAPI.generateRecommendation({
          task: 'product_attribute_extraction',
          parameters: {
            name: product.name,
            description: product.description || null,
            usp: product.usp || null,
            tags: product.tags || [],
            organic: product.organic === true,
            gi_status: product.gi_status === true,
          },
        });
        // The facade already refuses to invent an answer; carry its verdict.
        if (envelope.status === 'unavailable') {
          return { status: STATUS.UNAVAILABLE, reason: envelope.explanation, envelope };
        }
        if (envelope.status !== 'ok') {
          return { status: STATUS.FAILED, reason: envelope.error || envelope.status, envelope };
        }
        return { status: STATUS.OK, envelope };
      }),
    );

    // --- Stage 3: is it food? ----------------------------------------------
    const food = classifyFood(product);
    stages.push({
      stage: 'food_classification',
      status: food.isFood === null ? STATUS.SKIPPED : STATUS.OK,
      isFood: food.isFood,
      basis: food.basis,
    });

    if (food.isFood === true) {
      const nutrientContent = nutrientContentFrom(product);

      // --- Stage 4a: persist the listing's nutrition figures ---------------
      // The downstream stages read from the nutrition tables, not from the
      // products row, so the figures the farmer supplied on the listing have
      // to be recorded first. Without this the score, pricing and
      // value-per-nutrient stages all fail with "nutrition data not found".
      stages.push(
        await this.runStage('nutrition_profile', async () => {
          if (!nutrientContent) {
            return { status: STATUS.SKIPPED, reason: 'listing carries no nutrient figures to record' };
          }
          const svc = getNutritionIntelligence();
          if (typeof svc.addProductNutrition !== 'function') {
            return { status: STATUS.UNAVAILABLE, reason: 'addProductNutrition not available' };
          }
          const profile = await svc.addProductNutrition({
            product_id: product.id,
            nutrition_data: nutrientContent,
            calories_per_serving: nutrientContent.calories_per_serving ?? null,
          });
          return { status: STATUS.OK, profile };
        }),
      );

      // --- Stage 4: nutrition score ---------------------------------------
      stages.push(
        await this.runStage('nutrition_score', async () => {
          const svc = getNutritionIntelligence();
          if (typeof svc.calculateProductNutritionScore !== 'function') {
            return { status: STATUS.UNAVAILABLE, reason: 'calculateProductNutritionScore not available' };
          }
          const score = await svc.calculateProductNutritionScore(product.id);
          return { status: STATUS.OK, score };
        }),
      );

      // --- Stage 5: nutrient-based price ----------------------------------
      stages.push(
        await this.runStage('nutrient_value_price', async () => {
          if (!nutrientContent) {
            return {
              status: STATUS.SKIPPED,
              reason: 'no nutrient content on the listing to price from',
            };
          }
          const svc = getNutrientValueSales();
          const priced = await svc.calculateNutrientValuePrice(product.id, nutrientContent);
          return { status: STATUS.OK, priced };
        }),
      );

      // --- Stage 6: nutrition-adjusted price against the listed base price -
      stages.push(
        await this.runStage('nutrition_pricing', async () => {
          if (product.base_price === null || product.base_price === undefined) {
            return { status: STATUS.SKIPPED, reason: 'listing has no base_price to adjust' };
          }
          const svc = getNutritionIntelligence();
          const pricing = await svc.calculateNutritionPricing(product.id, product.base_price);
          return { status: STATUS.OK, pricing };
        }),
      );

      // --- Stage 7: value per nutrient (the per-unit figure) ---------------
      stages.push(
        await this.runStage('value_per_nutrient', async () => {
          const svc = getNutritionIntelligence();
          if (typeof svc.calculateValuePerNutrient !== 'function') {
            return { status: STATUS.UNAVAILABLE, reason: 'calculateValuePerNutrient not available' };
          }
          const value = await svc.calculateValuePerNutrient(product.id);
          return { status: STATUS.OK, value };
        }),
      );

      // --- Stage 8: premium tier ------------------------------------------
      stages.push(
        await this.runStage('premium_tier', async () => {
          const svc = getNutrientValueSales();
          const tier = await svc.assignNutrientTier(product.id);
          return { status: STATUS.OK, tier };
        }),
      );
    } else {
      const reason =
        food.isFood === false
          ? 'listing is not food'
          : 'food status undetermined and deliberately not inferred';
      for (const stage of [
        'nutrition_profile',
        'nutrition_score',
        'nutrient_value_price',
        'nutrition_pricing',
        'value_per_nutrient',
        'premium_tier',
      ]) {
        stages.push({ stage, status: STATUS.SKIPPED, reason });
      }
    }

    // --- Stage 9: page copy -------------------------------------------------
    stages.push(
      await this.runStage('listing_copy', async () => {
        const { aiAPI } = getAiBackbone();
        const tierStage = stages.find((s) => s.stage === 'premium_tier');
        const envelope = await aiAPI.generateRecommendation({
          task: 'premium_product_page_copy',
          parameters: {
            name: product.name,
            description: product.description || null,
            usp: product.usp || null,
            organic: product.organic === true,
            gi_status: product.gi_status === true,
            gi_certificate_number: product.gi_certificate_number || null,
            is_food: food.isFood,
            nutrient_tier: tierStage && tierStage.status === STATUS.OK ? tierStage.tier : null,
          },
        });
        if (envelope.status === 'unavailable') {
          return { status: STATUS.UNAVAILABLE, reason: envelope.explanation, envelope };
        }
        if (envelope.status !== 'ok') {
          return { status: STATUS.FAILED, reason: envelope.error || envelope.status, envelope };
        }
        return { status: STATUS.OK, envelope };
      }),
    );

    // --- Record -------------------------------------------------------------
    const tally = stages.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    this.stats.runs += 1;
    this.stats.stagesOk += tally[STATUS.OK] || 0;
    this.stats.stagesSkipped += tally[STATUS.SKIPPED] || 0;
    this.stats.stagesUnavailable += tally[STATUS.UNAVAILABLE] || 0;
    this.stats.stagesFailed += tally[STATUS.FAILED] || 0;

    const run = {
      productId: product.id,
      productName: product.name,
      pipelineVersion: PIPELINE_VERSION,
      actionBoundary: ACTION_BOUNDARY,
      startedAt,
      durationMs: Date.now() - t0,
      correlationId: metadata && metadata.correlationId ? metadata.correlationId : null,
      isFood: food.isFood,
      tally,
      stages,
    };

    logger.info('Product listing pipeline complete', {
      productId: run.productId,
      durationMs: run.durationMs,
      tally: run.tally,
    });

    // Let downstream consumers (page composition, search indexing) react without
    // this agent needing to know about them.
    signalBus.emitSignal(SIGNAL.PRODUCT_ENRICHED, { productId: product.id, run }, {
      source: 'productListingPipelineAgent',
    });

    return run;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      pipelineVersion: PIPELINE_VERSION,
      actionBoundary: ACTION_BOUNDARY,
      subscribedSignals: this.initialized ? [SIGNAL.PRODUCT_LISTED] : [],
      stats: { ...this.stats },
    };
  }
}

module.exports = new ProductListingPipelineAgent();
module.exports.ProductListingPipelineAgent = ProductListingPipelineAgent;
module.exports.classifyFood = classifyFood;
module.exports.STATUS = STATUS;
