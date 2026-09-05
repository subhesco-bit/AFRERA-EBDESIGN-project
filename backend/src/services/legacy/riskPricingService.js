/**
 * ADVANCE RATE PRICING — forward curves, downside risk, commitment advice.
 *
 * Recovered from afrera_platform_v44.html, where it existed only as browser
 * JavaScript with its coefficients hard-coded. Verified absent from this
 * backend before porting: none of yieldIndex, priceImpact, forwardCurve,
 * basis, valueFloorParticipation or commitAdvice appeared anywhere in
 * backend/src.
 *
 * WHAT THIS IS FOR
 *
 * A farmer with an unharvested crop is asked to commit some of it forward at a
 * floor price. How much is sensible? That depends on weather-driven yield
 * risk, price volatility over the horizon, whether the crop physically
 * survives to the delivery month, and how badly the farmer needs cash now.
 * This module answers that, with a band rather than a single number, and
 * refuses to answer when the model has no business speaking.
 *
 * THREE PROPERTIES CARRIED OVER DELIBERATELY
 *
 * 1. NEVER A SINGLE NUMBER. Every forward price is central/low/high with a
 *    stated confidence band. A point estimate on an unharvested crop invites
 *    a farmer to treat a guess as a promise.
 *
 * 2. SHELF LIFE IS A HARD CONSTRAINT, NOT A WEIGHT. v44 records that an
 *    earlier version treated perishability as one factor among four and
 *    advised holding 34% of a two-week lemon over a one-month horizon — i.e.
 *    advising a farmer to keep something that would be compost. Holding
 *    capacity is now capped by shelf life first; the other factors allocate
 *    only within whatever room is left.
 *
 * 3. IT DECLINES. Below 0.5 confidence the answer is "NO RECOMMENDATION" with
 *    a reason and a list of what would help. A forward commitment is a real
 *    obligation against a harvest that does not exist yet; being confidently
 *    wrong costs someone their season.
 *
 * WHAT CHANGED IN THE PORT
 *
 * Coefficients now come from `arp_crop_parameters` rather than a const literal,
 * so they can be calibrated, audited, and carry provenance. Confidence comes
 * from `arp_district_calibration`, which derives it from how much local data
 * actually exists rather than accepting a number from the caller.
 */

'use strict';

const pool = require('..\/database\/pool');
const { logger } = require('..\/utils\/logger');

const r2 = (n) => Math.round(n * 100) / 100;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Weather defaults used only when a caller supplies nothing — and flagged. */
const WEATHER_FALLBACK = { rainfallMm: 1800, meanTempC: 26, heatDaysAboveThresh: 4, calibrated: false };

async function cropParams(cropKey) {
  const { rows } = await pool.query(
    'SELECT * FROM arp_crop_parameters WHERE crop_key = $1', [cropKey]
  );
  if (!rows.length) throw new Error(`Unknown crop: ${cropKey}`);
  const c = rows[0];
  return {
    key: c.crop_key,
    name: c.display_name,
    optRainMm: Number(c.opt_rain_mm),
    rainTolMm: Number(c.rain_tol_mm),
    optTempC: Number(c.opt_temp_c),
    heatThreshC: Number(c.heat_thresh_c),
    baseYieldTHa: Number(c.base_yield_t_ha),
    storageMonths: Number(c.storage_months),
    perishability: Number(c.perishability),
    volAnnual: Number(c.vol_annual),
    provenance: c.parameter_provenance,
    seasonsOfData: c.seasons_of_data,
  };
}

/**
 * Weather -> expected yield, as a multiplier on the crop's base yield.
 *
 * Rainfall deviation is penalised quadratically (both drought and excess hurt),
 * temperature and heat-stress days linearly. Every coefficient here is an
 * assumption; the returned `drivers` array says what each one contributed so a
 * reader can disagree with a specific term rather than the whole number.
 */
function yieldIndex(c, { rainfallMm, meanTempC, heatDaysAboveThresh = 0 }) {
  const rainDev = (rainfallMm - c.optRainMm) / c.rainTolMm;
  const rainPenalty = clamp(1 - 0.35 * rainDev * rainDev, 0.25, 1.05);
  const tempDev = Math.abs(meanTempC - c.optTempC);
  const tempPenalty = clamp(1 - 0.04 * tempDev, 0.5, 1);
  const heatPenalty = clamp(1 - 0.012 * heatDaysAboveThresh, 0.4, 1);
  const index = r2(rainPenalty * tempPenalty * heatPenalty);

  return {
    index,
    expectedYieldTHa: r2(c.baseYieldTHa * index),
    drivers: [
      { factor: 'rainfall', value: `${rainfallMm} mm vs optimum ${c.optRainMm}`, effect: `${r2((rainPenalty - 1) * 100)}%` },
      { factor: 'mean temperature', value: `${meanTempC}°C vs optimum ${c.optTempC}`, effect: `${r2((tempPenalty - 1) * 100)}%` },
      { factor: 'heat-stress days', value: `${heatDaysAboveThresh} days above ${c.heatThreshC}°C`, effect: `${r2((heatPenalty - 1) * 100)}%` },
    ],
    caveat: c.provenance === 'real'
      ? `Coefficients calibrated on ${c.seasonsOfData} seasons.`
      : 'Coefficients are prototype assumptions, not field-calibrated for this district.',
  };
}

/**
 * Supply/demand shock -> price movement, via elasticity.
 *
 * The note matters as much as the number: a short crop pushes price up, but
 * the farmer also has less to sell, so "prices are up" is not automatically
 * good news for them.
 */
function priceImpact({ yieldIdx, demandIndex = 1.0, elasticity = -0.45 }) {
  const supplyShock = yieldIdx - 1;
  const demandShock = demandIndex - 1;
  const pct = (supplyShock - demandShock) / elasticity;
  return {
    pricePct: r2(pct * 100),
    note: supplyShock < -0.1
      ? 'short crop — upward price pressure, but the farmer has less to sell'
      : supplyShock > 0.1
        ? 'glut risk — downward price pressure; this is when a floor matters most'
        : 'near-normal supply',
    elasticityUsed: elasticity,
    caveat: 'Elasticity is a district-level assumption. NE hill markets are thin '
          + 'and may be far more inelastic than this.',
  };
}

/**
 * Forward price with a band. Volatility scales as sigma * sqrt(t), the standard
 * convention. Perishability adds a carry penalty that storage cannot offset,
 * and beyond shelf life the penalty steepens sharply — a crop past its window
 * is not merely worth less, it is worth close to nothing.
 */
function forwardCurve(c, { spotPerKg, monthsAhead, yieldIdx = 1, demandIndex = 1, confidence = 0.68 }) {
  const impact = priceImpact({ yieldIdx, demandIndex });
  const drift = impact.pricePct / 100;
  const carry = -(c.perishability * Math.min(monthsAhead, c.storageMonths))
              - 0.02 * Math.max(0, monthsAhead - c.storageMonths) * 6;
  const central = spotPerKg * (1 + drift + carry);
  const sigma = c.volAnnual * Math.sqrt(monthsAhead / 12);
  const z = confidence >= 0.95 ? 1.96 : confidence >= 0.9 ? 1.645 : 1.0;

  return {
    crop: c.name,
    monthsAhead,
    spot: r2(spotPerKg),
    central: r2(central),
    low: r2(central * Math.exp(-z * sigma)),
    high: r2(central * Math.exp(z * sigma)),
    band: `${Math.round(confidence * 100)}%`,
    sigmaAnnual: c.volAnnual,
    components: { drift: r2(drift * 100), carry: r2(carry * 100), sigmaHorizon: r2(sigma) },
    priceImpact: impact,
    warning: monthsAhead > c.storageMonths
      ? `${monthsAhead} months exceeds this crop's ${c.storageMonths}-month storage life. `
      + 'The carry penalty reflects physical loss, not market opinion.'
      : null,
  };
}

/**
 * Farmgate-to-delivered spread, decomposed.
 *
 * The residual is the number worth looking at. Freight and loss are legitimate
 * costs; whatever remains is either a quality premium or margin the farmer
 * cannot see.
 */
function basis({ farmgatePerKg, ncrDeliveredPerKg, freightPerKg, expectedLossPct }) {
  const grossBasis = ncrDeliveredPerKg - farmgatePerKg;
  const explained = freightPerKg + ncrDeliveredPerKg * (expectedLossPct / 100);
  const residual = r2(grossBasis - explained);
  return {
    grossBasis: r2(grossBasis),
    explainedByFreightAndLoss: r2(explained),
    unexplainedResidual: residual,
    residualPctOfDelivered: r2((residual / ncrDeliveredPerKg) * 100),
    verdict: Math.abs(residual) < 0.1 * ncrDeliveredPerKg
      ? 'basis is fully explained by freight and loss — the corridor is priced honestly'
      : residual > 0
        ? 'residual margin exists beyond freight and loss — either a quality premium, '
        + 'or value being captured somewhere the farmer cannot see'
        : 'the corridor is being run below cost on this lane',
  };
}

/**
 * Value of a floor price plus a share of the upside.
 *
 * Bachelier-style approximation, and stated as an approximation rather than
 * dressed up as Black-Scholes precision. The farmer is being offered a floor;
 * the question is what the upside participation is actually worth on top.
 */
function valueFloorParticipation(c, { floorPerKg, participationShare, spotPerKg, monthsAhead, qtyKg }) {
  let sigma = c.volAnnual * Math.sqrt(monthsAhead / 12);
  const d = (spotPerKg - floorPerKg) / (spotPerKg * sigma || 1e-9);
  const nd = 0.5 * (1 + Math.tanh(0.8 * d));
  const callPerKg = Math.max(
    0,
    (spotPerKg - floorPerKg) * nd + spotPerKg * sigma * 0.3989 * Math.exp(-0.5 * d * d)
  );
  const farmerValue = floorPerKg + participationShare * callPerKg;
  return {
    floorPerKg: r2(floorPerKg),
    participationShare,
    optionValuePerKg: r2(callPerKg),
    farmerExpectedPerKg: r2(farmerValue),
    farmerExpectedTotal: qtyKg ? Math.round(farmerValue * qtyKg) : null,
    platformCarryPerKg: r2(callPerKg * (1 - participationShare)),
    method: 'Bachelier-style approximation. Adequate for a decision aid; not an '
          + 'exchange-grade option price, and not a tradeable quote.',
  };
}

/**
 * How much to pre-commit. The output a farmer can act on.
 *
 * Declines below 0.5 confidence rather than producing a number, and caps
 * holding by shelf life before any other factor is considered.
 */
function commitAdvice(c, { qtyKg, floorPerKg, participationShare, spotPerKg, monthsAhead, weather, cashUrgency = 0.5, confidence }) {
  const y = yieldIndex(c, weather);
  const fwd = forwardCurve(c, { spotPerKg, monthsAhead, yieldIdx: y.index });
  const val = valueFloorParticipation(c, { floorPerKg, participationShare, spotPerKg, monthsAhead, qtyKg });

  if (confidence < 0.5) {
    return {
      advice: 'NO RECOMMENDATION',
      commitPct: null,
      declinedReason:
        `The yield model for this district is uncalibrated (confidence ${Math.round(confidence * 100)}%). `
        + "Advising a farmer to commit a quantity on this basis would be guessing with someone else's harvest.",
      whatWouldHelp: [
        '3+ seasons of local rainfall and yield data',
        'district-level mandi price history',
        'observed shrinkage on this lane',
      ],
      forward: fwd, valuation: val, yieldModel: y, confidence,
    };
  }

  const downsideRisk = (fwd.central - fwd.low) / fwd.central;
  const floorProtection = clamp((floorPerKg - fwd.low) / (fwd.central - fwd.low || 1e-9), 0, 1);

  // Shelf life first. A crop that does not survive the horizon cannot be held,
  // so holding capacity collapses steeply once the window is exceeded — the
  // fourth power is what stops a 0.5-month lemon being "held" for a month.
  const ratio = c.storageMonths / Math.max(monthsAhead, 0.25);
  const holdFeasible = ratio >= 1 ? 1 : clamp(Math.pow(ratio, 4), 0, 1);
  const maxHold = clamp(holdFeasible, 0, 0.80);
  const minCommit = r2(1 - maxHold);

  let commit = 0.35 + 0.30 * downsideRisk + 0.20 * cashUrgency + 0.15 * floorProtection;
  commit = clamp(commit, Math.max(0.2, minCommit), 0.95);

  return {
    advice: 'INFORMATIONAL — not a hedging instrument and not financial advice',
    commitPct: Math.round(commit * 100),
    commitKg: Math.round(qtyKg * commit),
    holdKg: Math.round(qtyKg * (1 - commit)),
    maxHoldPct: Math.round(maxHold * 100),
    confidence,
    reasoning: [
      { factor: 'downside risk to the forward band', weight: '30%', reading: `${r2(downsideRisk * 100)}% below central` },
      { factor: 'need for cash now', weight: '20%', reading: `${Math.round(cashUrgency * 100)}%` },
      { factor: 'protection already given by the floor', weight: '15%', reading: `${Math.round(floorProtection * 100)}%` },
      {
        factor: 'shelf life vs horizon',
        weight: 'HARD CAP on holding',
        reading: `${c.storageMonths} months storable against a ${monthsAhead}-month horizon — `
               + `holding is capped at ${Math.round(maxHold * 100)}%`,
      },
    ],
    forward: fwd, valuation: val, yieldModel: y,
  };
}

// ---------------------------------------------------------------------------
// Database-facing entry points
// ---------------------------------------------------------------------------

/** Confidence for a district+crop, derived from how much local data exists. */
async function districtConfidence(state, district, cropKey) {
  const { rows } = await pool.query(
    `SELECT confidence, seasons_observed FROM arp_district_calibration
      WHERE state = $1 AND district = $2 AND crop_key = $3`,
    [state, district, cropKey]
  );
  if (!rows.length) {
    // No calibration record is not neutral. It means nobody has ever checked
    // this model against this district, which is the weakest possible standing.
    return { confidence: 0, seasonsObserved: 0, calibrated: false };
  }
  return {
    confidence: Number(rows[0].confidence),
    seasonsObserved: rows[0].seasons_observed,
    calibrated: Number(rows[0].confidence) >= 0.5,
  };
}

/** Compute an advance rate. Does not persist — see publish(). */
async function computeAdvanceRate({ cropKey, monthsAhead, spotPerKg, weather, state, district }) {
  let c = await cropParams(cropKey);
  const w = weather || WEATHER_FALLBACK;
  const cal = await districtConfidence(state, district, cropKey);
  let y = yieldIndex(c, w);
  let fwd = forwardCurve(c, { spotPerKg, monthsAhead, yieldIdx: y.index });
  const deliveryMonth = new Date();
  deliveryMonth.setMonth(deliveryMonth.getMonth() + Math.round(monthsAhead));

  return {
    crop: c.name,
    cropKey,
    monthsAhead,
    deliveryMonth: deliveryMonth.toISOString().slice(0, 10),
    method: 'ARP-v1',
    spot: fwd.spot, central: fwd.central, low: fwd.low, high: fwd.high, band: fwd.band,
    components: fwd.components,
    yieldIndex: y.index,
    confidence: cal.confidence,
    calibrated: cal.calibrated,
    // An advance is only safe against the LOW end of the band, discounted again.
    advanceCeiling: r2(fwd.low * 0.80),
    warning: !cal.calibrated
      ? `Confidence ${Math.round(cal.confidence * 100)}% — this district has `
      + `${cal.seasonsObserved} season(s) of data. This rate is indicative only and `
      + 'must not be used to set a binding advance.'
      : fwd.warning,
    parameterProvenance: c.provenance,
  };
}

/** Persist a computed rate. Immutable once written; supersede rather than edit. */
async function publish(rate, publishedBy = null) {
  const { rows } = await pool.query(
    `INSERT INTO arp_publications
       (crop_key, months_ahead, delivery_month, method, spot_per_kg, central_per_kg,
        low_per_kg, high_per_kg, yield_index, confidence, calibrated, warning,
        components, published_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id, advance_ceiling_per_kg`,
    [rate.cropKey, rate.monthsAhead, rate.deliveryMonth, rate.method, rate.spot,
      rate.central, rate.low, rate.high, rate.yieldIndex, rate.confidence,
      rate.calibrated, rate.warning, JSON.stringify(rate.components), publishedBy]
  );
  return rows[0];
}

/** Full commitment advice for a farmer, persisted so it can be scored later. */
async function adviseCommitment(input) {
  let c = await cropParams(input.cropKey);
  let cal = await districtConfidence(input.state, input.district, input.cropKey);
  const result = commitAdvice(c, {
    ...input,
    weather: input.weather || WEATHER_FALLBACK,
    confidence: cal.confidence,
  });

  try {
    await pool.query(
      `INSERT INTO arp_commit_advice
         (farmer_id, crop_key, qty_kg, floor_per_kg, participation_share, cash_urgency,
          months_ahead, commit_pct, advice, declined_reason, reasoning, max_hold_pct,
          option_value_per_kg, farmer_expected_per_kg, confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [input.farmerId ?? null, input.cropKey, input.qtyKg, input.floorPerKg,
        input.participationShare, input.cashUrgency ?? 0.5, input.monthsAhead,
        result.commitPct, result.advice, result.declinedReason ?? null,
        JSON.stringify(result.reasoning ?? result.whatWouldHelp ?? []),
        result.maxHoldPct ?? null,
        result.valuation?.optionValuePerKg ?? null,
        result.valuation?.farmerExpectedPerKg ?? null,
        cal.confidence]
    );
  } catch (err) {
    // Advice still returns. Failing to record it is a lost lesson, not a lost
    // answer, and the farmer is waiting.
    logger.error('riskPricing:advice_not_recorded', { error: err.message });
  }
  return result;
}

/** Record and decompose an observed farmgate-to-delivered spread. */
async function recordBasis(obs) {
  const computed = basis(obs);
  const { rows } = await pool.query(
    `INSERT INTO arp_basis_observations
       (crop_key, lane, farmgate_per_kg, ncr_delivered_per_kg, freight_per_kg,
        expected_loss_pct, data_provenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, gross_basis, explained_by_freight_and_loss, unexplained_residual`,
    [obs.cropKey, obs.lane ?? null, obs.farmgatePerKg, obs.ncrDeliveredPerKg,
      obs.freightPerKg, obs.expectedLossPct, obs.dataProvenance ?? 'estimated']
  );
  return { ...computed, id: rows[0].id };
}

module.exports = {
  // pure, unit-testable
  yieldIndex, priceImpact, forwardCurve, basis, valueFloorParticipation, commitAdvice,
  // db-facing
  cropParams, districtConfidence, computeAdvanceRate, publish, adviseCommitment, recordBasis,
};


