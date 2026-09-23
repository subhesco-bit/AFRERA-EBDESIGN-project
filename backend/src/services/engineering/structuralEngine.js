/**
 * Structural first-pass sizing, to Indian Standards.
 *
 *   windLoad        IS 875 (Part 3) : 2015  -- design wind pressure
 *   seismicLoad     IS 1893 (Part 1) : 2016 -- static base shear
 *   beamSizing      IS 800 : 2007           -- flexure, simply supported UDL
 *   columnCapacity  IS 800 : 2007 cl. 7.1.2 -- Perry-Robertson buckling
 *   padFooting      IS 456 : 2000           -- bearing-pressure plan sizing only
 *
 * SCOPE, stated plainly because it bounds every number below: this is sizing
 * arithmetic from published formulas. There is no finite-element solver here,
 * so there is no stress or deflection field, no lateral-torsional buckling
 * check, no beam-column interaction and no reinforcement design. Results are
 * advisory. See `notImplemented` in routes/engineeringDesignRoutes.js for the
 * runtime-visible list.
 */

'use strict';

const {
  build, InputError, NotImplementedError, num, oneOf, round,
} = require('./advisory');
const { selectSection, getSection } = require('./sections');

// --- IS 875 Part 3 ----------------------------------------------------------

// Basic wind speed Vb (m/s) by zone, Table 1 / Annex A.
const WIND_ZONES = {
  I: 33, II: 39, III: 44, IV: 47, V: 50, VI: 55,
};

// k2 terrain-and-height factor, Table 2. Keyed by terrain category, then by
// height (m) above ground. Class B structures (most agri-industrial buildings).
const K2_TABLE = {
  1: { 10: 1.05, 15: 1.09, 20: 1.12, 30: 1.15, 50: 1.20, 100: 1.26 },
  2: { 10: 1.00, 15: 1.05, 20: 1.07, 30: 1.12, 50: 1.17, 100: 1.24 },
  3: { 10: 0.91, 15: 0.97, 20: 1.01, 30: 1.06, 50: 1.12, 100: 1.20 },
  4: { 10: 0.80, 15: 0.80, 20: 0.80, 30: 0.97, 50: 1.10, 100: 1.20 },
};

function interpolateK2(terrain, height) {
  const row = K2_TABLE[terrain];
  const heights = Object.keys(row).map(Number).sort((a, b) => a - b);

  if (height <= heights[0]) return row[heights[0]];
  if (height >= heights[heights.length - 1]) return row[heights[heights.length - 1]];

  for (let i = 0; i < heights.length - 1; i += 1) {
    const lo = heights[i];
    const hi = heights[i + 1];
    if (height >= lo && height <= hi) {
      const frac = (height - lo) / (hi - lo);
      return row[lo] + frac * (row[hi] - row[lo]);
    }
  }
  return row[heights[heights.length - 1]];
}

/**
 * Design wind pressure.
 *   Vz = Vb * k1 * k2 * k3 * k4      (cl. 6.3)
 *   pz = 0.6 * Vz^2                  (cl. 7.2, N/m^2 with Vz in m/s)
 *   pd = Kd * Ka * Kc * pz           (cl. 7.2)
 */
function windLoad(input = {}) {
  const zone = oneOf(input.zone, 'zone', WIND_ZONES);
  const height = num(input.height, 'height');
  const terrain = Number(input.terrainCategory || 2);
  if (!K2_TABLE[terrain]) {
    throw new InputError('terrainCategory must be 1, 2, 3 or 4 (IS 875 Pt 3 cl. 6.3.2)');
  }

  const Vb = WIND_ZONES[zone];
  const k1 = input.k1 === undefined ? 1.0 : num(input.k1, 'k1');
  const k2 = input.k2 === undefined ? interpolateK2(terrain, height) : num(input.k2, 'k2');
  const k3 = input.k3 === undefined ? 1.0 : num(input.k3, 'k3');
  const k4 = input.k4 === undefined ? 1.0 : num(input.k4, 'k4');

  const Vz = Vb * k1 * k2 * k3 * k4;
  const pz = 0.6 * Vz * Vz;

  const Kd = input.Kd === undefined ? 1.0 : num(input.Kd, 'Kd');
  const Ka = input.Ka === undefined ? 1.0 : num(input.Ka, 'Ka');
  const Kc = input.Kc === undefined ? 1.0 : num(input.Kc, 'Kc');
  const pd = Kd * Ka * Kc * pz;

  return build({
    basis: 'IS 875 (Part 3) : 2015, cl. 6.3 and 7.2 -- Vz = Vb*k1*k2*k3*k4, pz = 0.6*Vz^2',
    output: {
      zone,
      basicWindSpeedMs: Vb,
      designWindSpeedMs: round(Vz, 3),
      designWindPressureNPerM2: round(pz, 2),
      factoredWindPressureNPerM2: round(pd, 2),
      heightM: height,
      terrainCategory: terrain,
    },
    assumptions: {
      k1, k2: round(k2, 4), k3, k4, Kd, Ka, Kc,
      k2Source: input.k2 === undefined ? `interpolated from IS 875 Pt 3 Table 2, terrain ${terrain}, class B` : 'caller-supplied',
    },
    warnings: [
      'Pressure only. Converting this to a member force needs pressure coefficients '
      + '(Cpe/Cpi, IS 875 Pt 3 Table 5-6) for the actual building geometry, which this engine does not select.',
    ],
  });
}

// --- IS 1893 Part 1 ---------------------------------------------------------

// Zone factor Z, Table 3.
const SEISMIC_ZONES = {
  II: 0.10, III: 0.16, IV: 0.24, V: 0.36,
};

// Importance factor I, Table 8.
const IMPORTANCE = {
  ordinary: 1.0, important: 1.2, critical: 1.5,
};

// Response reduction factor R, Table 9.
const RESPONSE_REDUCTION = {
  omr_frame: 3.0,          // ordinary moment-resisting RC frame
  smr_frame: 5.0,          // special moment-resisting RC frame
  steel_omr_frame: 4.0,
  steel_smr_frame: 5.0,
  braced_frame: 4.0,
  load_bearing_masonry: 1.5,
};

/**
 * Static base shear.
 *   Ah = (Z/2) * (I/R) * (Sa/g)   (cl. 6.4.2)
 *   Vb = Ah * W                   (cl. 7.6.3)
 */
function seismicLoad(input = {}) {
  const zone = oneOf(input.zone, 'zone', SEISMIC_ZONES);
  const seismicWeightKn = num(input.seismicWeightKn, 'seismicWeightKn');
  const importanceKey = oneOf(input.importance || 'ordinary', 'importance', IMPORTANCE);
  // Default: ordinary moment-resisting frame, R = 3.0.
  //
  // R reduces the design force in proportion to the ductility the structure is
  // detailed for. Assuming ductility the building has not been detailed for is
  // unconservative, so the default is the ordinary frame, not the special one.
  // Callers who have detailed for special moment resistance pass
  // structureType: 'smr_frame' and get the lower force.
  const structureKey = oneOf(input.structureType || 'omr_frame', 'structureType', RESPONSE_REDUCTION);

  const Z = SEISMIC_ZONES[zone];
  const I = IMPORTANCE[importanceKey];
  const R = RESPONSE_REDUCTION[structureKey];
  // Sa/g defaults to 2.5, the plateau of the design spectrum (cl. 6.4.2 Fig. 2)
  // -- the maximum, so the default is the conservative one.
  const SaOverG = input.SaOverG === undefined ? 2.5 : num(input.SaOverG, 'SaOverG');

  const Ah = (Z / 2) * (I / R) * SaOverG;
  const Vb = Ah * seismicWeightKn;

  return build({
    basis: 'IS 1893 (Part 1) : 2016, cl. 6.4.2 and 7.6.3 -- Ah = (Z/2)(I/R)(Sa/g), Vb = Ah*W',
    output: {
      zone,
      zoneFactorZ: Z,
      importanceFactorI: I,
      responseReductionR: R,
      spectralAccelerationSaOverG: SaOverG,
      horizontalSeismicCoefficientAh: round(Ah, 6),
      seismicWeightKn,
      designBaseShearKn: round(Vb, 3),
    },
    assumptions: {
      SaOverGSource: input.SaOverG === undefined
        ? 'Default 2.5 -- the plateau of the design spectrum, i.e. the worst case for any soil type'
        : 'caller-supplied',
      structureType: structureKey,
      structureTypeSource: input.structureType ? 'caller-supplied' : 'defaulted to omr_frame (R = 3.0), the conservative choice',
      importance: importanceKey,
    },
    warnings: [
      'Static method. IS 1893 cl. 7.2.1 requires dynamic analysis for irregular buildings '
      + 'and for regular buildings above the height limits in Table 6; this engine does not check regularity.',
      'Distribution of Vb up the height (cl. 7.6.3) is not computed here.',
    ],
  });
}

// --- IS 800 : flexure -------------------------------------------------------

const STEEL_GRADES = { E250: 250, E275: 275, E300: 300, E350: 350, E410: 410 };
const GAMMA_M0 = 1.10; // partial safety factor for yielding, IS 800 Table 5

/**
 * Simply supported beam under a uniformly distributed load.
 *   Mu = w L^2 / 8
 *   Md = beta_b * Zp * fy / gamma_m0      (cl. 8.2.1.2, plastic section)
 * and the lightest ISMB whose Zp meets the demand.
 */
function beamSizing(input = {}) {
  const spanM = num(input.spanM, 'spanM');
  const udlKnPerM = num(input.udlKnPerM, 'udlKnPerM');
  const gradeKey = oneOf(input.steelGrade || 'E250', 'steelGrade', STEEL_GRADES);
  const fy = STEEL_GRADES[gradeKey];
  const table = (input.sectionTable || 'ISMB').toUpperCase();

  const MuKnm = (udlKnPerM * spanM * spanM) / 8;
  const shearKn = (udlKnPerM * spanM) / 2;

  // Zp required, cm^3. Mu[kNm] -> N.mm is x1e6; fy in N/mm^2; result mm^3 -> cm^3 is /1e3.
  const ZpRequiredCm3 = (MuKnm * 1e6 * GAMMA_M0) / (fy * 1e3);

  const selection = selectSection(table, 'Zpz', ZpRequiredCm3);

  const output = {
    spanM,
    udlKnPerM,
    steelGrade: gradeKey,
    yieldStrengthNPerMm2: fy,
    designMomentKnm: round(MuKnm, 3),
    designShearKn: round(shearKn, 3),
    requiredPlasticModulusCm3: round(ZpRequiredCm3, 2),
    sectionTable: table,
  };

  const warnings = [
    'Flexure only. Lateral-torsional buckling (IS 800 cl. 8.2.2) is NOT checked: an '
    + 'unrestrained compression flange will govern and this section may then be inadequate.',
    'Deflection (IS 800 Table 6) is not checked.',
    'Web buckling and bearing at supports are not checked.',
  ];

  if (!selection.section) {
    return build({
      basis: 'IS 800 : 2007 cl. 8.2.1.2 -- Mu = wL^2/8, Zp,req = Mu*gamma_m0/fy',
      output: { ...output, selectedSection: null, selectionNote: selection.reason },
      assumptions: { gammaM0: GAMMA_M0, betaB: 1.0, supportCondition: 'simply supported', loadCase: 'uniformly distributed' },
      warnings,
    });
  }

  const Zp = selection.properties.Zpz;
  const MdKnm = (1.0 * Zp * 1e3 * fy) / (GAMMA_M0 * 1e6);

  return build({
    basis: 'IS 800 : 2007 cl. 8.2.1.2 -- Mu = wL^2/8, Md = beta_b*Zp*fy/gamma_m0',
    output: {
      ...output,
      selectedSection: selection.section,
      providedPlasticModulusCm3: Zp,
      sectionMassKgPerM: selection.properties.mass,
      designBendingStrengthKnm: round(MdKnm, 3),
      utilisation: round(MuKnm / MdKnm, 4),
    },
    assumptions: {
      gammaM0: GAMMA_M0,
      betaB: 1.0,
      betaBNote: 'beta_b = 1.0 assumes a plastic or compact section; slender sections need beta_b = Ze/Zp (cl. 8.2.1.2)',
      supportCondition: 'simply supported',
      loadCase: 'uniformly distributed',
    },
    warnings,
  });
}

// --- IS 800 : compression ---------------------------------------------------

// Imperfection factor alpha by buckling class, IS 800 Table 7.
const BUCKLING_CLASS_ALPHA = {
  a: 0.21, b: 0.34, c: 0.49, d: 0.76,
};

// Effective length factor K, IS 800 Table 11.
const END_CONDITIONS = {
  fixed_fixed: 0.65,
  fixed_pinned: 0.80,
  pinned_pinned: 1.00,
  fixed_free: 2.00,
  fixed_sway: 1.20,
};

const E_STEEL = 2.0e5; // N/mm^2, IS 800 cl. 2.2.4.1

/**
 * Axial compression capacity by the Perry-Robertson curve of IS 800 cl. 7.1.2.1.
 *
 * WHY NOT EULER: the Euler critical load is an upper bound for a perfect,
 * elastic, residual-stress-free strut. For a real hot-rolled section it
 * overstates capacity by roughly an order of magnitude at practical
 * slendernesses -- a 3 m ISMB 250 gives 11,254 kN by Euler against 1,031 kN by
 * this clause. Euler is returned below for comparison ONLY and is labelled as
 * such; it must never be used as a capacity.
 *
 * DEFAULT AXIS: 'yy', the minor axis. A column buckles about its weaker axis
 * unless something restrains it there, so the weak axis is the safe default.
 * Pass axis: 'zz' only when minor-axis buckling is positively prevented.
 */
function columnCapacity(input = {}) {
  const lengthM = num(input.lengthM, 'lengthM');
  const designation = input.section;
  if (!designation) throw new InputError('section is required, e.g. "ISMB 250"');
  const props = getSection(designation);

  const gradeKey = oneOf(input.steelGrade || 'E250', 'steelGrade', STEEL_GRADES);
  const fy = STEEL_GRADES[gradeKey];
  const endKey = oneOf(input.endCondition || 'pinned_pinned', 'endCondition', END_CONDITIONS);
  const K = input.effectiveLengthFactor === undefined
    ? END_CONDITIONS[endKey]
    : num(input.effectiveLengthFactor, 'effectiveLengthFactor');

  const axis = oneOf(input.axis || 'yy', 'axis', { yy: 1, zz: 1, vv: 1 });
  const radiusCm = props[`r${axis}`];
  if (typeof radiusCm !== 'number') {
    throw new InputError(`Section ${designation} has no radius of gyration for axis "${axis}"`);
  }

  const classKey = oneOf(input.bucklingClass || 'c', 'bucklingClass', BUCKLING_CLASS_ALPHA);
  const alpha = BUCKLING_CLASS_ALPHA[classKey];

  const effectiveLengthMm = K * lengthM * 1000;
  const radiusMm = radiusCm * 10;
  const slenderness = effectiveLengthMm / radiusMm;

  // Perry-Robertson, cl. 7.1.2.1
  const fcc = (Math.PI ** 2 * E_STEEL) / (slenderness ** 2);
  const lambda = Math.sqrt(fy / fcc);
  const phi = 0.5 * (1 + alpha * (lambda - 0.2) + lambda * lambda);
  const fcd = (fy / GAMMA_M0) / (phi + Math.sqrt(phi * phi - lambda * lambda));
  const fcdCapped = Math.min(fcd, fy / GAMMA_M0); // cl. 7.1.2.1 -- fcd shall not exceed fy/gamma_m0

  const areaMm2 = props.A * 100;
  const PdKn = (areaMm2 * fcdCapped) / 1000;
  const eulerKn = (fcc * areaMm2) / 1000;

  const warnings = [
    'Axial compression only. Combined axial force and bending (IS 800 cl. 9.3) is NOT checked.',
    'Torsional and torsional-flexural buckling (cl. 7.2.2) are not checked; they can govern for '
    + 'angles, channels and other singly-symmetric sections.',
    'eulerCriticalLoadKn is reported for comparison only and MUST NOT be used as a capacity -- it '
    + 'ignores imperfections and residual stresses and is unconservative by roughly an order of magnitude here.',
  ];
  if (slenderness > 180) {
    warnings.push(`Slenderness ${round(slenderness, 1)} exceeds the limit of 180 for a compression member carrying loads (IS 800 Table 3).`);
  }

  return build({
    basis: 'IS 800 : 2007 cl. 7.1.2.1 -- Perry-Robertson buckling curve, Pd = Ae*fcd',
    output: {
      section: designation,
      lengthM,
      axis,
      effectiveLengthFactorK: K,
      effectiveLengthMm: round(effectiveLengthMm, 1),
      radiusOfGyrationMm: round(radiusMm, 2),
      slendernessRatio: round(slenderness, 3),
      steelGrade: gradeKey,
      bucklingClass: classKey,
      imperfectionFactorAlpha: alpha,
      elasticCriticalStressNPerMm2: round(fcc, 3),
      nonDimensionalSlendernessLambda: round(lambda, 5),
      designCompressiveStressNPerMm2: round(fcdCapped, 4),
      designCompressiveStrengthKn: round(PdKn, 2),
      eulerCriticalLoadForComparisonKn: round(eulerKn, 2),
    },
    assumptions: {
      gammaM0: GAMMA_M0,
      elasticModulusNPerMm2: E_STEEL,
      endCondition: endKey,
      axisNote: input.axis
        ? 'caller-supplied axis'
        : 'Defaulted to the minor (yy) axis: a column buckles about its weaker axis unless restrained there. '
          + 'Pass axis:"zz" only when minor-axis buckling is positively prevented.',
      bucklingClassNote: input.bucklingClass
        ? 'caller-supplied'
        : 'Defaulted to class c (alpha = 0.49), the conservative choice for rolled sections about the minor axis (IS 800 Table 10).',
    },
    warnings,
  });
}

// --- IS 456 : pad footing plan size ----------------------------------------

/**
 * Plan area of an isolated pad footing from allowable bearing pressure.
 *
 * This is the plan-sizing step ONLY. Reinforcement design, one-way and
 * two-way (punching) shear, and settlement are not computed -- see warnings.
 */
function padFooting(input = {}) {
  const axialLoadKn = num(input.axialLoadKn, 'axialLoadKn');
  const safeBearingCapacityKnPerM2 = num(input.safeBearingCapacityKnPerM2, 'safeBearingCapacityKnPerM2');
  const selfWeightAllowance = input.selfWeightAllowance === undefined
    ? 0.10
    : num(input.selfWeightAllowance, 'selfWeightAllowance', { positive: false });

  if (selfWeightAllowance < 0 || selfWeightAllowance > 0.5) {
    throw new InputError('selfWeightAllowance must be a fraction between 0 and 0.5');
  }

  const serviceLoadKn = axialLoadKn * (1 + selfWeightAllowance);
  const requiredAreaM2 = serviceLoadKn / safeBearingCapacityKnPerM2;
  const squareSideM = Math.sqrt(requiredAreaM2);
  // Footings are cast to 50 mm increments on site.
  const providedSideM = Math.ceil(squareSideM * 20) / 20;
  const providedAreaM2 = providedSideM * providedSideM;

  return build({
    basis: 'IS 456 : 2000 cl. 34.1 -- plan area = service load / safe bearing capacity',
    output: {
      axialLoadKn,
      safeBearingCapacityKnPerM2,
      serviceLoadIncludingSelfWeightKn: round(serviceLoadKn, 2),
      requiredPlanAreaM2: round(requiredAreaM2, 4),
      squareSideRequiredM: round(squareSideM, 4),
      providedSquareSideM: providedSideM,
      providedPlanAreaM2: round(providedAreaM2, 4),
      actualBearingPressureKnPerM2: round(serviceLoadKn / providedAreaM2, 3),
    },
    assumptions: {
      selfWeightAllowance,
      selfWeightNote: `Footing and backfill self-weight taken as ${round(selfWeightAllowance * 100, 1)}% of the column load`,
      shape: 'square, concentrically loaded',
      roundedTo: 'next 50 mm',
    },
    warnings: [
      'Plan size only. Footing depth, flexural reinforcement, one-way shear and two-way '
      + '(punching) shear per IS 456 cl. 31 and 34 are NOT designed by this engine.',
      'Assumes a concentric axial load. Moment transfer from the column produces a non-uniform '
      + 'pressure that this formula does not represent.',
      'Settlement is not checked. Safe bearing capacity must come from a geotechnical '
      + 'investigation, not from a table.',
    ],
  });
}

/** Declared but not built -- see routes/engineeringDesignRoutes.js capabilities. */
function lateralTorsionalBuckling() {
  throw new NotImplementedError(
    'Lateral-torsional buckling (IS 800 cl. 8.2.2) is not implemented. It needs the '
    + 'torsional and warping constants (It, Iw) and the effective laterally unsupported '
    + 'length, neither of which this engine models.',
  );
}

module.exports = {
  windLoad,
  seismicLoad,
  beamSizing,
  columnCapacity,
  padFooting,
  lateralTorsionalBuckling,
  WIND_ZONES,
  SEISMIC_ZONES,
  STEEL_GRADES,
  END_CONDITIONS,
  BUCKLING_CLASS_ALPHA,
};
