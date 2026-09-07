'use strict';

const aiGateway = require('./aiGatewayService');

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function scoreFarmer(candidate, requirements = {}) {
  const quantity = number(requirements.quantityKg);
  const available = number(candidate.availableQuantityKg, quantity);
  const eligible = available >= quantity &&
    (!requirements.region || candidate.region === requirements.region) &&
    (!requirements.qualityGrade || candidate.qualityGrade === requirements.qualityGrade) &&
    (!requirements.requiredCertification || (candidate.certifications || []).includes(requirements.requiredCertification));

  if (!eligible) return { farmer: candidate, eligible: false, score: null, reasons: ['Does not satisfy order constraints'] };

  const price = number(candidate.pricePerKg, Number.MAX_SAFE_INTEGER);
  const priceScore = price === Number.MAX_SAFE_INTEGER ? 0 : clamp(100 - price);
  const reliabilityScore = clamp(number(candidate.fulfillmentRate, 0));
  const qualityScore = clamp(number(candidate.qualityScore, 0));
  const distanceScore = clamp(100 - number(candidate.distanceKm, 100));
  const fdiScore = clamp(number(candidate.fdiScore, 0));
  const score = Number((
    fdiScore * 0.25 +
    reliabilityScore * 0.30 +
    qualityScore * 0.20 +
    priceScore * 0.15 +
    distanceScore * 0.10
  ).toFixed(2));

  return {
    farmer: candidate,
    eligible: true,
    score,
    criteria: { fdiScore, reliabilityScore, qualityScore, priceScore, distanceScore },
    reasons: ['Capacity, geography, quality, reliability, price, and distance evaluated'],
  };
}

function selectFarmers(candidates = [], requirements = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { success: false, status: 'no_candidates', ranked: [], constraints: requirements };
  }

  const ranked = candidates
    .map(candidate => scoreFarmer(candidate, requirements))
    .filter(result => result.eligible)
    .sort((left, right) => right.score - left.score);

  return {
    success: true,
    status: ranked.length ? 'ranked' : 'no_eligible_farmers',
    ranked,
    constraints: requirements,
    explainability: {
      method: 'deterministic-feasibility-plus-weighted-score',
      weights: { fdi: 0.25, reliability: 0.30, quality: 0.20, price: 0.15, distance: 0.10 },
      aiMayExplain: true,
      aiMayNotOverrideEligibility: true,
    },
  };
}

function planDelivery({ origin, destination, vehicles = [], storageOptions = [], constraints = {} } = {}) {
  if (!origin || !destination) throw new Error('origin and destination are required');

  const feasibleVehicles = vehicles.filter(vehicle => {
    const capacityOk = number(vehicle.capacityKg) >= number(constraints.weightKg);
    const temperatureOk = !constraints.temperatureRangeC ||
      (number(vehicle.minTemperatureC, -Infinity) <= number(constraints.temperatureRangeC[0], -Infinity) &&
        number(vehicle.maxTemperatureC, Infinity) >= number(constraints.temperatureRangeC[1], Infinity));
    return vehicle.available !== false && capacityOk && temperatureOk;
  });

  const storage = storageOptions
    .filter(option => option.available !== false)
    .filter(option => !constraints.storageType || option.storageType === constraints.storageType)
    .sort((left, right) => number(left.distanceKm, Infinity) - number(right.distanceKm, Infinity));

  return {
    success: true,
    status: feasibleVehicles.length ? 'feasible' : 'no_feasible_vehicle',
    origin,
    destination,
    selectedVehicle: feasibleVehicles[0] || null,
    storageOption: storage[0] || null,
    alternatives: feasibleVehicles.slice(1),
    constraints,
    explainability: {
      method: 'hard-safety-constraints-before-cost-and-distance-ranking',
      aiMayExplain: true,
      aiMayNotOverrideFeasibility: true,
    },
  };
}

async function explainDecision(decision, context = {}) {
  return aiGateway.run({
    moduleId: 'supply-chain',
    capability: 'farmer-selection-and-delivery-routing',
    prompt: `Explain this deterministic supply-chain decision without changing it: ${JSON.stringify(decision)}`,
    context,
  });
}

module.exports = { selectFarmers, planDelivery, explainDecision, scoreFarmer };
