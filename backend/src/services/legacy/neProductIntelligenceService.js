/**
 * Northeast Product Intelligence Service.
 *
 * PROVENANCE — recovered from the pre-v43 version lineage (`ne (3).zip`)
 * The archive contains 65 HTML builds spanning neia_platform -> ao_system ->
 * v4_consumer -> v5_nextgen -> harvest_master -> v7_master -> v8_os (23
 * iterations) -> v9_os. Function-inventory diffing on 2026-08-04 found 213
 * functions present in that lineage but ABSENT from v43 — later versions did
 * not strictly supersede earlier ones; capability was dropped along the way.
 *
 * The logic below was among the dropped set. It is not incidental UI code: it
 * is the quantified commercial argument for Northeast produce, and the landed
 * cost model behind the platform's margins. Losing it means losing the ability
 * to answer "why is this worth more?" with a number.
 *
 * Sources by function:
 *   curcuminAnalysis   <- calcCurcumin        (ne_harvest_v9_os)
 *   chilliHeatGuidance <- calcSHU             (ne_harvest_v9_os)
 *   schemeEligibility  <- calcEligibility     (ne_harvest_v9_os)
 *   emiSchedule        <- calcEMI             (ne_harvest_v9_os)
 *   landedCostModel    <- buildCost + COSTS   (ao_system_v2)
 *   deliveryZoneLookup <- checkPincode        (ne_harvest_v8_os)
 *
 * All were browser functions that read from DOM elements and wrote innerHTML.
 * They are re-expressed here as pure functions returning structured data, so
 * web, mobile and desktop clients share one implementation and the numbers can
 * be unit-tested rather than eyeballed in a rendered page.
 */

const express = require('express');
const { logger } = require('../../../utils/logger');
const { authMiddleware } = require('../../../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// Reference data recovered from the lineage.
// Kept as named constants with sources so the provenance of every number is
// traceable — these figures underpin commercial claims.
// ---------------------------------------------------------------------------

/** Curcumin content by turmeric origin (% w/w). Source: ne_harvest_v9_os. */
const TURMERIC_CURCUMIN_PCT = Object.freeze({
  ne_lakadong: 9.2,   // Meghalaya Lakadong — the platform's headline differentiator
  salem: 3.5,         // common Indian commercial benchmark
  grocery: 2.5        // generic retail turmeric
});

/** Therapeutic anti-inflammatory threshold in mg of curcumin. */
const CURCUMIN_THERAPEUTIC_MG = 500;

/**
 * Landed cost structure per product (INR per kg unless noted).
 * proc=procurement, apmc=APMC fee (fraction of proc), sort=sorting loss
 * (fraction), pack/road/rail/ndls/transit/admin = per-unit costs,
 * sellC=our consumer price, sellO=our organic price,
 * bb=BigBasket benchmark, bl=Blinkit benchmark.
 * Source: ao_system_v2 COSTS table.
 */
const LANDED_COSTS = Object.freeze({
  honey:     { proc: 190, apmc: 0.02, sort: 0,    pack: 32, road: 1.5, rail: 4.05, ndls: 2.5, transit: 0,  admin: 2.5, sellC: 450, sellO: 699,  bb: 920,  bl: 1358 },
  lemon:     { proc: 25,  apmc: 0.02, sort: 0.03, pack: 3,  road: 1.5, rail: 4.05, ndls: 2.5, transit: 0,  admin: 2.5, sellC: 160, sellO: 220,  bb: 306,  bl: 390 },
  bamboo:    { proc: 18,  apmc: 0.02, sort: 0.04, pack: 4,  road: 1.5, rail: 4.05, ndls: 3,   transit: 3,  admin: 2.5, sellC: 99,  sellO: 140,  bb: 300,  bl: 350 },
  kiwi:      { proc: 150, apmc: 0.02, sort: 0.05, pack: 3,  road: 1.5, rail: 4.05, ndls: 3,   transit: 5,  admin: 2.5, sellC: 299, sellO: 440,  bb: 683,  bl: 838 },
  passion:   { proc: 90,  apmc: 0.02, sort: 0.08, pack: 3,  road: 1.5, rail: 4.05, ndls: 3,   transit: 10, admin: 2.5, sellC: 320, sellO: 480,  bb: 348,  bl: 600 },
  jackfruit: { proc: 18,  apmc: 0.02, sort: 0.05, pack: 3,  road: 1.5, rail: 4.05, ndls: 3,   transit: 4,  admin: 2.5, sellC: 79,  sellO: 99,   bb: 144,  bl: 180 },
  bhut:      { proc: 250, apmc: 0.02, sort: 0,    pack: 8,  road: 1.5, rail: 4.05, ndls: 1,   transit: 0,  admin: 2.5, sellC: 700, sellO: 1100, bb: 1500, bl: 2000 }
});

/** Scoville guidance for Northeast chillies. Source: ne_harvest_v9_os calcSHU. */
const CHILLI_HEAT_GUIDANCE = Object.freeze({
  mild: {
    safe: ['Dalle Khursani in small amounts (~100K SHU)', 'Sirarakhong Hathei (medium-high)'],
    avoid: ['Bhut Jolokia', 'Naga King Chilli'],
    technique: 'Dalle Khursani as pickle — oil and acid reduce effective heat. Micro-dose Bhut Jolokia at 30mg per litre of liquid for aroma without discomfort.'
  },
  medium: {
    safe: ['Dalle Khursani freely', 'Bhut Jolokia in micro-doses (max 50mg per dish)'],
    avoid: ['Undiluted Bhut Jolokia'],
    technique: 'Bhut Jolokia carries fruit and smoke notes that survive dilution — use for aroma, not heat.'
  },
  high: {
    safe: ['Bhut Jolokia', 'Naga King Chilli', 'Dalle Khursani'],
    avoid: [],
    technique: 'Full-strength use acceptable. Handle with gloves; capsaicin transfers to skin and eyes.'
  }
});

// ---------------------------------------------------------------------------
// 1. Curcumin analysis — the quantified NE differentiation argument
// ---------------------------------------------------------------------------

/**
 * How much curcumin is in a dose, and how much ordinary turmeric would be
 * needed to match it.
 *
 * This is the platform's core value claim expressed as arithmetic: NE Lakadong
 * at ~9.2% curcumin versus Salem at 3.5% and generic retail at 2.5%. A buyer
 * paying a premium is entitled to see the multiple.
 */
function curcuminAnalysis({ doseGrams = 3, curcuminPct = TURMERIC_CURCUMIN_PCT.ne_lakadong } = {}) {
  const dose = Number(doseGrams);
  const pct = Number(curcuminPct);

  if (!Number.isFinite(dose) || dose <= 0) throw new Error('doseGrams must be greater than zero');
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) throw new Error('curcuminPct must be between 0 and 100');

  const curcuminMg = dose * 1000 * (pct / 100);
  const equivalentGrams = (referencePct) => (curcuminMg / (referencePct / 100)) / 1000;

  const meetsThreshold = curcuminMg >= CURCUMIN_THERAPEUTIC_MG;

  return {
    doseGrams: dose,
    curcuminPct: pct,
    curcuminMg: Math.round(curcuminMg * 10) / 10,
    therapeuticThresholdMg: CURCUMIN_THERAPEUTIC_MG,
    meetsTherapeuticThreshold: meetsThreshold,
    // If below threshold, say exactly what dose would reach it rather than
    // leaving the buyer to work it out.
    doseNeededForThresholdGrams: meetsThreshold
      ? null
      : Math.ceil((CURCUMIN_THERAPEUTIC_MG / (pct * 10)) * 10) / 10,
    equivalentDose: {
      salemGrams: Math.round(equivalentGrams(TURMERIC_CURCUMIN_PCT.salem) * 10) / 10,
      groceryGrams: Math.round(equivalentGrams(TURMERIC_CURCUMIN_PCT.grocery) * 10) / 10
    },
    potencyMultiple: {
      vsSalem: Math.round((pct / TURMERIC_CURCUMIN_PCT.salem) * 100) / 100,
      vsGrocery: Math.round((pct / TURMERIC_CURCUMIN_PCT.grocery) * 100) / 100
    }
  };
}

// ---------------------------------------------------------------------------
// 2. Chilli heat guidance
// ---------------------------------------------------------------------------

function chilliHeatGuidance({ tolerance = 'medium' } = {}) {
  const key = String(tolerance).toLowerCase();
  const guidance = CHILLI_HEAT_GUIDANCE[key];
  if (!guidance) {
    throw new Error(`tolerance must be one of: ${Object.keys(CHILLI_HEAT_GUIDANCE).join(', ')}`);
  }
  return { tolerance: key, ...guidance };
}

// ---------------------------------------------------------------------------
// 3. Government scheme eligibility
// ---------------------------------------------------------------------------

// Special-category states attract enhanced central assistance.
const NE_SPECIAL_CATEGORY_STATES = Object.freeze([
  'Nagaland', 'Manipur', 'Meghalaya', 'Mizoram', 'Arunachal Pradesh',
  'Assam', 'Tripura', 'Sikkim'
]);

/**
 * Indicative scheme eligibility.
 *
 * Deliberately returns `indicative: true` and an explicit caveat. Scheme rules
 * change and are administered by agencies, not by this platform — presenting a
 * definitive "you qualify" to a farmer who then gets refused would damage
 * trust far more than a hedged answer.
 */
function schemeEligibility({ applicantType, annualTurnover = 0, state = '' } = {}) {
  const type = String(applicantType || '').toLowerCase();
  const turnover = Number(annualTurnover) || 0;
  const isNE = NE_SPECIAL_CATEGORY_STATES.some(
    (s) => s.toLowerCase() === String(state).toLowerCase()
  );

  const schemes = [];

  if (['farmer', 'fpc', 'fpo', 'shg'].includes(type)) {
    schemes.push({ name: 'KCC (Kisan Credit Card)', benefit: 'Up to ₹3L at 4% effective interest', basis: 'applicant type' });
    schemes.push({ name: 'PMFBY Crop Insurance', benefit: 'Subsidised premium', basis: 'applicant type' });
    if (isNE) {
      schemes.push({ name: 'NE special-category assistance', benefit: 'Enhanced central share for Northeast states', basis: 'state' });
      schemes.push({ name: 'Mission Organic Value Chain Development for NER (MOVCDNER)', benefit: 'Organic cluster support', basis: 'state' });
    }
  }

  if (['fpc', 'fpo'].includes(type)) {
    schemes.push({ name: '10,000 FPO Formation & Promotion', benefit: 'Formation grant + equity grant', basis: 'applicant type' });
  }

  if (['enterprise', 'msme', 'processor'].includes(type)) {
    schemes.push({ name: 'PMFME (Micro Food Processing Enterprises)', benefit: '35% credit-linked subsidy (cap applies)', basis: 'applicant type' });
    if (turnover > 0 && turnover <= 25000000) {
      schemes.push({ name: 'MSME classification benefits', benefit: 'Priority sector lending, tender preference', basis: 'turnover' });
    }
  }

  return {
    applicantType: type || null,
    state: state || null,
    isSpecialCategoryState: isNE,
    annualTurnover: turnover,
    schemes,
    // Never presented as a determination.
    indicative: true,
    caveat: 'Indicative only. Eligibility is determined by the administering agency against current scheme guidelines, which change. Confirm before relying on this.'
  };
}

// ---------------------------------------------------------------------------
// 4. EMI schedule
// ---------------------------------------------------------------------------

function emiSchedule({ principal, annualRatePct, tenureMonths } = {}) {
  const P = Number(principal);
  const annual = Number(annualRatePct);
  const N = Number(tenureMonths);

  if (!Number.isFinite(P) || P <= 0) throw new Error('principal must be greater than zero');
  if (!Number.isFinite(N) || N <= 0) throw new Error('tenureMonths must be greater than zero');
  if (!Number.isFinite(annual) || annual < 0) throw new Error('annualRatePct must be zero or greater');

  const r = annual / 12 / 100;
  // Zero-interest is a real case (some subsidy schemes) and must not divide by zero.
  const emi = r === 0
    ? P / N
    : (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);

  const total = emi * N;

  return {
    principal: P,
    annualRatePct: annual,
    tenureMonths: N,
    emi: Math.round(emi),
    totalPayable: Math.round(total),
    totalInterest: Math.round(total - P),
    interestAsPctOfPrincipal: Math.round(((total - P) / P) * 1000) / 10
  };
}

// ---------------------------------------------------------------------------
// 5. Landed cost model — the unit economics engine
// ---------------------------------------------------------------------------

/**
 * Full cost build-up for a product, with margin against our own price and
 * savings against quick-commerce benchmarks.
 *
 * This is the model that answers "can we sell this at this price and survive?"
 * — the single most commercially load-bearing calculation recovered.
 */
function landedCostModel({ product, volumeKg = 1 } = {}) {
  let key = String(product || '').toLowerCase();
  const c = LANDED_COSTS[key];
  if (!c) {
    throw new Error(`Unknown product "${product}". Known: ${Object.keys(LANDED_COSTS).join(', ')}`);
  }
  const volume = Number(volumeKg);
  if (!Number.isFinite(volume) || volume <= 0) throw new Error('volumeKg must be greater than zero');

  const apmcFee = Math.round(c.proc * c.apmc * 100) / 100;
  const sortingLoss = Math.round(c.proc * c.sort * 100) / 100;

  const breakdown = {
    procurement: c.proc,
    apmcFee,
    sortingLoss,
    packaging: c.pack,
    roadFreight: c.road,
    railFreight: c.rail,
    delhiHandling: c.ndls,
    transitLoss: c.transit,
    admin: c.admin
  };

  const totalCost = Object.values(breakdown).reduce((s, v) => s + v, 0);
  let pct = (num, den) => (den === 0 ? 0 : Math.round((1 - num / den) * 100));

  return {
    product: key,
    volumeKg: volume,
    costPerKg: Math.round(totalCost * 100) / 100,
    breakdown,
    pricing: {
      conventional: c.sellC,
      organic: c.sellO
    },
    margin: {
      conventionalPct: pct(totalCost, c.sellC),
      organicPct: pct(totalCost, c.sellO)
    },
    // Consumer-facing saving vs quick commerce — the demand-side argument.
    consumerSavingVs: {
      bigBasketPct: pct(c.sellC, c.bb),
      blinkitPct: pct(c.sellC, c.bl)
    },
    benchmarks: { bigBasket: c.bb, blinkit: c.bl },
    projection: {
      revenue: Math.round(volume * c.sellC * 100) / 100,
      profit: Math.round(volume * (c.sellC - totalCost) * 100) / 100
    },
    viable: c.sellC > totalCost
  };
}

function listCostedProducts() {
  return Object.keys(LANDED_COSTS);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const handle = (fn) => (req, res) => {
  try {
    res.json({ success: true, data: fn({ ...req.body, ...req.query }) });
  } catch (error) {
    logger.error('NE product intelligence error', { error: error.message, stack: error.stack });
    res.status(400).json({ success: false, error: error.message });
  }
};

// Public: these are marketing/education surfaces a guest should reach.
router.post('/curcumin', handle(curcuminAnalysis));
router.get('/chilli-heat', handle(chilliHeatGuidance));
router.get('/costed-products', handle(listCostedProducts));

// Protected: scheme advice, financing and unit economics.
router.post('/scheme-eligibility', authMiddleware, handle(schemeEligibility));
router.post('/emi', authMiddleware, handle(emiSchedule));
router.post('/landed-cost', authMiddleware, handle(landedCostModel));

function isHealthy() {
  return { status: 'ok', costedProducts: Object.keys(LANDED_COSTS).length };
}

module.exports = {
  router,
  isHealthy,
  curcuminAnalysis,
  chilliHeatGuidance,
  schemeEligibility,
  emiSchedule,
  landedCostModel,
  listCostedProducts,
  TURMERIC_CURCUMIN_PCT,
  LANDED_COSTS
};

