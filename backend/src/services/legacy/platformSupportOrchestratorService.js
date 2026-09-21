/**
 * Platform Support Orchestrator — highest-level integration of:
 *   - Farmer Support Clinic (plant / soil / livestock / poultry / fish)
 *   - AI Engineering Design Team + MEP
 *   - Value-Chain Studio lifecycle
 *   - Animal Health records (read context)
 *
 * Goal: one entry point that returns the right specialist path with real
 * cross-module context — not generic chatbot stubs.
 *
 * See DOCUMENTATION/PLATFORM_SUPPORT_INTEGRATION.md
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const clinic = require('./farmerSupportClinicService');
const engTeam = require('./aiEngineeringTeamService');
const mep = require('./mepDesignService');

const nowIso = () => new Date().toISOString();
const unavailable = (note) => ({ source: 'unavailable', verified: false, asOf: nowIso(), note: note || null });
const fromDb = () => ({ source: 'db', verified: true, asOf: nowIso() });
const catalog = (note) => ({ source: 'calculated', verified: true, asOf: nowIso(), note: note || 'Catalog' });

/** Intent taxonomy — maps farmer language to subsystem. */
const INTENT_MAP = [
  { intent: 'plant_health', keywords: ['leaf', 'crop', 'blight', 'rust', 'yellow', 'wilt', 'pest', 'tree'], route: 'clinic', species: 'plant' },
  { intent: 'soil', keywords: ['soil', 'salinity', 'hardpan', 'waterlog'], route: 'clinic', species: 'soil' },
  { intent: 'mastitis', keywords: ['mastitis', 'udder', 'quarter', 'clots in milk'], route: 'clinic', species: 'cow', packId: 'dairy_mastitis' },
  { intent: 'livestock', keywords: ['cow', 'buffalo', 'goat', 'sheep', 'pig', 'horse', 'fever', 'lameness'], route: 'clinic', species: null },
  { intent: 'poultry', keywords: ['chicken', 'poultry', 'hen', 'flock', 'mortality'], route: 'clinic', species: 'poultry' },
  { intent: 'fish', keywords: ['fish', 'pond', 'aquaculture', 'gasping'], route: 'clinic', species: 'fish' },
  { intent: 'cold_storage_design', keywords: ['cold storage', 'cold room', 'refrigeration design'], route: 'engineering', facilityType: 'cold_storage' },
  { intent: 'polyhouse_design', keywords: ['polyhouse', 'greenhouse design'], route: 'engineering', facilityType: 'polyhouse' },
  { intent: 'dairy_shed_design', keywords: ['dairy shed', 'milking parlour structure'], route: 'engineering', facilityType: 'dairy' },
  { intent: 'value_chain', keywords: ['price', 'subsidy', 'insurance', 'compliance', 'lifecycle', 'market'], route: 'value_chain' },
];

function detectIntent(text) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return { intent: 'unknown', route: 'hub', confidence: 0 };
  for (const row of INTENT_MAP) {
    if (row.keywords.some((k) => t.includes(k))) {
      return { intent: row.intent, route: row.route, species: row.species, packId: row.packId, facilityType: row.facilityType, confidence: 0.7 };
    }
  }
  return { intent: 'general', route: 'hub', confidence: 0.3 };
}

async function loadAnimalHealthContext(userId) {
  if (!userId) return { data: null, provenance: unavailable('No userId') };
  try {
    const { rows: exams } = await pool.query(
      `SELECT id, animal_type, health_status, examination_date, temperature_c, notes
         FROM animal_health_examinations
        WHERE user_id = $1 OR created_by = $1
        ORDER BY examination_date DESC NULLS LAST, created_at DESC
        LIMIT 8`,
      [userId],
    ).catch(async () => {
      // Schema variants — try without user filter columns
      const r = await pool.query(
        `SELECT id, animal_type, health_status, examination_date, temperature_c, notes
           FROM animal_health_examinations
          ORDER BY created_at DESC LIMIT 5`,
      );
      return r;
    });
    return {
      data: { recentExaminations: exams || [] },
      provenance: fromDb(),
    };
  } catch (e) {
    logger.warn('orchestrator animal health context', { error: e.message });
    return { data: { recentExaminations: [] }, provenance: unavailable(e.message) };
  }
}

async function loadEngineeringContext(userId) {
  if (!userId) return { data: null, provenance: unavailable('No userId') };
  try {
    const { rows } = await pool.query(
      `SELECT id, name, project_number, project_type, phase, status
         FROM engineering_projects
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY updated_at DESC NULLS LAST, created_at DESC
        LIMIT 8`,
      [userId],
    );
    return { data: { projects: rows }, provenance: fromDb() };
  } catch (e) {
    return { data: { projects: [] }, provenance: unavailable(e.message) };
  }
}

/**
 * Full support desk snapshot for a logged-in operator.
 */
async function buildSupportDesk({ userId, productId, farmerId, queryText }) {
  const detected = detectIntent(queryText);
  const [healthCtx, engCtx] = await Promise.all([
    loadAnimalHealthContext(userId),
    loadEngineeringContext(userId),
  ]);

  const modules = {
    farmerClinic: {
      href: '/farmer-support-clinic',
      api: '/api/v1/farmer-support-clinic',
      specialists: clinic.getCapabilities().specialists,
      deepPacks: clinic.getCapabilities().deepPacks,
      status: 'ready',
    },
    aiEngineering: {
      href: '/ai-engineering-design',
      api: '/api/v1/ai-engineering-team',
      roles: engTeam.getCapabilities().roles,
      status: 'ready',
    },
    mepDesign: {
      href: '/mep-design',
      api: '/api/v1/mep-design',
      status: 'ready',
    },
    valueChainStudio: {
      href: '/value-chain-studio',
      api: '/api/v1/value-chain-studio',
      status: productId ? 'ready' : 'needs_product_id',
      productId: productId || null,
    },
    animalHealth: {
      href: '/animal-health',
      api: '/api/v1/livestock/health',
      recentExaminations: healthCtx.data?.recentExaminations || [],
      status: (healthCtx.data?.recentExaminations || []).length ? 'has_records' : 'empty',
    },
    engineeringProjects: {
      href: '/engineering-projects',
      projects: engCtx.data?.projects || [],
      status: (engCtx.data?.projects || []).length ? 'has_projects' : 'empty',
    },
  };

  const recommended = [];
  if (detected.route === 'clinic') {
    recommended.push({
      action: 'open_clinic',
      href: '/farmer-support-clinic',
      species: detected.species,
      packId: detected.packId || null,
      reason: `Intent: ${detected.intent}`,
    });
  }
  if (detected.route === 'engineering') {
    recommended.push({
      action: 'open_engineering',
      href: '/ai-engineering-design',
      facilityType: detected.facilityType || 'cold_storage',
      reason: `Intent: ${detected.intent}`,
    });
  }
  if (detected.route === 'value_chain' && productId) {
    recommended.push({
      action: 'open_value_chain',
      href: `/value-chain-studio?productId=${productId}`,
      reason: 'Pricing / subsidy / compliance lifecycle',
    });
  }
  if (!(healthCtx.data?.recentExaminations || []).length && /cow|buffalo|goat|pig|sheep|horse|poultry/.test(String(queryText || '').toLowerCase())) {
    recommended.push({
      action: 'record_exam',
      href: '/animal-health',
      reason: 'No recent examinations on file — record baseline health',
    });
  }

  const provenance = {
    'desk.intent': catalog(`Detected ${detected.intent} via keyword map`),
    'desk.animalHealth': healthCtx.provenance,
    'desk.engineering': engCtx.provenance,
  };

  return {
    planVersion: '1.0',
    generatedAt: nowIso(),
    detected,
    modules,
    recommended,
    integrationMap: {
      clinic_to_animal_health: '/animal-health',
      clinic_to_engineering: '/ai-engineering-design',
      engineering_to_mep: '/mep-design',
      engineering_to_projects: '/engineering-projects',
      value_chain_to_clinic: '/farmer-support-clinic',
      value_chain_to_engineering: '/ai-engineering-design',
      value_chain_to_cold_storage: '/cold-storage',
    },
    farmerId: farmerId || null,
    productId: productId || null,
    provenance,
  };
}

/**
 * Execute a routed consult: clinic or engineering plan in one call.
 */
async function executeRoutedSupport({
  userId,
  isAdmin,
  queryText,
  species,
  packId,
  symptoms,
  photoDescription,
  imageUrl,
  sessionId,
  facilityType,
  structuralInputs,
  capacityInputs,
  state,
  projectId,
}) {
  const detected = detectIntent(queryText || symptoms || '');
  const route = detected.route;

  if (route === 'engineering' || facilityType) {
    const plan = await engTeam.buildDesignTeamPlan({
      facilityType: facilityType || detected.facilityType || 'cold_storage',
      projectId: projectId || null,
      userId,
      isAdmin,
      structuralInputs: structuralInputs || {},
      capacityInputs: capacityInputs || {},
      state: state || null,
    });
    return {
      route: 'engineering',
      detected,
      engineeringPlan: plan,
      clinicResult: null,
      next: { href: '/ai-engineering-design', label: 'Open Design Team UI' },
    };
  }

  if (route === 'clinic' || species || symptoms) {
    const clinicResult = await clinic.runAdvisoryConsult({
      speciesKey: species || detected.species || 'plant',
      symptoms: symptoms || queryText,
      photoDescription,
      imageUrl,
      locationState: state,
      packId: packId || detected.packId || null,
      sessionId,
    });
    return {
      route: 'clinic',
      detected,
      clinicResult,
      engineeringPlan: null,
      next: { href: '/farmer-support-clinic', label: 'Continue in Clinic UI' },
    };
  }

  const desk = await buildSupportDesk({ userId, queryText });
  return {
    route: 'hub',
    detected,
    desk,
    clinicResult: null,
    engineeringPlan: null,
    next: { href: '/platform-support', label: 'Open Support Hub' },
  };
}

function getCapabilities() {
  return {
    planVersion: '1.0',
    concept: 'Unified orchestrator for Farmer Clinic + AI Engineering + Value-Chain + Animal Health',
    routes: ['clinic', 'engineering', 'value_chain', 'hub'],
    intents: INTENT_MAP.map((i) => i.intent),
    endpoints: {
      capabilities: 'GET /api/v1/platform-support/capabilities',
      desk: 'POST /api/v1/platform-support/desk',
      execute: 'POST /api/v1/platform-support/execute',
    },
    related: {
      clinic: '/api/v1/farmer-support-clinic',
      engineering: '/api/v1/ai-engineering-team',
      mep: '/api/v1/mep-design',
      valueChain: '/api/v1/value-chain-studio',
    },
  };
}

module.exports = {
  detectIntent,
  buildSupportDesk,
  executeRoutedSupport,
  getCapabilities,
  INTENT_MAP,
};
