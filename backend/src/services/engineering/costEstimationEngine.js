/**
 * Parametric capital cost, BOQ extension, and bankability projection.
 *
 * PRICE BASIS, stated on every money result: these are PARAMETRIC bands from
 * the project specification's published cost table, not sourced quotations.
 * There is no supplier price feed in this deployment. A parametric estimate
 * carries a wide error bar early in a project and must not be presented to a
 * lender or a client as a quotation -- hence `priceBasis` on every result.
 */

'use strict';

const {
  build, InputError, num, oneOf, round,
} = require('./advisory');

// USD per square foot, low and high. From the specification's facility table.
const FACILITY_COST_BANDS = {
  smart_greenhouse: { low: 40, high: 65, label: 'Smart greenhouse (climate-controlled)' },
  cold_storage: { low: 55, high: 90, label: 'Cold storage / controlled atmosphere' },
  packhouse: { low: 30, high: 50, label: 'Pack-house and grading line' },
  processing_unit: { low: 65, high: 110, label: 'Food processing unit' },
  warehouse: { low: 18, high: 32, label: 'Dry warehouse' },
};

// Share of capital cost by work package. Sums to 1.00.
const BUDGET_SPLIT = {
  civil_structure: 0.35,
  mechanical_climate: 0.25,
  electrical_power: 0.20,
  automation_controls: 0.12,
  commissioning_contingency: 0.08,
};

/**
 * Capital cost band for a facility of a given floor area.
 *
 * The budget breakdown is computed from the band MIDPOINT, and the last key
 * absorbs the rounding residual so the parts reconstruct the midpoint exactly.
 * A breakdown that does not add up to its own total is the kind of defect that
 * survives review for years.
 */
function estimateCapitalCost(input = {}) {
  const facilityKey = oneOf(input.facilityType, 'facilityType', FACILITY_COST_BANDS);
  const areaSqFt = num(input.areaSqFt, 'areaSqFt');
  const band = FACILITY_COST_BANDS[facilityKey];

  const lowUsd = band.low * areaSqFt;
  const highUsd = band.high * areaSqFt;
  const midpointUsd = (lowUsd + highUsd) / 2;

  const keys = Object.keys(BUDGET_SPLIT);
  const breakdown = {};
  let allocated = 0;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      breakdown[key] = round(midpointUsd - allocated, 2);
    } else {
      const share = round(midpointUsd * BUDGET_SPLIT[key], 2);
      breakdown[key] = share;
      allocated += share;
    }
  });

  return build({
    basis: 'Parametric area-rate model: cost = area x published USD/sq.ft band for the facility type',
    priceBasis: 'PARAMETRIC BAND, not a quotation. No supplier price feed is connected in this '
      + 'deployment. Expect a wide error bar at concept stage; do not present as a sourced rate.',
    output: {
      facilityType: facilityKey,
      facilityLabel: band.label,
      areaSqFt,
      rateLowUsdPerSqFt: band.low,
      rateHighUsdPerSqFt: band.high,
      capitalCostLowUsd: round(lowUsd, 2),
      capitalCostHighUsd: round(highUsd, 2),
      capitalCostMidpointUsd: round(midpointUsd, 2),
      budgetBreakdownUsd: breakdown,
      budgetSplitFractions: BUDGET_SPLIT,
    },
    assumptions: {
      breakdownBasis: 'Applied to the band midpoint',
      roundingNote: 'The last breakdown line absorbs the rounding residual, so the parts sum exactly to the midpoint',
      currency: 'USD',
      excludes: 'Land, statutory approvals, financing cost during construction, working capital',
    },
    warnings: [
      'Area rates are location-independent here. Regional labour and freight can move a '
      + 'real tender well outside this band.',
    ],
  });
}

/**
 * Extend a bill of quantities: qty x rate per line, with totals.
 * Rates are whatever the caller supplies -- this engine does not price them.
 */
function extendBillOfQuantities(input = {}) {
  const { items } = input;
  if (!Array.isArray(items) || !items.length) {
    throw new InputError('items must be a non-empty array of { description, unit, quantity, rate }');
  }

  const lines = items.map((item, index) => {
    const quantity = num(item.quantity, `items[${index}].quantity`, { positive: false });
    const rate = num(item.rate, `items[${index}].rate`, { positive: false });
    if (quantity < 0 || rate < 0) {
      throw new InputError(`items[${index}]: quantity and rate must not be negative`);
    }
    return {
      description: String(item.description || `Item ${index + 1}`),
      unit: String(item.unit || 'nos'),
      quantity,
      rate,
      amount: round(quantity * rate, 2),
    };
  });

  const subtotal = round(lines.reduce((sum, line) => sum + line.amount, 0), 2);
  const contingencyRate = input.contingencyRate === undefined
    ? 0.05 : num(input.contingencyRate, 'contingencyRate', { positive: false });
  const overheadRate = input.overheadRate === undefined
    ? 0.10 : num(input.overheadRate, 'overheadRate', { positive: false });

  const contingency = round(subtotal * contingencyRate, 2);
  const overhead = round(subtotal * overheadRate, 2);

  return build({
    basis: 'Bill of quantities extension: amount = quantity x rate, plus contingency and overhead on the subtotal',
    priceBasis: 'CALLER-SUPPLIED RATES. This engine extends the arithmetic; it does not source, '
      + 'validate or benchmark any rate.',
    output: {
      lines,
      lineCount: lines.length,
      subtotal,
      contingencyRate,
      contingency,
      overheadRate,
      overhead,
      total: round(subtotal + contingency + overhead, 2),
    },
    assumptions: {
      taxes: 'Excluded. GST is computed by gstService, not here.',
    },
  });
}

/**
 * Debt service and DSCR projection.
 *
 *   A = P * i / (1 - (1+i)^-n)     level annual payment
 *   DSCR = net operating income / annual debt service
 */
function financialProjection(input = {}) {
  const capitalCostUsd = num(input.capitalCostUsd, 'capitalCostUsd');
  const debtFraction = num(input.debtFraction === undefined ? 0.70 : input.debtFraction, 'debtFraction');
  if (debtFraction <= 0 || debtFraction >= 1) {
    throw new InputError('debtFraction must be between 0 and 1 (exclusive)');
  }
  const interestRate = num(input.interestRate, 'interestRate');
  const tenorYears = Math.trunc(num(input.tenorYears, 'tenorYears'));
  const annualNetOperatingIncomeUsd = num(input.annualNetOperatingIncomeUsd, 'annualNetOperatingIncomeUsd');
  const revenueGrowthRate = input.revenueGrowthRate === undefined
    ? 0 : num(input.revenueGrowthRate, 'revenueGrowthRate', { positive: false });
  const discountRate = input.discountRate === undefined
    ? interestRate : num(input.discountRate, 'discountRate');
  const horizonYears = Math.trunc(input.horizonYears === undefined ? 10 : num(input.horizonYears, 'horizonYears'));

  const principal = capitalCostUsd * debtFraction;
  const equity = capitalCostUsd - principal;
  const annualDebtService = (principal * interestRate) / (1 - (1 + interestRate) ** -tenorYears);

  const schedule = [];
  let npv = -equity;
  for (let year = 1; year <= horizonYears; year += 1) {
    const noi = annualNetOperatingIncomeUsd * (1 + revenueGrowthRate) ** (year - 1);
    const debtService = year <= tenorYears ? annualDebtService : 0;
    const freeCashFlow = noi - debtService;
    npv += freeCashFlow / (1 + discountRate) ** year;
    schedule.push({
      year,
      netOperatingIncomeUsd: round(noi, 2),
      debtServiceUsd: round(debtService, 2),
      freeCashFlowUsd: round(freeCashFlow, 2),
      dscr: debtService > 0 ? round(noi / debtService, 4) : null,
    });
  }

  const dscrValues = schedule.filter((r) => r.dscr !== null).map((r) => r.dscr);

  return build({
    basis: 'Level-payment amortisation A = P*i/(1-(1+i)^-n); DSCR = NOI / annual debt service',
    priceBasis: 'DERIVED FROM CALLER-SUPPLIED CAPITAL COST AND NOI. Not a credit assessment and '
      + 'not a lender-grade model: no tax, depreciation, working-capital cycle or moratorium.',
    output: {
      capitalCostUsd: round(capitalCostUsd, 2),
      debtUsd: round(principal, 2),
      equityUsd: round(equity, 2),
      interestRate,
      tenorYears,
      annualDebtServiceUsd: round(annualDebtService, 2),
      year1Dscr: dscrValues.length ? dscrValues[0] : null,
      minimumDscr: dscrValues.length ? round(Math.min(...dscrValues), 4) : null,
      averageDscr: dscrValues.length ? round(dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length, 4) : null,
      netPresentValueUsd: round(npv, 2),
      discountRate,
      schedule,
    },
    assumptions: {
      repayment: 'Level annual payment, no moratorium, no prepayment',
      revenueGrowthRate,
      excludes: 'Corporate tax, depreciation, working-capital movements, terminal value',
    },
    warnings: [
      'DSCR here is NOI-based. Lenders usually require a post-tax, post-working-capital DSCR, '
      + 'which is lower than this figure.',
    ],
  });
}

// --- Monte Carlo covenant breach -------------------------------------------

/** mulberry32: small, fast, seedable PRNG. Seeded so a bank-facing figure is reproducible. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller: one standard normal from two uniforms. */
function standardNormal(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Probability that DSCR falls below a covenant threshold in any year, given a
 * lognormal spread on net operating income.
 *
 * SEEDED BY DEFAULT. An unseeded Monte Carlo returns a different probability
 * on every call, which is unusable in a document a lender will re-check.
 */
function covenantBreachProbability(input = {}) {
  const annualDebtServiceUsd = num(input.annualDebtServiceUsd, 'annualDebtServiceUsd');
  const expectedNoiUsd = num(input.expectedNoiUsd, 'expectedNoiUsd');
  const noiVolatility = num(input.noiVolatility === undefined ? 0.20 : input.noiVolatility, 'noiVolatility');
  const covenantDscr = num(input.covenantDscr === undefined ? 1.25 : input.covenantDscr, 'covenantDscr');
  const years = Math.trunc(num(input.years === undefined ? 10 : input.years, 'years'));
  const iterations = Math.trunc(num(input.iterations === undefined ? 10000 : input.iterations, 'iterations'));
  if (iterations > 200000) throw new InputError('iterations must not exceed 200000');
  const seed = Math.trunc(num(input.seed === undefined ? 20260101 : input.seed, 'seed', { positive: false }));

  const rng = mulberry32(seed);
  // Lognormal with median = expectedNoi: mu = ln(expected), sigma = volatility.
  const mu = Math.log(expectedNoiUsd);

  let breachedRuns = 0;
  let breachedYearCount = 0;
  const worstDscrPerRun = [];

  for (let run = 0; run < iterations; run += 1) {
    let breachedThisRun = false;
    let worst = Infinity;
    for (let year = 0; year < years; year += 1) {
      const noi = Math.exp(mu + noiVolatility * standardNormal(rng));
      const dscr = noi / annualDebtServiceUsd;
      if (dscr < worst) worst = dscr;
      if (dscr < covenantDscr) {
        breachedThisRun = true;
        breachedYearCount += 1;
      }
    }
    worstDscrPerRun.push(worst);
    if (breachedThisRun) breachedRuns += 1;
  }

  worstDscrPerRun.sort((a, b) => a - b);
  const percentile = (p) => worstDscrPerRun[Math.min(worstDscrPerRun.length - 1, Math.floor(p * worstDscrPerRun.length))];

  return build({
    basis: 'Monte Carlo over a lognormal NOI (median = expected NOI, sigma = volatility); '
      + 'breach = DSCR below the covenant in any year',
    priceBasis: 'MODEL OUTPUT, not an underwriting decision. The probability is only as good as '
      + 'the volatility assumption, which is caller-supplied and not estimated from history here.',
    output: {
      iterations,
      years,
      covenantDscr,
      expectedNoiUsd: round(expectedNoiUsd, 2),
      annualDebtServiceUsd: round(annualDebtServiceUsd, 2),
      expectedDscr: round(expectedNoiUsd / annualDebtServiceUsd, 4),
      breachProbability: round(breachedRuns / iterations, 5),
      expectedBreachYearsPerRun: round(breachedYearCount / iterations, 4),
      worstYearDscrP5: round(percentile(0.05), 4),
      worstYearDscrP50: round(percentile(0.50), 4),
      seed,
    },
    assumptions: {
      distribution: 'Lognormal, independent across years',
      noiVolatility,
      independenceNote: 'Years are drawn independently. Real revenue is autocorrelated, which '
        + 'makes multi-year breach runs more likely than this model shows.',
      reproducibility: `Seeded (${seed}); re-running with the same inputs returns the same probability.`,
    },
  });
}

/**
 * Match a project against subsidy schemes by rule, not by keyword.
 * Schemes are caller-supplied: this engine holds no scheme catalogue, because
 * a stale hardcoded scheme list is worse than none.
 */
function matchSubsidySchemes(input = {}) {
  const { project, schemes } = input;
  if (!project || typeof project !== 'object') {
    throw new InputError('project is required');
  }
  if (!Array.isArray(schemes) || !schemes.length) {
    throw new InputError(
      'schemes must be a non-empty array. This engine holds no scheme catalogue: '
      + 'effective-dated scheme rules belong in a maintained data source, not hardcoded here.',
    );
  }

  const evaluated = schemes.map((scheme) => {
    const reasons = [];
    let eligible = true;

    if (scheme.facilityTypes && !scheme.facilityTypes.includes(project.facilityType)) {
      eligible = false;
      reasons.push(`facilityType "${project.facilityType}" is not covered`);
    }
    if (scheme.states && !scheme.states.includes(project.state)) {
      eligible = false;
      reasons.push(`state "${project.state}" is not covered`);
    }
    if (typeof scheme.maxProjectCostUsd === 'number' && project.capitalCostUsd > scheme.maxProjectCostUsd) {
      eligible = false;
      reasons.push(`project cost exceeds the scheme ceiling of ${scheme.maxProjectCostUsd}`);
    }
    if (typeof scheme.minProjectCostUsd === 'number' && project.capitalCostUsd < scheme.minProjectCostUsd) {
      eligible = false;
      reasons.push(`project cost is below the scheme floor of ${scheme.minProjectCostUsd}`);
    }
    if (scheme.applicantCategories && project.applicantCategory
        && !scheme.applicantCategories.includes(project.applicantCategory)) {
      eligible = false;
      reasons.push(`applicant category "${project.applicantCategory}" is not covered`);
    }
    if (scheme.validUntil && new Date(scheme.validUntil) < new Date()) {
      eligible = false;
      reasons.push(`scheme lapsed on ${scheme.validUntil}`);
    }

    let indicativeGrantUsd = null;
    if (eligible && typeof scheme.subsidyRate === 'number') {
      const uncapped = project.capitalCostUsd * scheme.subsidyRate;
      indicativeGrantUsd = typeof scheme.maxGrantUsd === 'number'
        ? Math.min(uncapped, scheme.maxGrantUsd)
        : uncapped;
    }

    return {
      scheme: scheme.name || scheme.id || 'unnamed scheme',
      eligible,
      reasons: eligible ? ['meets every rule supplied for this scheme'] : reasons,
      subsidyRate: scheme.subsidyRate === undefined ? null : scheme.subsidyRate,
      indicativeGrantUsd: indicativeGrantUsd === null ? null : round(indicativeGrantUsd, 2),
    };
  });

  const eligibleSchemes = evaluated.filter((s) => s.eligible);

  return build({
    basis: 'Rule evaluation of the caller-supplied scheme set against the project attributes',
    priceBasis: 'INDICATIVE ONLY. A grant figure here is the scheme rate applied to the project '
      + 'cost; it is not an approval, a sanction or an entitlement.',
    output: {
      schemesEvaluated: evaluated.length,
      eligibleCount: eligibleSchemes.length,
      totalIndicativeGrantUsd: round(
        eligibleSchemes.reduce((sum, s) => sum + (s.indicativeGrantUsd || 0), 0), 2,
      ),
      results: evaluated,
    },
    assumptions: {
      catalogue: 'Caller-supplied. No scheme list is embedded in this engine by design -- '
        + 'a stale hardcoded subsidy table would silently mis-advise applicants.',
      stacking: 'Grants are summed without applying cross-scheme stacking limits, which most '
        + 'schemes impose. Treat the total as an upper bound.',
    },
  });
}

module.exports = {
  estimateCapitalCost,
  extendBillOfQuantities,
  financialProjection,
  covenantBreachProbability,
  matchSubsidySchemes,
  FACILITY_COST_BANDS,
  BUDGET_SPLIT,
};
