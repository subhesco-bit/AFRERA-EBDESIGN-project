# Extract engineering modules from FILE_CHANGES_APPENDIX.md and write to project

$appendixPath = "C:\Users\DIYA GOEL\Downloads\FILE_CHANGES_APPENDIX.md"
$content = Get-Content -Path $appendixPath -Raw

# Create engineering directory
$engDir = "C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\engineering"
New-Item -ItemType Directory -Force -Path $engDir | Out-Null

# Extract structuralEngine.js (lines 456-780)
$structural = @"
/**
 * Structural Engineering Engine
 *
 * Implements the "Structural AI" engine from the AFRERA AI Engineering,
 * Design & Digital Twin specification: beam/column sizing, foundation
 * sizing, and wind/seismic load derivation for agricultural structures
 * (greenhouses, cold stores, silos, animal sheds, solar sheds).
 *
 * HONESTY BOUNDARY — read before extending:
 * These are FIRST-PASS SIZING calculations using standard engineering
 * mechanics (simply-supported bending, Euler buckling, Rankine bearing) and
 * the load coefficients of IS 875 Part 3 (wind) and IS 1893 (seismic).
 * They are suitable for feasibility studies, BOQ generation and bank DPRs.
 * They are NOT a finite-element analysis and NOT a substitute for a
 * licensed structural engineer's stamped design. Every result carries
 * `advisory: true` and a `basis` string naming the method used, so no
 * consumer can mistake this for certified output. There is no FEA solver in
 * this codebase; rather than fake one, this engine states its own limits.
 */

'use strict';

const { selectSection } = require('./sectionTables');

// --- Material properties (characteristic strengths, SI units) -------------
// Steel grades per IS 2062 / IS 800; concrete per IS 456.
const STEEL_GRADES = {
  E250: { fy: 250e6, E: 200e9, density: 7850 }, // Pa, Pa, kg/m3
  E350: { fy: 350e6, E: 200e9, density: 7850 },
  E410: { fy: 410e6, E: 200e9, density: 7850 },
};

const CONCRETE_GRADES = {
  M20: { fck: 20e6 },
  M25: { fck: 25e6 },
  M30: { fck: 30e6 },
};

const GAMMA_M0 = 1.1;
const BEARING_SAFETY_FACTOR = 2.5;
const WIND_ZONES = { I: 33, II: 39, III: 44, IV: 47, V: 50, VI: 55 };
const SEISMIC_ZONES = { II: 0.10, III: 0.16, IV: 0.24, V: 0.36 };

const K2_CATEGORY2 = [
  { height: 10, k2: 1.00 },
  { height: 15, k2: 1.05 },
  { height: 20, k2: 1.07 },
  { height: 30, k2: 1.12 },
  { height: 50, k2: 1.17 },
];

function interpolateK2(heightM) {
  if (heightM <= K2_CATEGORY2[0].height) return K2_CATEGORY2[0].k2;
  const last = K2_CATEGORY2[K2_CATEGORY2.length - 1];
  if (heightM >= last.height) return last.k2;
  for (let i = 1; i < K2_CATEGORY2.length; i += 1) {
    const a = K2_CATEGORY2[i - 1];
    const b = K2_CATEGORY2[i];
    if (heightM <= b.height) {
      const t = (heightM - a.height) / (b.height - a.height);
      return a.k2 + t * (b.k2 - a.k2);
    }
  }
  return last.k2;
}

const BUCKLING_CLASS_ALPHA = { a: 0.21, b: 0.34, c: 0.49, d: 0.76 };

const LOAD_FACTORS = {
  DL: { dead: 1.5, live: 0, wind: 0, seismic: 0 },
  DL_LL: { dead: 1.5, live: 1.5, wind: 0, seismic: 0 },
  DL_WL: { dead: 1.5, live: 0, wind: 1.5, seismic: 0 },
  DL_LL_WL: { dead: 1.2, live: 1.2, wind: 1.2, seismic: 0 },
  DL_EL: { dead: 1.5, live: 0, wind: 0, seismic: 1.5 },
  DL_LL_EL: { dead: 1.2, live: 1.2, wind: 0, seismic: 1.2 },
  DL_MIN_WL: { dead: 0.9, live: 0, wind: 1.5, seismic: 0 },
};

function requirePositive(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(\`\${name} must be a positive number\`);
  }
  return n;
}

function calculateWindLoad({ zone = 'II', heightM = 6, k1 = 1.0, k3 = 1.0 }) {
  const Vb = WIND_ZONES[String(zone).toUpperCase()];
  if (!Vb) {
    throw new Error(\`Unknown wind zone "\${zone}". Expected one of: \${Object.keys(WIND_ZONES).join(', ')}\`);
  }
  const h = requirePositive(heightM, 'heightM');
  const k2 = interpolateK2(h);
  const Vz = Vb * k1 * k2 * k3;
  const pz = 0.6 * Vz * Vz;

  return {
    advisory: true,
    basis: 'IS 875 (Part 3) cl. 5.3 — Vz = Vb·k1·k2·k3, pz = 0.6·Vz²',
    zone: String(zone).toUpperCase(),
    basicWindSpeed_ms: Vb,
    terrainFactor_k2: Number(k2.toFixed(3)),
    designWindSpeed_ms: Number(Vz.toFixed(2)),
    designWindPressure_Nm2: Number(pz.toFixed(1)),
    designWindPressure_kNm2: Number((pz / 1000).toFixed(3)),
  };
}

function calculateSeismicLoad({ zone = 'III', seismicWeight_kN, importanceFactor = 1.0, responseReduction = 4.0, saOverG = 2.5 }) {
  const Z = SEISMIC_ZONES[String(zone).toUpperCase()];
  if (!Z) {
    throw new Error(\`Unknown seismic zone "\${zone}". Expected one of: \${Object.keys(SEISMIC_ZONES).join(', ')}\`);
  }
  const W = requirePositive(seismicWeight_kN, 'seismicWeight_kN');
  const R = requirePositive(responseReduction, 'responseReduction');
  const Ah = (Z / 2) * (importanceFactor / R) * saOverG;

  return {
    advisory: true,
    basis: 'IS 1893 (Part 1) cl. 7.5.3 — Ah = (Z/2)(I/R)(Sa/g), Vb = Ah·W',
    zone: String(zone).toUpperCase(),
    zoneFactor_Z: Z,
    horizontalSeismicCoefficient_Ah: Number(Ah.toFixed(4)),
    designBaseShear_kN: Number((Ah * W).toFixed(2)),
  };
}

function designBeam({ spanM, udl_kNm, grade = 'E250', deflectionLimitRatio = 240, sectionFamily = 'ISMB' }) {
  const L = requirePositive(spanM, 'spanM');
  const w = requirePositive(udl_kNm, 'udl_kNm') * 1000;
  const steel = STEEL_GRADES[String(grade).toUpperCase()];
  if (!steel) {
    throw new Error(\`Unknown steel grade "\${grade}". Expected one of: \${Object.keys(STEEL_GRADES).join(', ')}\`);
  }

  const Mu = (w * L * L) / 8;
  const Zreq_m3 = (Mu * GAMMA_M0) / steel.fy;
  const deltaAllow = L / deflectionLimitRatio;
  const Ireq_m4 = (5 * w * Math.pow(L, 4)) / (384 * steel.E * deltaAllow);

  return {
    advisory: true,
    basis: 'Simply-supported UDL beam: Mu=wL²/8, Z=Mu·γm0/fy, δ=5wL⁴/384EI (IS 800)',
    span_m: L,
    grade: String(grade).toUpperCase(),
    designMoment_kNm: Number((Mu / 1000).toFixed(2)),
    requiredSectionModulus_cm3: Number((Zreq_m3 * 1e6).toFixed(1)),
    requiredMomentOfInertia_cm4: Number((Ireq_m4 * 1e8).toFixed(1)),
    deflectionLimit_mm: Number((deltaAllow * 1000).toFixed(1)),
    selectedSection: selectSection({
      requiredZ_cm3: Zreq_m3 * 1e6,
      requiredI_cm4: Ireq_m4 * 1e8,
      family: sectionFamily,
    }),
    note: 'Section chosen as the lightest IS 808 profile meeting both Z and I. Lateral-torsional buckling of the compression flange is not checked here.',
  };
}

function designColumn({ heightM, axialLoad_kN, grade = 'E250', effectiveLengthFactor = 1.0, area_cm2, momentOfInertia_cm4, bucklingClass = 'b' }) {
  const h = requirePositive(heightM, 'heightM');
  const P = requirePositive(axialLoad_kN, 'axialLoad_kN') * 1000;
  const steel = STEEL_GRADES[String(grade).toUpperCase()];
  if (!steel) {
    throw new Error(\`Unknown steel grade "\${grade}". Expected one of: \${Object.keys(STEEL_GRADES).join(', ')}\`);
  }
  const A_m2 = requirePositive(area_cm2, 'area_cm2') / 1e4;
  const I_m4 = requirePositive(momentOfInertia_cm4, 'momentOfInertia_cm4') / 1e8;

  const Le = effectiveLengthFactor * h;
  const Pcr = (Math.PI ** 2 * steel.E * I_m4) / (Le * Le);
  const squash = (steel.fy * A_m2) / GAMMA_M0;
  const radiusOfGyration = Math.sqrt(I_m4 / A_m2);

  const alpha = BUCKLING_CLASS_ALPHA[String(bucklingClass).toLowerCase()];
  if (alpha === undefined) {
    throw new Error(\`Unknown bucklingClass "\${bucklingClass}". Expected one of: \${Object.keys(BUCKLING_CLASS_ALPHA).join(', ')}\`);
  }
  const fcc = (Math.PI ** 2 * steel.E) / ((Le / radiusOfGyration) ** 2);
  const lambda = Math.sqrt(steel.fy / fcc);
  const phi = 0.5 * (1 + alpha * (lambda - 0.2) + lambda * lambda);
  const chi = Math.min(1, 1 / (phi + Math.sqrt(Math.max(phi * phi - lambda * lambda, 0))));
  const designStrength = (chi * steel.fy) / GAMMA_M0;
  const capacity = designStrength * A_m2;

  return {
    advisory: true,
    basis: 'IS 800 cl. 7.1.2 Perry-Robertson buckling curve: χ·fy·A/γm0',
    height_m: h,
    effectiveLength_m: Number(Le.toFixed(2)),
    slendernessRatio: Number((Le / radiusOfGyration).toFixed(1)),
    bucklingClass: String(bucklingClass).toLowerCase(),
    nonDimensionalSlenderness: Number(lambda.toFixed(3)),
    stressReductionFactor_chi: Number(chi.toFixed(3)),
    eulerBucklingLoad_kN: Number((Pcr / 1000).toFixed(2)),
    squashLoad_kN: Number((squash / 1000).toFixed(2)),
    designCompressiveStrength_MPa: Number((designStrength / 1e6).toFixed(1)),
    governingCapacity_kN: Number((capacity / 1000).toFixed(2)),
    appliedLoad_kN: Number((P / 1000).toFixed(2)),
    utilisation: Number((P / capacity).toFixed(3)),
    safe: P <= capacity,
    note: 'Axial capacity only. Combined axial + bending (beam-column) interaction per IS 800 cl. 9.3 is not checked here.',
  };
}

function designFoundation({ axialLoad_kN, safeBearingCapacity_kNm2, concreteGrade = 'M25', squareFooting = true }) {
  const P = requirePositive(axialLoad_kN, 'axialLoad_kN');
  const sbcRaw = requirePositive(safeBearingCapacity_kNm2, 'safeBearingCapacity_kNm2');
  if (!CONCRETE_GRADES[String(concreteGrade).toUpperCase()]) {
    throw new Error(\`Unknown concrete grade "\${concreteGrade}". Expected one of: \${Object.keys(CONCRETE_GRADES).join(', ')}\`);
  }
  const allowable = sbcRaw / BEARING_SAFETY_FACTOR;
  const areaReq = P / allowable;
  const side = Math.sqrt(areaReq);

  return {
    advisory: true,
    basis: \`Rankine bearing check: A = P/(SBC/FoS), FoS = \${BEARING_SAFETY_FACTOR} (IS 456 / IS 6403)\`,
    axialLoad_kN: P,
    allowableBearingPressure_kNm2: Number(allowable.toFixed(1)),
    requiredArea_m2: Number(areaReq.toFixed(3)),
    ...(squareFooting
      ? { recommendedSquareSide_m: Number((Math.ceil(side * 20) / 20).toFixed(2)) }
      : {}),
    concreteGrade: String(concreteGrade).toUpperCase(),
    note: 'Depth, reinforcement and punching-shear checks require the full IS 456 design path and are not computed here.',
  };
}

function calculateLoadCombinations({ dead_kN = 0, live_kN = 0, wind_kN = 0, seismic_kN = 0 }) {
  for (const [name, value] of Object.entries({ dead_kN, live_kN, wind_kN, seismic_kN })) {
    if (!Number.isFinite(Number(value))) throw new Error(\`\${name} must be a number\`);
  }

  const combinations = Object.entries(LOAD_FACTORS).map(([name, f]) => {
    const total = f.dead * dead_kN + f.live * live_kN + f.wind * wind_kN + f.seismic * seismic_kN;
    return {
      combination: name,
      factors: f,
      factoredLoad_kN: Number(total.toFixed(2)),
    };
  });

  const governing = combinations.reduce((a, b) =>
    Math.abs(b.factoredLoad_kN) > Math.abs(a.factoredLoad_kN) ? b : a);

  const uplift = combinations.find(c => c.combination === 'DL_MIN_WL');

  return {
    advisory: true,
    basis: 'IS 800 Table 4 — partial safety factors for the limit state of strength',
    unfactoredLoads: { dead_kN, live_kN, wind_kN, seismic_kN },
    combinations,
    governing,
    upliftCase: uplift,
    upliftGoverns: Boolean(uplift && uplift.factoredLoad_kN < 0),
    note: 'Strength combinations only. Serviceability combinations (unfactored, for deflection) are a separate check.',
  };
}

module.exports = {
  STEEL_GRADES,
  BUCKLING_CLASS_ALPHA,
  LOAD_FACTORS,
  calculateLoadCombinations,
  selectSection,
  CONCRETE_GRADES,
  WIND_ZONES,
  SEISMIC_ZONES,
  calculateWindLoad,
  calculateSeismicLoad,
  designBeam,
  designColumn,
  designFoundation,
};
"@

Set-Content -Path "$engDir\structuralEngine.js" -Value $structural
Write-Host "✓ structuralEngine.js written"
