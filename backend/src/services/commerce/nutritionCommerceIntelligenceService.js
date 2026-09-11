/**
 * Nutrition Commerce Intelligence
 * Shared deterministic engine for village households and metro commerce.
 * Clinical boundary: calculations and education only; no diagnosis or treatment.
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
  const factor = { g: 1000, kg: 1, mg: 1000000, mcg: 1000000000 }[String(quantityUnit).toLowerCase()];
  if (!factor) throw new Error(`Unsupported product quantity unit: ${quantityUnit}`);
  return a * factor / q;
}

function calculateProductValue({ price, quantity, quantityUnit = 'g', nutrients = {} }) {
  const pricePerKg = normalizePerKg(price, quantity, quantityUnit);
  const nutrientMetrics = {};
  for (const [name, value] of Object.entries(nutrients || {})) {
    if (!value || typeof value !== 'object') continue;
    const unit = String(value.unit || 'g').toLowerCase();
    if (!NUTRIENT_UNITS.has(unit)) continue;
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

// Normalizes observations supplied by approved marketplace/API connectors.
// No assumption is made that a website may be scraped without permission.
function normalizeMarketOffer({ source, product, price, quantity, quantityUnit = 'g', capturedAt }) {
  if (!source || !product) throw new Error('source and product are required');
  return {
    source: String(source),
    product: String(product),
    listedPrice: number(price, 'price'),
    quantity: number(quantity, 'quantity', Number.EPSILON),
    quantityUnit,
    pricePerKg: Number(normalizePerKg(price, quantity, quantityUnit).toFixed(6)),
    capturedAt: capturedAt || new Date().toISOString(),
  };
}

module.exports = { normalizePerKg, nutrientPerKg, calculateProductValue, calculateBasket, benchmarkInternalValue, normalizeMarketOffer };
