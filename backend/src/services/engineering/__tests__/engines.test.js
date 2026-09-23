/**
 * Engineering engine tests.
 *
 * Wherever the project specification published a worked figure, the test
 * asserts against THAT figure rather than against whatever the code happens to
 * return. A test that re-states the implementation proves nothing; a test that
 * reproduces an independently published number catches a wrong formula.
 *
 * Two figures deliberately do not match the specification, and the tests below
 * pin the discrepancy rather than hide it:
 *
 *  - Column capacity. The spec's 1,031 kN assumes MAJOR-axis buckling with
 *    class b. This engine reproduces that exactly when told to, but DEFAULTS to
 *    the minor axis with class c (431.78 kN), because a column buckles about
 *    its weak axis unless restrained there. The default is pinned by a test so
 *    it cannot be silently relaxed.
 *
 *  - Seismic base shear. The spec's 112.5 kN implies R = 4.0 (a braced or
 *    steel ordinary frame). This engine reproduces that exactly when told to,
 *    but DEFAULTS to R = 3.0, because assuming ductility a building has not
 *    been detailed for is unconservative.
 */

'use strict';

const structural = require('../structuralEngine');
const cost = require('../costEstimationEngine');
const solar = require('../solarEngine');
const sections = require('../sections');
const { InputError } = require('../advisory');

describe('advisory envelope', () => {
  it('marks every structural result advisory and names its basis', () => {
    const result = structural.windLoad({ zone: 'IV', height: 10 });
    expect(result.advisory).toBe(true);
    expect(typeof result.basis).toBe('string');
    expect(result.basis).toMatch(/IS 875/);
  });

  it('gives every cost result a priceBasis, so an estimate is never read as a quotation', () => {
    const result = cost.estimateCapitalCost({ facilityType: 'smart_greenhouse', areaSqFt: 10000 });
    expect(result.priceBasis).toMatch(/PARAMETRIC BAND/);
  });
});

describe('windLoad — IS 875 (Part 3)', () => {
  it('reproduces the specification figure: Zone IV at 10 m gives pz = 1325.4 N/m^2', () => {
    const result = structural.windLoad({ zone: 'IV', height: 10 });
    expect(result.designWindPressureNPerM2).toBe(1325.4);
    expect(result.basicWindSpeedMs).toBe(47);
  });

  it('interpolates k2 between tabulated heights', () => {
    const at10 = structural.windLoad({ zone: 'IV', height: 10 }).assumptions.k2;
    const at15 = structural.windLoad({ zone: 'IV', height: 15 }).assumptions.k2;
    const at12 = structural.windLoad({ zone: 'IV', height: 12 }).assumptions.k2;
    expect(at12).toBeGreaterThan(at10);
    expect(at12).toBeLessThan(at15);
  });

  it('rejects an unknown wind zone with an InputError', () => {
    expect(() => structural.windLoad({ zone: 'IX', height: 10 })).toThrow(InputError);
  });

  it('warns that pressure alone is not a member force', () => {
    const result = structural.windLoad({ zone: 'IV', height: 10 });
    expect(result.warnings.join(' ')).toMatch(/pressure coefficients/i);
  });
});

describe('seismicLoad — IS 1893 (Part 1)', () => {
  it('reproduces the specification figure with its implied R = 4.0: Vb = 112.5 kN', () => {
    const result = structural.seismicLoad({
      zone: 'V', seismicWeightKn: 1000, structureType: 'braced_frame',
    });
    expect(result.designBaseShearKn).toBe(112.5);
  });

  it('defaults to the conservative R = 3.0, giving a HIGHER design force', () => {
    const result = structural.seismicLoad({ zone: 'V', seismicWeightKn: 1000 });
    expect(result.responseReductionR).toBe(3.0);
    expect(result.designBaseShearKn).toBe(150);
  });

  it('scales linearly with seismic weight', () => {
    const w1 = structural.seismicLoad({ zone: 'IV', seismicWeightKn: 1000 }).designBaseShearKn;
    const w2 = structural.seismicLoad({ zone: 'IV', seismicWeightKn: 2000 }).designBaseShearKn;
    expect(w2).toBeCloseTo(w1 * 2, 6);
  });

  it('rejects an unknown seismic zone', () => {
    expect(() => structural.seismicLoad({ zone: 'I', seismicWeightKn: 1000 })).toThrow(InputError);
  });
});

describe('beamSizing — IS 800', () => {
  it('reproduces the specification figure: 6 m span at 10 kN/m gives Mu = 45 kNm', () => {
    const result = structural.beamSizing({ spanM: 6, udlKnPerM: 10 });
    expect(result.designMomentKnm).toBe(45);
    expect(result.designShearKn).toBe(30);
  });

  it('selects a section whose capacity actually covers the demand', () => {
    const result = structural.beamSizing({ spanM: 6, udlKnPerM: 10 });
    expect(result.selectedSection).toBeTruthy();
    expect(result.providedPlasticModulusCm3).toBeGreaterThanOrEqual(result.requiredPlasticModulusCm3);
    expect(result.utilisation).toBeLessThanOrEqual(1);
  });

  it('reports no section, with a reason, when the demand exceeds the IS 808 table', () => {
    const result = structural.beamSizing({ spanM: 40, udlKnPerM: 200 });
    expect(result.selectedSection).toBeNull();
    expect(result.selectionNote).toMatch(/exceeds every ISMB section/);
  });

  it('states that lateral-torsional buckling is not checked', () => {
    const result = structural.beamSizing({ spanM: 6, udlKnPerM: 10 });
    expect(result.warnings.join(' ')).toMatch(/Lateral-torsional buckling.*NOT checked/i);
  });
});

describe('columnCapacity — IS 800 Perry-Robertson', () => {
  it('reproduces the specification figure on its assumptions (major axis, class b): 1031 kN', () => {
    const result = structural.columnCapacity({
      lengthM: 3, section: 'ISMB 250', axis: 'zz', bucklingClass: 'b',
    });
    expect(Math.round(result.designCompressiveStrengthKn)).toBe(1031);
  });

  it('DEFAULTS to the weak axis and class c — the conservative case', () => {
    const result = structural.columnCapacity({ lengthM: 3, section: 'ISMB 250' });
    expect(result.axis).toBe('yy');
    expect(result.bucklingClass).toBe('c');
    expect(result.designCompressiveStrengthKn).toBeCloseTo(431.78, 1);
  });

  it('never returns Euler as a capacity, and labels it unusable', () => {
    const result = structural.columnCapacity({
      lengthM: 3, section: 'ISMB 250', axis: 'zz', bucklingClass: 'b',
    });
    expect(result.eulerCriticalLoadForComparisonKn).toBeGreaterThan(
      result.designCompressiveStrengthKn * 5,
    );
    expect(result.warnings.join(' ')).toMatch(/MUST NOT be used as a capacity/);
  });

  it('caps the design stress at fy/gamma_m0 for a very stocky column', () => {
    const result = structural.columnCapacity({ lengthM: 0.1, section: 'ISMB 600', axis: 'zz' });
    expect(result.designCompressiveStressNPerMm2).toBeLessThanOrEqual(250 / 1.10 + 1e-9);
  });

  it('flags a slenderness above the IS 800 Table 3 limit of 180', () => {
    const result = structural.columnCapacity({ lengthM: 10, section: 'ISMB 100' });
    expect(result.slendernessRatio).toBeGreaterThan(180);
    expect(result.warnings.join(' ')).toMatch(/exceeds the limit of 180/);
  });

  it('rejects an unknown section designation', () => {
    expect(() => structural.columnCapacity({ lengthM: 3, section: 'ISMB 999' })).toThrow(InputError);
  });
});

describe('padFooting — IS 456 plan sizing', () => {
  it('sizes the plan area from the service load and bearing capacity', () => {
    const result = structural.padFooting({ axialLoadKn: 500, safeBearingCapacityKnPerM2: 150 });
    // 500 * 1.10 / 150 = 3.667 m^2 -> side 1.915 m -> rounded up to 1.95 m
    expect(result.requiredPlanAreaM2).toBeCloseTo(3.6667, 3);
    expect(result.providedSquareSideM).toBe(1.95);
  });

  it('keeps the actual bearing pressure below the allowable after rounding up', () => {
    const result = structural.padFooting({ axialLoadKn: 500, safeBearingCapacityKnPerM2: 150 });
    expect(result.actualBearingPressureKnPerM2).toBeLessThanOrEqual(150);
  });

  it('says that reinforcement and punching shear are not designed', () => {
    const result = structural.padFooting({ axialLoadKn: 500, safeBearingCapacityKnPerM2: 150 });
    expect(result.warnings.join(' ')).toMatch(/punching.*shear.*NOT designed/i);
  });
});

describe('sections — IS 808', () => {
  it('picks the LIGHTEST section that meets the demand, not the first listed', () => {
    const picked = sections.selectSection('ISMB', 'Zpz', 300);
    expect(picked.section).toBe('ISMB 225');
    expect(picked.properties.Zpz).toBeGreaterThanOrEqual(300);
  });

  it('returns a reason instead of a section when nothing in the table fits', () => {
    const picked = sections.selectSection('ISMB', 'Zpz', 99999);
    expect(picked.section).toBeNull();
    expect(picked.reason).toMatch(/built-up or plate girder/);
  });

  it('carries the weak principal axis for equal angles, which governs a strut', () => {
    expect(sections.getSection('ISA 100x100x10').rvv).toBeLessThan(
      sections.getSection('ISA 100x100x10').ryy,
    );
  });
});

describe('estimateCapitalCost', () => {
  it('reproduces the specification band: 10,000 sq.ft smart greenhouse = $400k-$650k', () => {
    const result = cost.estimateCapitalCost({ facilityType: 'smart_greenhouse', areaSqFt: 10000 });
    expect(result.capitalCostLowUsd).toBe(400000);
    expect(result.capitalCostHighUsd).toBe(650000);
  });

  it('uses the specification 35/25/20/12/8 split', () => {
    expect(cost.BUDGET_SPLIT).toEqual({
      civil_structure: 0.35,
      mechanical_climate: 0.25,
      electrical_power: 0.20,
      automation_controls: 0.12,
      commissioning_contingency: 0.08,
    });
  });

  it('breaks the budget down so the parts reconstruct the midpoint EXACTLY', () => {
    const result = cost.estimateCapitalCost({ facilityType: 'processing_unit', areaSqFt: 7333 });
    const sum = Object.values(result.budgetBreakdownUsd).reduce((a, b) => a + b, 0);
    expect(sum).toBe(result.capitalCostMidpointUsd);
  });

  it('rejects an unknown facility type rather than guessing a rate', () => {
    expect(() => cost.estimateCapitalCost({ facilityType: 'spaceport', areaSqFt: 100 }))
      .toThrow(InputError);
  });
});

describe('extendBillOfQuantities', () => {
  it('extends each line and totals with contingency and overhead', () => {
    const result = cost.extendBillOfQuantities({
      items: [
        { description: 'Concrete M25', unit: 'm3', quantity: 100, rate: 120 },
        { description: 'Reinforcement', unit: 'kg', quantity: 5000, rate: 0.9 },
      ],
      contingencyRate: 0.05,
      overheadRate: 0.10,
    });
    expect(result.subtotal).toBe(16500);
    expect(result.contingency).toBe(825);
    expect(result.overhead).toBe(1650);
    expect(result.total).toBe(18975);
  });

  it('refuses an empty bill rather than returning a zero total', () => {
    expect(() => cost.extendBillOfQuantities({ items: [] })).toThrow(InputError);
  });
});

describe('financialProjection', () => {
  const baseline = {
    capitalCostUsd: 1200000,
    debtFraction: 0.70,
    interestRate: 0.075,
    tenorYears: 10,
    annualNetOperatingIncomeUsd: 270000,
  };

  it('computes the level annual debt service for the specification baseline', () => {
    const result = cost.financialProjection(baseline);
    // The specification prints ~$122,382. The exact level payment for
    // P=840,000, i=7.5%, n=10 is $122,376.18; this engine reports the exact
    // figure rather than reproducing the spec's rounding.
    expect(result.annualDebtServiceUsd).toBeCloseTo(122376.18, 2);
    expect(Math.abs(result.annualDebtServiceUsd - 122382) / 122382).toBeLessThan(0.0001);
  });

  it('reports a year-1 DSCR matching the specification 2.21x', () => {
    const result = cost.financialProjection(baseline);
    expect(result.year1Dscr).toBeCloseTo(2.21, 2);
  });

  it('drops debt service to zero after the tenor ends', () => {
    const result = cost.financialProjection({ ...baseline, horizonYears: 12 });
    expect(result.schedule[10].debtServiceUsd).toBe(0);
    expect(result.schedule[10].dscr).toBeNull();
  });

  it('rejects a debt fraction outside (0,1)', () => {
    expect(() => cost.financialProjection({ ...baseline, debtFraction: 1 })).toThrow(InputError);
  });
});

describe('covenantBreachProbability', () => {
  const input = {
    annualDebtServiceUsd: 122376.18,
    expectedNoiUsd: 270000,
    noiVolatility: 0.25,
    iterations: 5000,
  };

  it('is reproducible: the same inputs give the same probability', () => {
    const a = cost.covenantBreachProbability(input);
    const b = cost.covenantBreachProbability(input);
    expect(a.breachProbability).toBe(b.breachProbability);
  });

  it('gives a different answer for a different seed, so the seed is real', () => {
    const a = cost.covenantBreachProbability(input);
    const b = cost.covenantBreachProbability({ ...input, seed: 987654321 });
    expect(a.breachProbability).not.toBe(b.breachProbability);
  });

  it('raises the breach probability as volatility rises', () => {
    const low = cost.covenantBreachProbability({ ...input, noiVolatility: 0.10 });
    const high = cost.covenantBreachProbability({ ...input, noiVolatility: 0.40 });
    expect(high.breachProbability).toBeGreaterThan(low.breachProbability);
  });

  it('caps iterations so a request cannot pin the event loop', () => {
    expect(() => cost.covenantBreachProbability({ ...input, iterations: 500000 })).toThrow(InputError);
  });

  it('states that independent years understate multi-year breach runs', () => {
    const result = cost.covenantBreachProbability(input);
    expect(result.assumptions.independenceNote).toMatch(/autocorrelated/);
  });
});

describe('matchSubsidySchemes', () => {
  const project = {
    facilityType: 'cold_storage', state: 'Assam', capitalCostUsd: 500000, applicantCategory: 'fpo',
  };

  it('applies the scheme cap to the indicative grant', () => {
    const result = cost.matchSubsidySchemes({
      project,
      schemes: [{
        name: 'Capped scheme', facilityTypes: ['cold_storage'], states: ['Assam'], subsidyRate: 0.35, maxGrantUsd: 100000,
      }],
    });
    expect(result.results[0].eligible).toBe(true);
    expect(result.results[0].indicativeGrantUsd).toBe(100000);
  });

  it('gives a reason for every rejection', () => {
    const result = cost.matchSubsidySchemes({
      project,
      schemes: [{ name: 'Wrong state', facilityTypes: ['cold_storage'], states: ['Kerala'], subsidyRate: 0.3 }],
    });
    expect(result.results[0].eligible).toBe(false);
    expect(result.results[0].reasons[0]).toMatch(/state "Assam" is not covered/);
  });

  it('rejects a lapsed scheme', () => {
    const result = cost.matchSubsidySchemes({
      project,
      schemes: [{ name: 'Expired', validUntil: '2020-01-01', subsidyRate: 0.3 }],
    });
    expect(result.results[0].eligible).toBe(false);
    expect(result.results[0].reasons.join(' ')).toMatch(/lapsed/);
  });

  it('refuses to run without a scheme set rather than shipping a stale catalogue', () => {
    expect(() => cost.matchSubsidySchemes({ project, schemes: [] })).toThrow(/no scheme catalogue/);
  });
});

describe('solar — tilt and row spacing', () => {
  it('never recommends a tilt below the self-cleaning minimum', () => {
    const result = solar.optimalTilt({ latitude: 2 });
    expect(result.recommendedTiltDeg).toBe(10);
    expect(result.assumptions.minimumTiltReason).toMatch(/soiling/);
  });

  it('faces the array at the equator in each hemisphere', () => {
    expect(solar.optimalTilt({ latitude: 26 }).azimuthDeg).toBe(180);
    expect(solar.optimalTilt({ latitude: -26 }).azimuthDeg).toBe(0);
  });

  it('computes the winter-solstice solar altitude as 90 - |lat| - 23.45', () => {
    const result = solar.rowSpacing({ latitude: 26.2, moduleLengthM: 2, tiltDeg: 22 });
    expect(result.winterSolsticeSolarAltitudeDeg).toBeCloseTo(40.35, 2);
  });

  it('needs a wider pitch at higher latitude for the same module', () => {
    const low = solar.rowSpacing({ latitude: 12, moduleLengthM: 2, tiltDeg: 22 }).minimumRowPitchM;
    const high = solar.rowSpacing({ latitude: 34, moduleLengthM: 2, tiltDeg: 22 }).minimumRowPitchM;
    expect(high).toBeGreaterThan(low);
  });

  it('refuses a latitude where the solstice sun never clears the horizon', () => {
    expect(() => solar.rowSpacing({ latitude: 70, moduleLengthM: 2, tiltDeg: 22 })).toThrow(InputError);
  });
});

describe('solar — annual yield', () => {
  it('reproduces the specification figure: 35 degC ambient gives a 60 degC cell and 14% loss', () => {
    const result = solar.annualYield({
      systemSizeKwp: 100, annualIrradiationKwhPerM2: 1800, ambientTempC: 35,
    });
    expect(result.cellTemperatureC).toBe(60);
    expect(result.temperatureLossPercent).toBe(14);
  });

  it('degrades output year on year at the stated rate', () => {
    const result = solar.annualYield({
      systemSizeKwp: 100, annualIrradiationKwhPerM2: 1800, years: 25, degradationRate: 0.005,
    });
    const expectedFinal = result.year1EnergyKwh * (1 - 0.005) ** 24;
    expect(result.finalYearEnergyKwh).toBeCloseTo(expectedFinal, 1);
    expect(result.finalYearEnergyKwh).toBeLessThan(result.year1EnergyKwh);
  });

  it('rejects a positive temperature coefficient, which is physically wrong', () => {
    expect(() => solar.annualYield({
      systemSizeKwp: 100, annualIrradiationKwhPerM2: 1800, tempCoefficientPerC: 0.004,
    })).toThrow(InputError);
  });

  it('says plainly that the irradiation figure came from the caller', () => {
    const result = solar.annualYield({ systemSizeKwp: 100, annualIrradiationKwhPerM2: 1800 });
    expect(result.assumptions.irradiationSource).toMatch(/CALLER-SUPPLIED/);
  });
});

describe('solar — battery sizing', () => {
  it('grosses the bank up for depth of discharge and round-trip efficiency', () => {
    const result = solar.batterySizing({ dailyLoadKwh: 50, autonomyDays: 2 });
    expect(result.usableEnergyRequiredKwh).toBe(100);
    expect(result.nominalCapacityKwh).toBeCloseTo(100 / (0.8 * 0.9), 3);
  });

  it('converts to amp-hours at the system voltage', () => {
    const result = solar.batterySizing({ dailyLoadKwh: 50, autonomyDays: 2, systemVoltageV: 48 });
    expect(result.nominalCapacityAh).toBeCloseTo((result.nominalCapacityKwh * 1000) / 48, 1);
  });

  it('rejects a depth of discharge above 1', () => {
    expect(() => solar.batterySizing({ dailyLoadKwh: 50, depthOfDischarge: 1.2 })).toThrow(InputError);
  });
});
