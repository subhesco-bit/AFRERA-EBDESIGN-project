/**
 * Nutrition Commerce Intelligence
 * Deterministic pricing/nutrition calculations shared by village and metro flows.
 * Clinical boundary: this service does not diagnose disease or prescribe treatment.
 */

const NUTRIENT_UNITS = new Set(['g', 'mg', 'mcg', 'kcal', 'iu']);

function number(value, name, min = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) throw new Error(`${name} must be a finite number >= ${min}`);
  return n;
}

function normalizePerKg(price, quantity, unit = 'g') {
  const p = number(price, 'price');
  const q = number(quantity, 'quantity', Number.EPSILON);
  const factor = { g: 1000, kg: 1, mg: 1000000, unit: 1 }[String(unit).toLowerCase()];
  if (!factor) throw new Error(`Unsupported quantity unit: ${unit}`);
  return p * factor / q;
}

function nutrientPerKg(amount, quantity, quantityUnit = 'g') {
  const a = number(amount, 'nutrient amount');
  const q = number(quantity, 'quantity', Number.EPSILON);
  const unit = String(quantityUnit).toLowerCase();
  const factor = { g: 1000, kg: 1, mg: 1000000, mcg: 1000000000 }[unit];
  if (!factor) throw new Error(`Unsupported product quantity unit: ${quantityUnit}`);
  return a * factor / q;
}

function calculateProductValue({ price, quantity, quantityUnit = 'g', nutrients = {} }) {
  const pricePerKg = normalizePerKg(price, quantity, quantityUnit);
  const nutrientMetrics = {};
  for (const [name, value] of Object.entries(nutrients || {})) {
    if (!value || typeof value !== 'object' || !NUTRIENT_UNITS.has(String(value.unit || 'g').toLowerCase())) continue;
    const perKg = nutrientPerKg(value.amount, quantity, quantityUnit);
    nutrientMetrics[name] = {
      amountPerPackage: Number(value.amount),
      unit: value.unit || 'g',
      amountPerKg: perKg,
      costPerNutrientUnit: perKg > 0 ? pricePerKg / perKg : null,
    };
  }
  return { pricePerKg, nutrientMetrics };
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
      const amount = Number(value.amount || 0) * units;
      if (!Number.isFinite(amount)) continue;
      nutrients[name] = { amount: (nutrients[name]?.amount || 0) + amount, unit: value.unit || 'g' };
    }
    return { ...item, units, normalizedCost: cost };
  });
  const costPerNutrientUnit = Object.fromEntries(
    Object.entries(nutrients).map(([name, value]) => [name, value.amount > 0 ? totalCost / value.amount : null]),
  );
  return { totalCost, nutrients, costPerNutrientUnit, items: normalizedItems };
}

/** Internal only: never expose this benchmark to customers or producers. */
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

function normalizeMarketOffer({ source, sourceType, product, price, quantity, quantityUnit = 'g', currency = 'INR', capturedAt }) {
  if (!source || !product) throw new Error('source and product are required');
  const capturedAtIso = capturedAt || new Date().toISOString();
  return {
    source: String(source),
    sourceType: sourceType || 'unspecified',
    product: String(product),
    listedPrice: number(price, 'price'),
    quantity: number(quantity, 'quantity', Number.EPSILON),
    quantityUnit,
    currency: String(currency),
    pricePerKg: Number(normalizePerKg(price, quantity, quantityUnit).toFixed(6)),
    capturedAt: capturedAtIso,
    freshnessSeconds: Math.max(0, (Date.now() - new Date(capturedAtIso).getTime()) / 1000),
  };
}

/**
 * Transparent, non-clinical nutrient-coverage score: for each nutrient,
 * how much of its stated target the product/basket provides (capped at
 * 100% per nutrient so one abundant nutrient can't mask a deficiency in
 * another), averaged across nutrients with a target. This is explicitly
 * NOT a clinical adequacy assessment -- see the file header.
 */
function calculateNutritionDensity({ nutrients = {}, targets = {} }) {
  const entries = Object.entries(targets).filter(([name]) => nutrients[name] && Number.isFinite(Number(nutrients[name].amount)));
  if (!entries.length) return { score: 0, methodology: 'target-relative-non-clinical-nutrient-coverage', coverage: {} };

  const coverage = {};
  let total = 0;
  for (const [name, target] of entries) {
    const amount = Number(nutrients[name].amount);
    const targetValue = number(target, `targets.${name}`, Number.EPSILON);
    const ratio = Math.min(1, amount / targetValue);
    coverage[name] = Number(ratio.toFixed(4));
    total += ratio;
  }

  return {
    score: Number((total / entries.length).toFixed(4)),
    methodology: 'target-relative-non-clinical-nutrient-coverage',
    coverage,
  };
}

/**
 * Quality/confidence score for a set of price observations of the same
 * item: flags statistical outliers (>2x the median) as unusable for
 * pricing decisions, and scores confidence by sample size and price
 * stability (coefficient of variation) among the retained observations.
 */
function priceObservationQuality(observations) {
  if (!Array.isArray(observations) || !observations.length) {
    return { usable: false, excludedOutliers: 0, confidence: 0, retainedCount: 0 };
  }

  const prices = observations.map((o) => number(o.pricePerKg, 'pricePerKg', Number.EPSILON)).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

  const retained = prices.filter((p) => p <= median * 2 && p >= median / 2);
  const excludedOutliers = prices.length - retained.length;

  if (!retained.length) return { usable: false, excludedOutliers, confidence: 0, retainedCount: 0 };

  const mean = retained.reduce((a, b) => a + b, 0) / retained.length;
  const variance = retained.reduce((a, b) => a + (b - mean) ** 2, 0) / retained.length;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

  // More samples and lower price dispersion both raise confidence (0-100).
  const sampleConfidence = Math.min(100, retained.length * 25);
  const stabilityConfidence = Math.max(0, 100 - coefficientOfVariation * 100);
  const confidence = Number(((sampleConfidence + stabilityConfidence) / 2).toFixed(2));

  return {
    usable: retained.length > 0,
    excludedOutliers,
    confidence,
    retainedCount: retained.length,
    median: Number(median.toFixed(6)),
  };
}

module.exports = { normalizePerKg, nutrientPerKg, calculateProductValue, calculateBasket, benchmarkInternalValue, normalizeMarketOffer, calculateNutritionDensity, priceObservationQuality };
