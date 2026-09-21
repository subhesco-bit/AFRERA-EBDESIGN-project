/**
 * MEP Design Service — AI Engineer support for Mechanical / Electrical / Plumbing.
 *
 * Supports agricultural infrastructure (cold storage, polyhouse, dairy, warehouse, …)
 * with:
 *   1. Deterministic design packages (required subsystems by project type)
 *   2. Capacity math only from user-supplied inputs + documented formulas
 *   3. AI design brief (advisory narrative only — never invents kW, TR, or pipe sizes)
 *
 * Same honesty bar as engineeringProjectService.js: no fake FEA/CFD/BIM generation.
 * See DOCUMENTATION/MEP_DESIGN_LAYER.md.
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { aiAPI } = require('./aiBackboneService');

const nowIso = () => new Date().toISOString();
const unavailable = (note) => ({ source: 'unavailable', verified: false, asOf: nowIso(), note: note || null });
const catalogSourced = () => ({ source: 'calculated', verified: true, asOf: nowIso(), note: 'From published design package catalog' });
const inputSourced = () => ({ source: 'calculated', verified: true, asOf: nowIso(), note: 'Formula applied to user-supplied inputs only' });
const aiSourced = () => ({ source: 'ai', verified: false, asOf: nowIso(), note: 'Advisory design brief only' });

/** Facility types aligned with engineering PROJECT_TYPES where relevant. */
const FACILITY_TYPES = [
  'cold_storage', 'polyhouse', 'greenhouse', 'warehouse', 'dairy',
  'food_processing', 'grain_storage', 'fisheries', 'solar', 'water_infrastructure', 'other',
];

/**
 * Deterministic MEP package catalog — checklists, not sizing numbers.
 * Operators confirm sizes in specialist engineering tools / BOQ rates.
 */
const DESIGN_PACKAGES = {
  cold_storage: {
    mechanical: [
      'Refrigeration plant (compressor, condenser, evaporator) selection checklist',
      'Insulation and vapour barrier continuity check',
      'Defrost strategy and drain management',
      'Emergency ventilation / purge path',
    ],
    electrical: [
      'Connected load schedule (compressors, fans, lighting, controls)',
      'Standby / DG or grid backup sizing inputs',
      'Motor starters, soft-start or VFD as required',
      'Earthing and cold-room lighting IP rating',
    ],
    plumbing: [
      'Condensate and defrost drain routing',
      'Floor wash-down and hygiene drains',
      'Fire water if code requires',
    ],
  },
  polyhouse: {
    mechanical: [
      'Forced / natural ventilation path',
      'Fogging or pad-and-fan if climate demands',
      'Thermal screen / shading integration',
    ],
    electrical: [
      'Circulation fans and control panel',
      'Sensor and automation power',
      'Lighting (optional photoperiod) load list',
    ],
    plumbing: [
      'Drip / mist irrigation manifold',
      'Fertigation dosing point',
      'Drainage and runoff capture',
    ],
  },
  greenhouse: {
    mechanical: [
      'Ventilation and heat retention',
      'Heating option checklist (if climate requires)',
    ],
    electrical: [
      'Control and sensor power',
      'Optional grow-light circuit schedule',
    ],
    plumbing: [
      'Irrigation and drainage',
      'Water storage interface',
    ],
  },
  warehouse: {
    mechanical: ['Ambient ventilation', 'Smoke / heat exhaust if required by code'],
    electrical: ['Lighting schedule', 'Material handling power points', 'Fire alarm interface'],
    plumbing: ['Wash-down points', 'Fire hydrant / hose reel if required'],
  },
  dairy: {
    mechanical: ['Milk cooling plant interface', 'Ventilation for animal / process areas'],
    electrical: ['Milking / process equipment load list', 'Hygiene zone power isolation'],
    plumbing: ['Hot and cold water for CIP', 'Dairy effluent collection'],
  },
  food_processing: {
    mechanical: ['Process HVAC / exhaust', 'Steam or hot-water if process requires'],
    electrical: ['Process line motor schedule', 'Emergency stop circuits'],
    plumbing: ['Process water', 'Effluent pre-treatment interface'],
  },
  grain_storage: {
    mechanical: ['Aeration fans', 'Dryer interface if present'],
    electrical: ['Fan and conveyor loads', 'Level / temperature monitoring power'],
    plumbing: ['Dust suppression water if used'],
  },
  fisheries: {
    mechanical: ['Aeration / RAS pump checklist', 'Blower redundancy'],
    electrical: ['Pump and blower continuous-duty circuits', 'Backup power priority'],
    plumbing: ['Intake, recirculation, and discharge lines', 'Biofilter hydraulic path'],
  },
  solar: {
    mechanical: ['Mounting structure interface (not structural design)'],
    electrical: ['Inverter and AC coupling checklist', 'Earthing and isolation'],
    plumbing: ['Module cleaning water if applicable'],
  },
  water_infrastructure: {
    mechanical: ['Pump set selection checklist'],
    electrical: ['Pump motor starters and protection'],
    plumbing: ['Suction / delivery piping, valves, non-return'],
  },
  other: {
    mechanical: ['Define mechanical scope with client'],
    electrical: ['Define electrical scope with client'],
    plumbing: ['Define plumbing scope with client'],
  },
};

function getDesignPackage(facilityType) {
  const key = FACILITY_TYPES.includes(facilityType) ? facilityType : 'other';
  const pkg = DESIGN_PACKAGES[key];
  return {
    facilityType: key,
    disciplines: {
      mechanical: pkg.mechanical,
      electrical: pkg.electrical,
      plumbing: pkg.plumbing,
    },
    provenance: {
      'mep.package': catalogSourced(),
    },
  };
}

/**
 * Optional capacity helpers — only run when the caller supplies every input.
 * Coefficients are explicit in the response so auditors can challenge them.
 * Missing input → field null + unavailable (never invent a load).
 */
function computeCapacityHints(inputs = {}) {
  const provenance = {};
  const data = {
    refrigerationTonsRough: null,
    ventilationCmhRough: null,
    electricalDemandKw: null,
    formulas: {},
  };

  // Rough sensible load proxy for cold rooms: Q_kW ≈ volume_m3 * ΔT_C * 0.04
  // (illustrative planning factor only — not a substitute for heat-load calculation).
  const vol = Number(inputs.volumeM3);
  const dT = Number(inputs.deltaTempC);
  if (Number.isFinite(vol) && vol > 0 && Number.isFinite(dT) && dT > 0) {
    const qKw = vol * dT * 0.04;
    data.refrigerationTonsRough = Math.round((qKw / 3.517) * 100) / 100;
    data.formulas.refrigeration =
      'TR ≈ (volume_m3 × ΔT_C × 0.04) / 3.517 — planning factor only; verify with full heat-load calc';
    provenance['mep.capacity.refrigerationTonsRough'] = inputSourced();
  } else {
    provenance['mep.capacity.refrigerationTonsRough'] = unavailable(
      'Requires inputs.volumeM3 and inputs.deltaTempC',
    );
  }

  // Ventilation: CMH ≈ volume_m3 × ACH
  const ach = Number(inputs.airChangesPerHour);
  if (Number.isFinite(vol) && vol > 0 && Number.isFinite(ach) && ach > 0) {
    data.ventilationCmhRough = Math.round(vol * ach * 100) / 100;
    data.formulas.ventilation = 'CMH = volume_m3 × ACH (user-supplied ACH)';
    provenance['mep.capacity.ventilationCmhRough'] = inputSourced();
  } else {
    provenance['mep.capacity.ventilationCmhRough'] = unavailable(
      'Requires inputs.volumeM3 and inputs.airChangesPerHour',
    );
  }

  // Electrical: sum of user-listed kW × diversity (default 1.0 if omitted)
  const loads = Array.isArray(inputs.electricalLoadsKw) ? inputs.electricalLoadsKw.map(Number).filter((n) => Number.isFinite(n) && n > 0) : [];
  if (loads.length > 0) {
    const diversity = Number.isFinite(Number(inputs.diversityFactor)) && Number(inputs.diversityFactor) > 0
      ? Number(inputs.diversityFactor)
      : 1;
    data.electricalDemandKw = Math.round(loads.reduce((a, b) => a + b, 0) * diversity * 100) / 100;
    data.formulas.electrical = `Demand_kW = sum(loads) × diversity (${diversity})`;
    provenance['mep.capacity.electricalDemandKw'] = inputSourced();
  } else {
    provenance['mep.capacity.electricalDemandKw'] = unavailable(
      'Requires inputs.electricalLoadsKw as non-empty array of kW values',
    );
  }

  return { data, provenance };
}

async function getProjectContext(projectId, userId, isAdmin = false) {
  if (!projectId) return null;
  const params = [projectId];
  let where = 'id = $1 AND deleted_at IS NULL';
  if (!isAdmin) {
    where += ' AND user_id = $2';
    params.push(userId);
  }
  try {
    const { rows } = await pool.query(`SELECT * FROM engineering_projects WHERE ${where}`, params);
    return rows[0] || null;
  } catch (error) {
    logger.warn('MEP project context lookup failed', { error: error.message });
    return null;
  }
}

/**
 * Build a full MEP design support plan for a facility (and optional project).
 */
async function buildMepDesignPlan({
  facilityType,
  projectId,
  userId,
  isAdmin,
  capacityInputs,
}) {
  if (!facilityType) throw new Error('facilityType is required');
  const type = FACILITY_TYPES.includes(facilityType) ? facilityType : 'other';

  const packageResult = getDesignPackage(type);
  const capacity = computeCapacityHints(capacityInputs || {});

  let project = null;
  const provenance = { ...packageResult.provenance, ...capacity.provenance };

  if (projectId) {
    project = await getProjectContext(projectId, userId, isAdmin);
    provenance['mep.project'] = project
      ? { source: 'db', verified: true, asOf: nowIso() }
      : unavailable('Project not found or not owned by user');
  } else {
    provenance['mep.project'] = unavailable('No projectId supplied');
  }

  const stages = [
    {
      id: 'scope',
      label: 'MEP scope package',
      status: 'complete',
      detail: `Package for ${type}`,
    },
    {
      id: 'mechanical',
      label: 'Mechanical checklist',
      status: packageResult.disciplines.mechanical.length ? 'in_progress' : 'unknown',
      detail: `${packageResult.disciplines.mechanical.length} items`,
    },
    {
      id: 'electrical',
      label: 'Electrical checklist',
      status: packageResult.disciplines.electrical.length ? 'in_progress' : 'unknown',
      detail: `${packageResult.disciplines.electrical.length} items`,
    },
    {
      id: 'plumbing',
      label: 'Plumbing checklist',
      status: packageResult.disciplines.plumbing.length ? 'in_progress' : 'unknown',
      detail: `${packageResult.disciplines.plumbing.length} items`,
    },
    {
      id: 'capacity',
      label: 'Capacity hints',
      status: (capacity.data.refrigerationTonsRough != null
        || capacity.data.ventilationCmhRough != null
        || capacity.data.electricalDemandKw != null)
        ? 'complete'
        : 'optional',
      detail: 'Only where inputs were provided',
    },
  ];

  return {
    planVersion: '1.0',
    generatedAt: nowIso(),
    facilityType: type,
    project: project
      ? {
        id: project.id,
        name: project.name,
        projectType: project.project_type,
        projectNumber: project.project_number,
        phase: project.phase,
        status: project.status,
      }
      : null,
    disciplines: packageResult.disciplines,
    capacityHints: capacity.data,
    stages,
    specialistLinks: [
      { section: 'engineering', label: 'Engineering Projects', href: '/engineering-projects' },
      { section: 'coldChain', label: 'Cold Storage', href: '/cold-storage' },
      { section: 'energy', label: 'Energy', href: '/energy' },
      { section: 'valueChain', label: 'Value-Chain Studio', href: '/value-chain-studio' },
    ],
    provenance,
    aiBoundary: 'AI may only produce an advisory design brief via POST .../brief. Never use AI for kW, TR, or pipe sizes.',
  };
}

/**
 * AI advisory design brief — narrative only.
 */
async function generateMepDesignBrief({ facilityType, projectName, disciplines, capacityHints, notes }) {
  const type = facilityType || 'agricultural facility';
  const mech = (disciplines && disciplines.mechanical) || [];
  const elec = (disciplines && disciplines.electrical) || [];
  const plumb = (disciplines && disciplines.plumbing) || [];

  const prompt = [
    'Write a concise MEP design support brief (max 180 words) for an Indian agri-infrastructure project.',
    `Facility type: ${type}.`,
    projectName ? `Project name: ${projectName}.` : '',
    `Mechanical checklist themes: ${mech.slice(0, 4).join('; ') || 'general'}.`,
    `Electrical checklist themes: ${elec.slice(0, 4).join('; ') || 'general'}.`,
    `Plumbing checklist themes: ${plumb.slice(0, 4).join('; ') || 'general'}.`,
    capacityHints && capacityHints.refrigerationTonsRough != null
      ? `User-derived rough TR hint (not final): ${capacityHints.refrigerationTonsRough}.`
      : 'No refrigeration capacity inputs were supplied.',
    capacityHints && capacityHints.electricalDemandKw != null
      ? `User-derived electrical demand hint (kW): ${capacityHints.electricalDemandKw}.`
      : 'No electrical load list was supplied.',
    notes ? `Operator notes: ${notes}.` : '',
    'Rules: Do not invent equipment models, exact kW, pipe diameters, or code citations.',
    'Tone: professional, farmer- and EPC-friendly, stress verification by licensed engineers.',
  ].filter(Boolean).join(' ');

  try {
    const result = await aiAPI.generateRecommendation({ prompt, maxTokens: 280 });
    const text = typeof result === 'string'
      ? result
      : (result && (result.text || result.recommendation)) || JSON.stringify(result);
    return {
      brief: text,
      provenance: aiSourced(),
    };
  } catch (error) {
    logger.warn('MEP design brief AI failed', { error: error.message });
    return {
      brief: null,
      provenance: unavailable(error.message),
    };
  }
}

function getCapabilities() {
  return {
    planVersion: '1.0',
    facilityTypes: FACILITY_TYPES,
    designRules: [
      'Design packages are deterministic checklists by facility type',
      'Capacity hints only from user inputs + documented formulas',
      'AI only for advisory design brief',
      'No FEA/CFD/BIM generation in this layer',
    ],
    endpoints: {
      capabilities: 'GET /api/v1/mep-design/capabilities',
      plan: 'POST /api/v1/mep-design/plan',
      brief: 'POST /api/v1/mep-design/brief',
    },
  };
}

module.exports = {
  FACILITY_TYPES,
  getDesignPackage,
  computeCapacityHints,
  buildMepDesignPlan,
  generateMepDesignBrief,
  getCapabilities,
};
