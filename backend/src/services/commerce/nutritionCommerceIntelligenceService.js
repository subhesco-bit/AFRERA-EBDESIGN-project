/**
 * Nutrition Commerce Intelligence
 * Production-oriented deterministic intelligence shared by village households,
 * professional nutrition workflows and metro commerce.
 * Clinical boundary: calculations/education only; no diagnosis or treatment.
 *
 * Design rule: user-facing nutrition/value data is separated from INTERNAL_PRICING_ONLY
 * rural/metro benchmarking and never returned by buyer/farmer calculations.
 */

const NUTRIENT_UNITS = new Set(['g', 'mg', 'mcg', 'kcal', 'iu']);
const MASS_TO_G = { g: 1, kg: 1000, mg: 0.001, mcg: 0.000001 };

function number(value, name, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) throw new Error(`${name} must be a finite number >= ${min}`);
  return n;
}

function unit(value, name = 'unit') {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function normalizePerKg(price, quantity, quantityUnit = 'g') {
  const p = number(price, 'price');
  const q = number(quantity, 'quantity', Number.EPSILON);
  const u = unit(quantityUnit, 'quantityUnit');
  if (u === 'unit') return p / q;
  if (!MASS_TO_G[u]) throw new Error(`Unsupported quantity unit: ${quantityUnit}`);
  return p * 1000 / (q * MASS_TO_G[u]);
}

function nutrientPerKg(amount, quantity, quantityUnit = 'g') {
  const a = number(amount, 'nutrient amount');
  const q = number(quantity, 'quantity', Number.EPSILON);
  const u = unit(quantityUnit, 'quantityUnit');
  if (!MASS_TO_G[u]) throw new Error(`Unsupported product quantity unit: ${quantityUnit}`);
  return a * 1000 / (q * MASS_TO_G[u]);
}

function calculateProductValue({ price, quantity, quantityUnit = 'g', nutrients = {}, referenceServing = null }) {
  const pricePerKg = normalizePerKg(price, quantity, quantityUnit);
  const nutrientMetrics = {};
  for (const [name, value] of Object.entries(nutrients || {})) {
    if (!value || typeof value !== 'object') continue;
    const nutrientUnit = unit(value.unit || 'g', `nutrients.${name}.unit`);
    if (!NUTRIENT_UNITS.has(nutrientUnit)) continue;
    const perKg = nutrientPerKg(value.amount, quantity, quantityUnit);
    nutrientMetrics[name] = {
      amountPerPackage: Number(value.amount),
      unit: value.unit || 'g',
      amountPerKg: perKg,
      costPerNutrientUnit: perKg > 0 ? pricePerKg / perKg : null,
    };
  }

  const serving = referenceServing && typeof referenceServing === 'object'
    ? {
        quantity: number(referenceServing.quantity, 'referenceServing.quantity', Number.EPSILON),
        unit: unit(referenceServing.unit || 'g', 'referenceServing.unit'),
      }
    : null;

  return {
    pricePerKg,
    nutrientMetrics,
    referenceServing: serving,
    dataQuality: { nutrientFields: Object.keys(nutrientMetrics).length, deterministic: true },
  };
}

function calculateBasket(items) {
  if (!Array.isArray(items) || !items.length) throw new Error('items must contain at least one product');
  let totalCost = 0;
  const nutrients = {};
  const normalizedItems = items.map((item) => {
    const units = number(item.units ?? 1, 'units', Number.EPSILON);
    const cost = number(item.price, 'item.price') * units;
    totalCost += cost;
    for (const [name, value] of Object.entries(item.nutrients || {})) {
      if (!value || typeof value !== 'object') continue;
      const amount = number(value.amount || 0, `nutrients.${name}.amount`) * units;
      const nutrientUnit = value.unit || 'g';
      nutrients[name] = {
        amount: (nutrients[name]?.amount || 0) + amount,
        unit: nutrients[name]?.unit || nutrientUnit,
      };
    }
    return { ...item, units, normalizedCost: cost };
  });
  const costPerNutrientUnit = Object.fromEntries(
    Object.entries(nutrients).map(([name, value]) => [name, value.amount > 0 ? totalCost / value.amount : null]),
  );
  return { totalCost, nutrients, costPerNutrientUnit, items: normalizedItems };
}

/**
 * Produces a transparent, non-clinical nutrition density indicator for ranking.
 * It is deliberately generic: no medical recommendation or disease scoring.
 */
function calculateNutritionDensity({ nutrients = {}, targets = {} }) {
  const contributions = {};
  let score = 0;
  let targetCount = 0;
  for (const [name, target] of Object.entries(targets || {})) {
    const targetValue = number(target, `targets.${name}`, Number.EPSILON);
    const actual = number(nutrients?.[name]?.amount ?? 0, `nutrients.${name}.amount`);
    const ratio = Math.min(actual / targetValue, 1);
    contributions[name] = Number(ratio.toFixed(6));
    score += ratio;
    targetCount += 1;
  }
  return {
    score: targetCount ? Number((score / targetCount).toFixed(6)) : 0,
    contributions,
    methodology: 'target-relative-non-clinical-nutrient-coverage',
  };
}

/**
 * Creates an auditable market observation. Source must come from an approved
 * connector/API/feed; this service does not authorize scraping any website.
 */
function normalizeMarketOffer({ source, product, price, quantity, quantityUnit = 'g', capturedAt, sourceType = 'approved_api', currency = 'INR', availability = 'unknown' }) {
  if (!source || !product) throw new Error('source and product are required');
  const observedAt = capturedAt ? new Date(capturedAt) : new Date();
  if (Number.isNaN(observedAt.getTime())) throw new Error('capturedAt must be a valid date');
  return {
    source: String(source),
    sourceType: String(sourceType),
    product: String(product),
    listedPrice: number(price, 'price'),
    quantity: number(quantity, 'quantity', Number.EPSILON),
    quantityUnit,
    currency: String(currency).toUpperCase(),
    availability: String(availability),
    pricePerKg: Number(normalizePerKg(price, quantity, quantityUnit).toFixed(6)),
    capturedAt: observedAt.toISOString(),
    freshnessSeconds: Math.max(0, Math.floor((Date.now() - observedAt.getTime()) / 1000)),
  };
}

function priceObservationQuality(observations, { maxAgeHours = 48, outlierTolerancePct = 50 } = {}) {
  if (!Array.isArray(observations) || !observations.length) return { confidence: 0, usable: false, reason: 'no_observations' };
  const valid = observations.filter((o) => Number.isFinite(Number(o.pricePerKg)) && Number(o.pricePerKg) > 0);
  if (!valid.length) return { confidence: 0, usable: false, reason: 'no_valid_prices' };
  const now = Date.now();
  const fresh = valid.filter((o) => {
    const t = Date.parse(o.capturedAt);
    return Number.isFinite(t) && (now - t) <= maxAgeHours * 3600000;
  });
  const values = fresh.map((o) => Number(o.pricePerKg)).sort((a, b) => a - b);
  const median = values.length % 2 ? values[(values.length - 1) / 2] : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
  const nonOutlier = fresh.filter((o) => Math.abs(Number(o.pricePerKg) - median) / median * 100 <= outlierTolerancePct);
  const freshnessScore = fresh.length / valid.length;
  const stabilityScore = nonOutlier.length / Math.max(fresh.length, 1);
  const confidence = Number((Math.min(1, (0.5 * freshnessScore) + (0.5 * stabilityScore)) * 100).toFixed(2));
  return {
    confidence,
    usable: nonOutlier.length > 0,
    sampleSize: nonOutlier.length,
    medianPricePerKg: Number(median.toFixed(6)),
    excludedOutliers: fresh.length - nonOutlier.length,
    freshnessScore: Number(freshnessScore.toFixed(6)),
    stabilityScore: Number(stabilityScore.toFixed(6)),
  };
}

// Internal pricing intelligence only. Never expose this benchmark in buyer/farmer APIs.
function benchmarkInternalValue({ rural, metro, nutrientValueWeight = 0.35 }) {
  const ruralCost = number(rural?.landedCostPerKg, 'rural.landedCostPerKg', Number.EPSILON);
  const metroPrice = number(metro?.referencePricePerKg, 'metro.referencePricePerKg', Number.EPSILON);
  const ruralNutrition = number(rural?.nutritionScore ?? 0, 'rural.nutritionScore');
  const metroNutrition = number(metro?.nutritionScore ?? 0, 'metro.nutritionScore');
  const weight = Math.min(1, Math.max(0, Number(nutrientValueWeight)));
  const priceGapPct = ((metroPrice - ruralCost) / ruralCost) * 100;
  const nutritionGap = ruralNutrition - metroNutrition;
  return {
    ruralCostPerKg: ruralCost,
    metroReferencePricePerKg: metroPrice,
    priceGapPct: Number(priceGapPct.toFixed(4)),
    nutritionGap: Number(nutritionGap.toFixed(4)),
    internalValueIndex: Number(((priceGapPct * (1 - weight)) + (nutritionGap * weight)).toFixed(4)),
    visibility: 'INTERNAL_PRICING_ONLY',
  };
}

module.exports = {
  normalizePerKg,
  nutrientPerKg,
  calculateProductValue,
  calculateBasket,
  calculateNutritionDensity,
  normalizeMarketOffer,
  priceObservationQuality,
  benchmarkInternalValue,
};
