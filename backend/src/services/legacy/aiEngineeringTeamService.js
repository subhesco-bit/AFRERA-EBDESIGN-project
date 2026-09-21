/**
 * AI Engineering Design Team — coordinated specialist engineers for agri infrastructure.
 *
 * Concept: a virtual design team that works for the operator. Each role produces a
 * deterministic work package (checklists, input-driven formulas, handoffs). AI is
 * used only for advisory team briefs — never for inventing loads, member sizes,
 * or code compliance results.
 *
 * Roles:
 *   lead_architect, structural, mep, agricultural, cost_estimator, compliance
 *
 * Honesty bar (same as engineeringProjectService / mepDesignService):
 *   - No fake FEA / CFD / BIM generation
 *   - Missing inputs → unavailable, not zero
 *   - Formulas documented in the response
 *
 * See DOCUMENTATION/AI_ENGINEERING_DESIGN_TEAM.md
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { aiAPI } = require('./aiBackboneService');
const mepDesignService = require('./mepDesignService');

const nowIso = () => new Date().toISOString();
const unavailable = (note) => ({ source: 'unavailable', verified: false, asOf: nowIso(), note: note || null });
const catalog = (note) => ({ source: 'calculated', verified: true, asOf: nowIso(), note: note || 'Catalog / rules' });
const fromInput = () => ({ source: 'calculated', verified: true, asOf: nowIso(), note: 'User inputs + documented formula' });
const fromDb = () => ({ source: 'db', verified: true, asOf: nowIso() });
const fromAi = () => ({ source: 'ai', verified: false, asOf: nowIso(), note: 'Advisory only' });

const FACILITY_TYPES = mepDesignService.FACILITY_TYPES || [
  'cold_storage', 'polyhouse', 'greenhouse', 'warehouse', 'dairy',
  'food_processing', 'grain_storage', 'fisheries', 'solar', 'water_infrastructure', 'other',
];

const TEAM_ROLES = [
  {
    id: 'lead_architect',
    title: 'Lead Design Architect',
    focus: 'Scope, options, coordination of disciplines',
  },
  {
    id: 'structural',
    title: 'Structural Engineer',
    focus: 'Frame system, loads checklist, foundation interface',
  },
  {
    id: 'mep',
    title: 'MEP Engineer',
    focus: 'Mechanical, electrical, plumbing design packages',
  },
  {
    id: 'agricultural',
    title: 'Agricultural Infrastructure Engineer',
    focus: 'Process layout, capacity, agri-specific systems',
  },
  {
    id: 'cost_estimator',
    title: 'Cost Estimator',
    focus: 'BOQ categories and estimate readiness (links to real rates)',
  },
  {
    id: 'compliance',
    title: 'Compliance & Approvals Engineer',
    focus: 'Permits, codes checklist, stakeholder gates',
  },
];

/** Deterministic structural work package — no invented member sizes. */
function structuralPackage(facilityType, inputs = {}) {
  const packages = {
    cold_storage: [
      'Confirm design loads: dead, live, wind, seismic (IS codes — verify locally)',
      'Insulated panel / PEB / RCC interface checklist',
      'Floor slab and racking load path',
      'Expansion joint and thermal movement',
    ],
    polyhouse: [
      'Pipe / greenhouse frame system selection checklist',
      'Wind and crop-load assumptions to be confirmed on site',
      'Foundation / ground anchor type',
    ],
    warehouse: [
      'PEB vs RCC bay spacing options',
      'Crane / racking loads if applicable',
      'Roof drainage and wind uplift',
    ],
    dairy: [
      'Animal housing span and wash-down floor detailing',
      'Process room structural separation',
    ],
    solar: [
      'Mounting structure interface (structure by specialist — not sized here)',
      'Wind and uplift checklist for region',
    ],
  };
  const items = packages[facilityType] || [
    'Define primary structural system with licensed engineer',
    'Document load assumptions before analysis',
    'Foundation type depends on soil report (not invented here)',
  ];

  const provenance = { 'structural.package': catalog('Structural checklist catalog') };
  const hints = { spanM: null, approxBayAreaM2: null, formulas: {} };

  const length = Number(inputs.lengthM);
  const width = Number(inputs.widthM);
  if (Number.isFinite(length) && length > 0 && Number.isFinite(width) && width > 0) {
    hints.approxBayAreaM2 = Math.round(length * width * 100) / 100;
    hints.formulas.area = 'area_m2 = length_m × width_m';
    provenance['structural.hints.approxBayAreaM2'] = fromInput();
  } else {
    provenance['structural.hints.approxBayAreaM2'] = unavailable('Requires inputs.lengthM and inputs.widthM');
  }

  return { role: 'structural', checklist: items, hints, provenance };
}

function agriculturalPackage(facilityType) {
  const map = {
    cold_storage: ['Chamber zoning', 'Product flow in/out', 'Dock and ante-room'],
    polyhouse: ['Bed / gutter layout', 'Climate zones', 'Worker access paths'],
    greenhouse: ['Crop rows', 'Irrigation heads', 'Climate control zones'],
    dairy: ['Milking parlour flow', 'Animal housing density checklist', 'Milk room adjacency'],
    food_processing: ['Hygienic zoning (dirty/clean)', 'Process line sequence', 'CIP access'],
    grain_storage: ['Silo / warehouse fill path', 'Aeration access', 'Receiving pit'],
    fisheries: ['Tank / raceway layout', 'Biosecurity barriers', 'Harvest access'],
    water_infrastructure: ['Intake → treatment → distribution sequence'],
    solar: ['Array rows and access lanes', 'Inverter placement zone'],
  };
  return {
    role: 'agricultural',
    checklist: map[facilityType] || ['Define process flow with operations team'],
    provenance: { 'agricultural.package': catalog('Agri process checklist') },
  };
}

function costPackage(facilityType) {
  const categories = {
    cold_storage: ['civil', 'insulation', 'refrigeration', 'electrical', 'controls'],
    polyhouse: ['structure', 'cladding', 'irrigation', 'climate', 'electrical'],
    warehouse: ['civil', 'structure', 'roofing', 'electrical', 'fire'],
    dairy: ['civil', 'equipment', 'electrical', 'plumbing', 'hygiene'],
    food_processing: ['civil', 'process_equipment', 'hvac', 'electrical', 'effluent'],
    solar: ['modules', 'structure', 'inverters', 'cabling', 'civil'],
  };
  return {
    role: 'cost_estimator',
    boqCategories: categories[facilityType] || ['civil', 'structure', 'mep', 'equipment', 'contingency'],
    note: 'Unit rates must come from material_prices / labor_rates / equipment_rates or caller-supplied BOQ — never invented.',
    specialistHref: '/engineering-projects',
    provenance: { 'cost.package': catalog('BOQ category catalog') },
  };
}

function compliancePackage(facilityType, state) {
  const base = [
    'Local building permission / development authority',
    'Fire NOC if occupancy requires',
    'Electrical safety / CEIG where applicable',
    'Environmental consent if effluent or cold-chain refrigerants regulated',
  ];
  const extra = {
    cold_storage: ['FSSAI / food safety if storing food', 'Refrigerant handling norms'],
    dairy: ['FSSAI dairy', 'Animal welfare / local livestock rules'],
    food_processing: ['FSSAI factory', 'Factory Act / labour compliance'],
    fisheries: ['Coastal / water-use permissions if applicable'],
    solar: ['Net-metering / DISCOM interconnection'],
  };
  return {
    role: 'compliance',
    checklist: base.concat(extra[facilityType] || []),
    jurisdictionNote: state
      ? `Operator-declared state: ${state} — verify with local authority lists`
      : 'No state supplied — use national + local authority lists',
    provenance: {
      'compliance.package': catalog('Compliance checklist catalog'),
    },
  };
}

function leadPackage(facilityType, teamSummaries) {
  return {
    role: 'lead_architect',
    coordination: [
      'Confirm facility type and capacity targets with client',
      'Sequence: concept → discipline packages → BOQ → approvals → construction',
      'Handoff structural / MEP / agri / cost / compliance work packages',
    ],
    openQuestions: teamSummaries.filter((t) => t.hasGaps).map((t) => t.gapNote),
    provenance: { 'lead.package': catalog('Lead coordination catalog') },
  };
}

async function loadProject(projectId, userId, isAdmin) {
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
  } catch (e) {
    logger.warn('AI eng team project load failed', { error: e.message });
    return null;
  }
}

/**
 * Full design team plan for one facility (+ optional engineering project).
 */
async function buildDesignTeamPlan({
  facilityType,
  projectId,
  userId,
  isAdmin,
  structuralInputs,
  capacityInputs,
  state,
}) {
  if (!facilityType) throw new Error('facilityType is required');
  const type = FACILITY_TYPES.includes(facilityType) ? facilityType : 'other';

  const project = await loadProject(projectId, userId, isAdmin);
  const mep = await mepDesignService.buildMepDesignPlan({
    facilityType: type,
    projectId,
    userId,
    isAdmin,
    capacityInputs: capacityInputs || {},
  });

  const structural = structuralPackage(type, structuralInputs || {});
  const agricultural = agriculturalPackage(type);
  const cost = costPackage(type);
  const compliance = compliancePackage(type, state);

  const teamSummaries = [
    {
      id: 'structural',
      hasGaps: structural.hints.approxBayAreaM2 == null,
      gapNote: structural.hints.approxBayAreaM2 == null ? 'Structural: provide lengthM × widthM for area hint' : null,
    },
    {
      id: 'mep',
      hasGaps: !mep.capacityHints || (
        mep.capacityHints.refrigerationTonsRough == null
        && mep.capacityHints.electricalDemandKw == null
      ),
      gapNote: 'MEP: optional volume/loads improve capacity hints',
    },
  ];

  const lead = leadPackage(type, teamSummaries);

  const engineers = TEAM_ROLES.map((role) => {
    let packageData = null;
    if (role.id === 'lead_architect') packageData = lead;
    if (role.id === 'structural') packageData = structural;
    if (role.id === 'mep') {
      packageData = {
        role: 'mep',
        disciplines: mep.disciplines,
        capacityHints: mep.capacityHints,
        stages: mep.stages,
        provenance: mep.provenance,
      };
    }
    if (role.id === 'agricultural') packageData = agricultural;
    if (role.id === 'cost_estimator') packageData = cost;
    if (role.id === 'compliance') packageData = compliance;
    return {
      ...role,
      status: 'assigned',
      package: packageData,
    };
  });

  const provenance = {
    'team.facilityType': catalog('Facility type validated against catalog'),
    'team.project': project ? fromDb() : unavailable(projectId ? 'Project not found or not owned' : 'No projectId'),
    ...structural.provenance,
    ...agricultural.provenance,
    ...cost.provenance,
    ...compliance.provenance,
    ...lead.provenance,
  };

  return {
    planVersion: '1.0',
    generatedAt: nowIso(),
    facilityType: type,
    project: project
      ? {
        id: project.id,
        name: project.name,
        projectNumber: project.project_number,
        projectType: project.project_type,
        phase: project.phase,
        status: project.status,
      }
      : null,
    team: engineers,
    stages: [
      { id: 'brief', label: 'Team assembled', status: 'complete', detail: `${TEAM_ROLES.length} engineers` },
      { id: 'packages', label: 'Work packages issued', status: 'complete', detail: 'Deterministic checklists' },
      { id: 'inputs', label: 'Capacity / geometry inputs', status: teamSummaries.some((t) => t.hasGaps) ? 'in_progress' : 'complete', detail: 'Optional for richer hints' },
      { id: 'boq', label: 'Cost estimate via Engineering Projects', status: 'optional', detail: 'Use /engineering-projects rates' },
      { id: 'approvals', label: 'Compliance gates', status: 'in_progress', detail: 'Local authority verification required' },
    ],
    specialistLinks: [
      { section: 'mep', label: 'MEP Design Studio', href: '/mep-design' },
      { section: 'engineering', label: 'Engineering Projects', href: '/engineering-projects' },
      { section: 'valueChain', label: 'Value-Chain Studio', href: '/value-chain-studio' },
      { section: 'coldChain', label: 'Cold Storage', href: '/cold-storage' },
      { section: 'compliance', label: 'Compliance', href: '/compliance' },
    ],
    provenance,
    aiBoundary: 'AI team brief is advisory only. No invented loads, member sizes, or approval outcomes.',
  };
}

async function generateTeamBrief({ facilityType, projectName, team, notes }) {
  const roleLines = (team || []).map((e) => {
    const n = e.package && (e.package.checklist || e.package.boqCategories || e.package.coordination);
    const count = Array.isArray(n) ? n.length : 0;
    return `${e.title}: ${count} checklist/coord items`;
  }).join('. ');

  const prompt = [
    'You are the Lead Design Architect coordinating a virtual AI engineering team for Indian agri-infrastructure.',
    `Facility: ${facilityType || 'facility'}.`,
    projectName ? `Project: ${projectName}.` : '',
    `Team status: ${roleLines || 'team packages ready'}.`,
    notes ? `Operator notes: ${notes}.` : '',
    'Write a 150–200 word design coordination brief for the client and EPC.',
    'Do NOT invent kW, TR, beam sizes, costs, or approval status.',
    'Stress that licensed engineers must verify all numbers and local codes.',
    'Tone: professional, clear, action-oriented.',
  ].filter(Boolean).join(' ');

  try {
    const result = await aiAPI.generateRecommendation({ prompt, maxTokens: 320 });
    const text = typeof result === 'string'
      ? result
      : (result && (result.text || result.recommendation)) || JSON.stringify(result);
    return { brief: text, provenance: fromAi() };
  } catch (error) {
    logger.warn('AI engineering team brief failed', { error: error.message });
    return { brief: null, provenance: unavailable(error.message) };
  }
}

function getCapabilities() {
  return {
    planVersion: '1.0',
    concept: 'Team of AI engineers for agri-infrastructure design support',
    roles: TEAM_ROLES,
    facilityTypes: FACILITY_TYPES,
    designRules: [
      'Each engineer issues a deterministic work package',
      'Formulas only on user-supplied geometry/loads',
      'AI only for team advisory brief',
      'No FEA/CFD/BIM generation',
      'Cost rates from BOQ tables or caller — never invented',
    ],
    endpoints: {
      capabilities: 'GET /api/v1/ai-engineering-team/capabilities',
      plan: 'POST /api/v1/ai-engineering-team/plan',
      brief: 'POST /api/v1/ai-engineering-team/brief',
    },
    related: {
      mep: '/api/v1/mep-design',
      projects: '/api/v1/engineering-project',
    },
  };
}

module.exports = {
  TEAM_ROLES,
  FACILITY_TYPES,
  buildDesignTeamPlan,
  generateTeamBrief,
  getCapabilities,
};
