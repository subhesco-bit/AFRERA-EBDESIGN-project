/**
 * Value-Chain Studio — orchestrator service (production v2).
 * buildLifecyclePlan: deterministic read path. AI only for positioning/image.
 * Handoffs: pricing, cold-chain, funding, engineering, AI design, MEP, farmer clinic, platform support.
 * See DOCUMENTATION/VALUE_CHAIN_STUDIO_ARCHITECTURE.md
 */
'use strict';

const pool = require('../database/pool');
const farmerValueService = require('./legacy/farmerValueService');
const valueCommerceService = require('./legacy/valueCommerceService');
const dynamicPricingService = require('./legacy/dynamicPricingService');
const coldStorageService = require('./legacy/coldStorageService');
const insurancePolicyIssuanceService = require('./legacy/insurancePolicyIssuanceService');
const governmentSchemeService = require('./legacy/governmentSchemeService');
const { aiAPI } = require('./legacy/aiBackboneService');
const productMediaAIService = require('./legacy/productMediaAIService');
const engineeringProjectService = require('./legacy/engineeringProjectService');
const equipmentExchangeService = require('./legacy/equipmentExchangeService');

// Project-wide evidence/provenance standard — see backend/src/utils/evidence.js
// for the taxonomy this service originated and every other service should
// now use instead of a flat true/false "verified" flag.
const { evidence, unavailable, dbSourced, calculatedSourced, inferred } = require('../utils/evidence');

const nowIso = () => new Date().toISOString();

async function getProductContext(productId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category_id, p.base_price, p.is_active, c.name AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = $1`, [productId]);
  return rows[0] || null;
}

async function getFarmerContext(farmerId, requester = null) {
  if (!farmerId) return null;
  const canReadAny = requester?.role === 'admin';
  if (requester && !canReadAny && !requester.id) throw new Error('Farmer context is not accessible');
  const { rows } = await pool.query(
    `SELECT f.id, f.user_id, f.fpo_id, f.farm_size_hectares, f.fdi_score, f.fdi_grade,
            a.state AS state, a.city AS city
       FROM farmers f LEFT JOIN addresses a ON a.id = f.farm_location_id
      WHERE f.id = $1${requester && !canReadAny ? ' AND f.user_id = $2' : ''}`,
    requester && !canReadAny ? [farmerId, requester.id] : [farmerId]);
  if (!rows[0] && requester && !canReadAny) throw new Error('Farmer context is not accessible');
  return rows[0] || null;
}

async function getPricingSection(product) {
  const provenance = {};
  const data = { floorBenchmark: null, activeLot: null, transparency: null };
  try {
    data.floorBenchmark = await dynamicPricingService.floorBenchmark(product.category_name || product.name);
    const verified = Boolean(data.floorBenchmark && data.floorBenchmark.count >= 2);
    provenance['pricing.floorBenchmark'] = dbSourced('farmer_listings.floor_price_per_kg + crops', verified,
      verified ? null : 'At least two open peer listings are required for a verified range.');
  } catch (e) { provenance['pricing.floorBenchmark'] = unavailable(e.message); }
  try {
    const { rows } = await pool.query(
      `SELECT lot_code FROM pricing_lots WHERE product_id = $1 AND status = 'active' ORDER BY expires_on ASC LIMIT 1`,
      [String(product.id)]);
    if (rows.length) {
      data.activeLot = await dynamicPricingService.priceForLot(rows[0].lot_code);
      provenance['pricing.activeLot'] = calculatedSourced('pricing_lots + dynamicPricingService.priceForLot', true,
        'Deterministic lot-price rules applied to the active pricing lot.');
    } else {
      provenance['pricing.activeLot'] = unavailable('No active yield-managed pricing lot for this product.');
    }
  } catch (e) { provenance['pricing.activeLot'] = unavailable(e.message); }
  const base = product.base_price != null ? Number(product.base_price) : null;
  const floorMin = data.floorBenchmark && Number.isFinite(Number(data.floorBenchmark.min)) ? Number(data.floorBenchmark.min) : null;
  const floorMax = data.floorBenchmark && Number.isFinite(Number(data.floorBenchmark.max)) ? Number(data.floorBenchmark.max) : null;
  const lotPrice = data.activeLot && Number.isFinite(Number(data.activeLot.priceInrPerKg)) ? Number(data.activeLot.priceInrPerKg) : null;
  data.transparency = {
    catalogBasePriceInr: base, peerFloorMinInr: floorMin, peerFloorMaxInr: floorMax,
    activeLotPriceInrPerKg: lotPrice,
    deltaBaseVsFloorMidInr: (base != null && floorMin != null && floorMax != null) ? Math.round(base - ((floorMin + floorMax) / 2)) : null,
    note: 'All figures from products / farmer_listings / pricing_lots — not estimated.',
  };
  const hasVerifiedFloor = Boolean(provenance['pricing.floorBenchmark']?.verified);
  provenance['pricing.transparency'] = calculatedSourced('products.base_price + verified pricing inputs',
    base != null || hasVerifiedFloor || lotPrice != null,
    'deltaBaseVsFloorMidInr = catalogBasePriceInr - ((peerFloorMinInr + peerFloorMaxInr) / 2).');
  return { data, provenance };
}

async function getValueScoreSection(product) {
  const provenance = {}; const data = { score: null };
  try { data.score = await valueCommerceService.getProductValueScore(product.id); provenance['valueScore.score'] = dbSourced('product_value_scores', true); }
  catch (e) { provenance['valueScore.score'] = unavailable(e.message); }
  return { data, provenance };
}

async function getColdChainSection(product) {
  const provenance = {}; const data = { systemStatus: null, facilities: [], requirements: null };
  try { data.systemStatus = await coldStorageService.getSystemStatus(); provenance['coldChain.systemStatus'] = dbSourced('cold_storage_temperature_readings + cold_storage_facilities', true); }
  catch (e) { provenance['coldChain.systemStatus'] = unavailable(e.message); }
  try { data.facilities = (await coldStorageService.getFacilitiesWithStatus()).slice(0, 5); provenance['coldChain.facilities'] = dbSourced('cold_storage_facilities + bookings', true); }
  catch (e) { provenance['coldChain.facilities'] = unavailable(e.message); }
  const cat = product && product.category_name ? String(product.category_name).toLowerCase() : '';
  const hints = ['dairy', 'meat', 'fish', 'seafood', 'fruit', 'vegetable', 'horticulture', 'flower', 'mushroom'];
  const needsCold = hints.some((h) => cat.includes(h));
  data.requirements = {
    category: product ? product.category_name : null,
    likelyRequiresColdChain: needsCold,
    checklist: needsCold
      ? ['Confirm temperature band in cold-storage workspace', 'Book capacity before harvest window', 'Verify last-mile insulated transport']
      : ['Confirm ambient storage is acceptable for this category', 'Document handling SOPs'],
    note: 'Flags derived from category name only — not sensor measurements.',
  };
  provenance['coldChain.requirements'] = inferred('products.category_id -> categories.name',
    'Planning flag only. Confirm the actual temperature band and handling SOP before shipment.',
    'Case-insensitive category keyword match against a fixed perishable-category list.');
  return { data, provenance };
}

async function getInsuranceSection(farmer) {
  const provenance = {}; const data = { policies: [] };
  if (!farmer || !farmer.user_id) { provenance['insurance.policies'] = unavailable('No linked farmer/user account.'); return { data, provenance }; }
  try {
    const result = await insurancePolicyIssuanceService.getUserPolicies(farmer.user_id, { limit: 10 });
    data.policies = result.policies || []; provenance['insurance.policies'] = dbSourced('insurance_policies', true);
  } catch (e) { provenance['insurance.policies'] = unavailable(e.message); }
  return { data, provenance };
}

async function getSubsidiesSection(product, farmer) {
  const provenance = {}; const data = { schemeEligibility: null, unclaimed: null };
  try {
    data.schemeEligibility = await governmentSchemeService.checkSchemeEligibility({
      category: product.category_name || undefined, state: farmer && farmer.state ? farmer.state : undefined,
    });
    provenance['subsidies.schemeEligibility'] = calculatedSourced('government_schemes verified registry', true,
      'Deterministic category/state filtering; candidates require primary-source confirmation before application.');
  } catch (e) { provenance['subsidies.schemeEligibility'] = unavailable(e.message); }
  if (farmer) {
    try { data.unclaimed = await farmerValueService.detectUnclaimedSubsidy(farmer.id); provenance['subsidies.unclaimed'] = calculatedSourced('scheme support records + farmer area/claims', true, 'Stored scheme rates and recorded farmer facts; only claimable_now items are totaled.'); }
    catch (e) { provenance['subsidies.unclaimed'] = unavailable(e.message); }
  } else { provenance['subsidies.unclaimed'] = unavailable('No farmer context supplied.'); }
  return { data, provenance };
}

async function getComplianceSection(product, farmer) {
  const provenance = {}; const data = { gates: [] };
  const ids = [product.id, farmer ? farmer.id : null].filter(Boolean);
  try {
    const { rows } = await pool.query(
      `SELECT id, entity_type, entity_id, requirement_type, requirement_description,
              due_date, status, completed_date, verified_by, notes, created_at
         FROM compliance_records WHERE entity_id = ANY($1::uuid[]) ORDER BY created_at DESC LIMIT 50`, [ids]);
    data.gates = rows; provenance['compliance.gates'] = dbSourced('compliance_records', rows.length > 0,
      rows.length ? null : 'No tracked record is not evidence that compliance is clear. Add or verify the required gates.');
  } catch (e) { provenance['compliance.gates'] = unavailable(e.message); }
  return { data, provenance };
}

async function getFarmerValueSection(farmer) {
  const provenance = {}; const data = { fvi: null };
  if (!farmer) { provenance['farmerValue.fvi'] = unavailable('No farmer context supplied.'); return { data, provenance }; }
  try { data.fvi = await farmerValueService.computeFVI({ farmerId: farmer.id }); provenance['farmerValue.fvi'] = calculatedSourced('farmer value source records', true, 'Deterministic Farmer Value Index calculation with persistence disabled.'); }
  catch (e) { provenance['farmerValue.fvi'] = unavailable(e.message); }
  return { data, provenance };
}

async function getEngineeringSection(farmer) {
  const provenance = {}; const data = { projects: [] };
  if (!farmer || !farmer.user_id) { provenance['engineering.projects'] = unavailable('No linked farmer/user account.'); return { data, provenance }; }
  try { data.projects = await engineeringProjectService.listProjects(farmer.user_id, { limit: 10 }); provenance['engineering.projects'] = dbSourced('engineering_projects', true); }
  catch (e) { provenance['engineering.projects'] = unavailable(e.message); }
  return { data, provenance };
}

async function getSharedInfrastructureSection(product) {
  const provenance = {}; const data = { availableAssets: [] };
  try {
    const where = ["a.status = 'available'"]; const params = [];
    if (product.category_name) { params.push('%' + product.category_name + '%'); where.push('t.category ILIKE $' + params.length); }
    const { rows } = await pool.query(
      `SELECT a.id, a.name, t.name AS type_name, t.category, a.capacity, a.daily_rate, a.utilization_rate, a.status
         FROM assets a LEFT JOIN asset_types t ON t.id = a.type_id WHERE ${where.join(' AND ')} ORDER BY a.created_at DESC LIMIT 10`, params);
    data.availableAssets = rows; provenance['sharedInfrastructure.availableAssets'] = dbSourced('assets + asset_types', true);
  } catch (e) { provenance['sharedInfrastructure.availableAssets'] = unavailable(e.message); }
  return { data, provenance };
}

async function getEquipmentRentalSection() {
  const provenance = {}; const data = { availableListings: [] };
  try { data.availableListings = (await equipmentExchangeService.listAvailable({})).slice(0, 10); provenance['equipmentRental.availableListings'] = dbSourced('equipment listings', true); }
  catch (e) { provenance['equipmentRental.availableListings'] = unavailable(e.message); }
  return { data, provenance };
}

async function getFundingSection(farmer) {
  const provenance = {}; const data = { applications: [], summary: null };
  if (!farmer || !farmer.user_id) { provenance['funding.applications'] = unavailable('No linked farmer/user account.'); return { data, provenance }; }
  try {
    const { rows } = await pool.query(
      `SELECT id, loan_type, amount_requested, amount_approved, status, created_at, updated_at
         FROM loan_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [farmer.user_id]);
    data.applications = rows;
    const open = rows.filter((r) => r.status && !['rejected', 'closed', 'disbursed'].includes(String(r.status).toLowerCase()));
    const approved = rows.filter((r) => ['approved', 'disbursed'].includes(String(r.status || '').toLowerCase()));
    data.summary = {
      totalApplications: rows.length, openCount: open.length, approvedOrDisbursedCount: approved.length,
      totalRequested: rows.reduce((s, r) => s + (Number(r.amount_requested) || 0), 0),
      totalApproved: approved.reduce((s, r) => s + (Number(r.amount_approved) || 0), 0),
    };
    provenance['funding.applications'] = dbSourced('loan_applications', true);
    provenance['funding.summary'] = calculatedSourced('loan_applications', true,
      'Counts by stored status; totals are sums of amount_requested and approved/disbursed amount_approved.');
  } catch (e) {
    provenance['funding.applications'] = unavailable(e.message);
    provenance['funding.summary'] = unavailable(e.message);
  }
  return { data, provenance };
}

async function getLogisticsSection(product, farmer) {
  const provenance = {}; const data = { shipments: [] };
  try {
    const params = [String(product.id)]; let farmerClause = '';
    if (farmer && farmer.id) { params.push(String(farmer.id)); farmerClause = ' OR farmer_id = $2'; }
    const { rows } = await pool.query(
      `SELECT id, tracking_number, status, origin, destination, product_id, farmer_id, estimated_delivery, created_at
         FROM shipments WHERE product_id = $1${farmerClause} ORDER BY created_at DESC LIMIT 15`, params);
    data.shipments = rows; provenance['logistics.shipments'] = dbSourced('shipments', true);
    if (!rows.length) provenance['logistics.shipments'].note = 'No shipments linked to this product/farmer yet.';
  } catch (e) { provenance['logistics.shipments'] = unavailable(e.message); }
  return { data, provenance };
}

function buildStakeholderLinks() {
  return [
    { section: 'pricing', label: 'Dynamic Pricing', href: '/dynamic-pricing' },
    { section: 'coldChain', label: 'Cold Storage', href: '/cold-storage' },
    { section: 'insurance', label: 'Insurance', href: '/insurance' },
    { section: 'subsidies', label: 'Government Subsidy', href: '/government-subsidy' },
    { section: 'compliance', label: 'Compliance', href: '/compliance' },
    { section: 'funding', label: 'Loan Management', href: '/loan-management' },
    { section: 'logistics', label: 'Logistics', href: '/logistics' },
    { section: 'engineering', label: 'Engineering Projects', href: '/engineering-projects' },
    { section: 'aiEngineering', label: 'AI Engineering Design Team', href: '/ai-engineering-design' },
    { section: 'mepDesign', label: 'MEP Design Studio', href: '/mep-design' },
    { section: 'farmerClinic', label: 'Farmer Support Clinic', href: '/farmer-support-clinic' },
    { section: 'platformSupport', label: 'Platform Support Hub', href: '/platform-support' },
    { section: 'sharedInfrastructure', label: 'Shared Infrastructure', href: '/shared-infra' },
    { section: 'equipmentRental', label: 'Equipment Rental', href: '/equipment-rental' },
  ];
}

function buildHandoffs(sections, provenance = {}) {
  const { pricing, coldChain, insurance, subsidies, compliance, funding, logistics, engineering, sharedInfrastructure, equipmentRental } = sections;
  const h = (section, label, href, status, detail) => ({ section, label, href, status, detail });
  const hasPricing = Boolean(pricing?.activeLot || (pricing?.floorBenchmark?.count >= 2));
  const hasCold = Boolean(coldChain?.systemStatus && provenance['coldChain.systemStatus']?.verified);
  const activePolicies = (insurance?.policies || []).filter((policy) =>
    ['active', 'issued', 'in_force'].includes(String(policy.status || '').toLowerCase()));
  const hasInsurance = activePolicies.length > 0;
  const hasSubsidy = Boolean((subsidies && subsidies.schemeEligibility && subsidies.schemeEligibility.eligible_schemes || []).length || (subsidies && subsidies.unclaimed && subsidies.unclaimed.claimable_now_total > 0));
  const complianceKnown = Boolean(provenance['compliance.gates']?.verified);
  const openGates = (compliance?.gates || []).filter((g) => !['completed', 'verified', 'closed'].includes(String(g.status || '').toLowerCase())).length;
  const approvedFunding = (funding?.applications || []).filter((application) =>
    ['approved', 'disbursed'].includes(String(application.status || '').toLowerCase()));
  const hasFunding = approvedFunding.length > 0;
  const hasLogistics = (logistics && logistics.shipments || []).length > 0;
  const hasEngineering = (engineering && engineering.projects || []).length > 0;
  const hasShared = (sharedInfrastructure && sharedInfrastructure.availableAssets || []).length > 0;
  const hasEquipment = (equipmentRental && equipmentRental.availableListings || []).length > 0;
  return [
    h('pricing', 'Pricing workspace', '/dynamic-pricing', hasPricing ? 'ready' : 'needs_data', hasPricing ? 'Floor benchmark or active lot available' : 'No pricing data yet'),
    h('coldChain', 'Cold-chain ops', '/cold-storage', hasCold ? 'ready' : 'needs_data', hasCold ? ('Network status: ' + (coldChain.systemStatus.status || 'known')) : 'Cold-chain status unavailable'),
    h('insurance', 'Insurance desk', '/insurance', hasInsurance ? 'ready' : 'action_needed', hasInsurance ? (activePolicies.length + ' active/issued policy(ies)') : 'No active or issued policy on file'),
    h('subsidies', 'Subsidy desk', '/government-subsidy', hasSubsidy ? 'ready' : 'review', hasSubsidy ? 'Eligible schemes or claimable amounts present' : 'No verified schemes matched'),
    h('compliance', 'Compliance gates', '/compliance', complianceKnown && openGates === 0 ? 'clear' : 'action_needed',
      !complianceKnown ? 'Compliance coverage is not verified' : (openGates === 0 ? 'All tracked gates are clear' : (openGates + ' open gate(s)'))),
    h('funding', 'Funding / loans', '/loan-management', hasFunding ? 'ready' : 'action_needed', hasFunding ? (approvedFunding.length + ' approved/disbursed application(s)') : 'No approved or disbursed funding on file'),
    h('logistics', 'Logistics', '/logistics', hasLogistics ? 'ready' : 'optional', hasLogistics ? (logistics.shipments.length + ' shipment(s)') : 'No linked shipments'),
    h('engineering', 'Engineering', '/engineering-projects', hasEngineering ? 'ready' : 'optional', hasEngineering ? (engineering.projects.length + ' project(s)') : 'No engineering projects'),
    h('aiEngineering', 'AI Engineering Design', '/ai-engineering-design', 'optional', 'Assemble design team packages (structural, MEP, cost, compliance)'),
    h('mepDesign', 'MEP Design Studio', '/mep-design', 'optional', 'Mechanical / electrical / plumbing design support'),
    h('farmerClinic', 'Farmer Support Clinic', '/farmer-support-clinic', 'optional', 'Plant, soil, livestock, poultry, fish advisory triage'),
    h('platformSupport', 'Platform Support Hub', '/platform-support', 'optional', 'Unified routing across clinic + engineering + value-chain'),
    h('sharedInfrastructure', 'Shared infrastructure', '/shared-infra', hasShared ? 'ready' : 'optional', hasShared ? (sharedInfrastructure.availableAssets.length + ' asset(s)') : 'No matching assets'),
    h('equipmentRental', 'Equipment rental', '/equipment-rental', hasEquipment ? 'ready' : 'optional', hasEquipment ? (equipmentRental.availableListings.length + ' listing(s)') : 'No listings'),
  ];
}

function buildReadinessSummary(provenance, sections) {
  const entries = Object.values(provenance || {});
  const verifiedCount = entries.filter((entry) => entry?.verified).length;
  const unavailableCount = entries.filter((entry) => entry?.source === 'unavailable').length;
  const inferredCount = entries.filter((entry) => entry?.source === 'inferred').length;
  const totalTracked = entries.length;
  const complianceKnown = Boolean(provenance['compliance.gates']?.verified);
  const openCompliance = (sections.compliance?.gates || []).filter((gate) =>
    !['completed', 'verified', 'closed'].includes(String(gate.status || '').toLowerCase())).length;
  const hasActiveInsurance = (sections.insurance?.policies || []).some((policy) =>
    ['active', 'issued', 'in_force'].includes(String(policy.status || '').toLowerCase()));
  const claimableSubsidy = Number(sections.subsidies && sections.subsidies.unclaimed && sections.subsidies.unclaimed.claimable_now_total) || 0;
  const hasPricing = Boolean(sections.pricing?.activeLot || sections.pricing?.floorBenchmark?.count >= 2);
  const approvedFundingCount = (sections.funding?.applications || []).filter((application) =>
    ['approved', 'disbursed'].includes(String(application.status || '').toLowerCase())).length;
  const checks = [
    { id: 'product', label: 'Product record verified', weight: 15, passed: Boolean(provenance.product?.verified) },
    { id: 'pricing', label: 'Verified pricing signal', weight: 20, passed: hasPricing },
    { id: 'cold_chain', label: 'Cold-chain requirement reviewed', weight: 10, passed: Boolean(provenance['coldChain.systemStatus']?.verified) },
    { id: 'insurance', label: 'Active/issued insurance', weight: 15, passed: hasActiveInsurance },
    { id: 'compliance', label: 'Tracked compliance gates clear', weight: 25, passed: complianceKnown && openCompliance === 0 },
    { id: 'funding', label: 'Approved/disbursed funding', weight: 10, passed: approvedFundingCount > 0 },
    { id: 'logistics', label: 'Shipment record linked', weight: 5, passed: (sections.logistics?.shipments || []).length > 0 },
  ];
  const score = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  return {
    score, formula: 'Sum of passed check weights; no AI and no estimates.', checks,
    verifiedFields: verifiedCount, unavailableFields: unavailableCount, inferredFields: inferredCount, totalTrackedFields: totalTracked,
    openComplianceGates: openCompliance, hasActiveInsurance, claimableSubsidyTotal: claimableSubsidy,
    hasPricingSignal: hasPricing, complianceCoverageKnown: complianceKnown, approvedFundingCount,
    label: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
  };
}

function buildStages(sections, product, provenance = {}) {
  const stage = (id, label, status, detail, href) => ({ id, label, status, detail, href });
  const hasProduct = Boolean(product && product.id);
  const hasPricing = Boolean(sections.pricing?.activeLot || sections.pricing?.floorBenchmark?.count >= 2);
  const hasCold = Boolean(sections.coldChain?.systemStatus && provenance['coldChain.systemStatus']?.verified);
  const complianceKnown = Boolean(provenance['compliance.gates']?.verified);
  const openGates = (sections.compliance?.gates || []).filter((g) => !['completed', 'verified', 'closed'].includes(String(g.status || '').toLowerCase())).length;
  const hasInsurance = (sections.insurance?.policies || []).some((policy) => ['active', 'issued', 'in_force'].includes(String(policy.status || '').toLowerCase()));
  const hasFunding = (sections.funding?.applications || []).some((application) => ['approved', 'disbursed'].includes(String(application.status || '').toLowerCase()));
  const hasLogistics = (sections.logistics && sections.logistics.shipments || []).length > 0;
  const marketReady = hasPricing && complianceKnown && openGates === 0;
  return [
    stage('identity', 'Product identity', hasProduct ? 'complete' : 'blocked', hasProduct ? product.name : 'Product not found', null),
    stage('pricing', 'Pricing signal', hasPricing ? 'complete' : 'in_progress', hasPricing ? 'Floor or lot price available' : 'No pricing data yet', '/dynamic-pricing'),
    stage('cold_chain', 'Cold-chain readiness', hasCold ? 'complete' : 'unknown', hasCold ? ('Network: ' + ((sections.coldChain.systemStatus && sections.coldChain.systemStatus.status) || 'known')) : 'Status unavailable', '/cold-storage'),
    stage('compliance', 'Compliance', complianceKnown && openGates === 0 ? 'complete' : 'blocked', !complianceKnown ? 'Compliance coverage not verified' : (openGates === 0 ? 'All tracked gates clear' : (openGates + ' open gate(s)')), '/compliance'),
    stage('insurance', 'Insurance', hasInsurance ? 'complete' : 'in_progress', hasInsurance ? 'Active/issued cover on file' : 'No active/issued cover on file', '/insurance'),
    stage('funding', 'Funding', hasFunding ? 'complete' : 'in_progress', hasFunding ? 'Approved/disbursed funding on file' : 'No approved/disbursed funding on file', '/loan-management'),
    stage('logistics', 'Logistics', hasLogistics ? 'complete' : 'optional', hasLogistics ? (sections.logistics.shipments.length + ' shipment(s)') : 'No shipments', '/logistics'),
    stage('market', 'Market ready', marketReady ? 'complete' : 'in_progress', marketReady ? 'Verified pricing + tracked compliance clear' : 'Needs verified pricing and verified compliance coverage', '/marketplace'),
  ];
}

function getCapabilities() {
  return {
    planVersion: '3.0',
    designRules: [
      'Nothing numeric is invented',
      'Missing data is unavailable; category inferences are explicitly unverified',
      'AI only for positioning copy and product image',
      'buildLifecyclePlan is read-only',
    ],
    sections: [
      'product', 'pricing', 'valueScore', 'coldChain', 'insurance', 'subsidies', 'compliance', 'farmerValue',
      'engineering', 'sharedInfrastructure', 'equipmentRental', 'funding', 'logistics', 'stages', 'handoffs', 'readiness',
    ],
    endpoints: {
      capabilities: 'GET /api/v1/value-chain-studio/capabilities',
      plan: 'GET /api/v1/value-chain-studio/:productId?farmerId=',
      positioning: 'POST /api/v1/value-chain-studio/:productId/positioning',
    },
  };
}

async function buildLifecyclePlan({ productId, farmerId, requester = null }) {
  if (!productId) throw new Error('productId is required');
  const product = await getProductContext(productId);
  if (!product) throw new Error('Product not found');
  const farmer = await getFarmerContext(farmerId, requester);
  const [
    pricingResult, valueScoreResult, coldChainResult, insuranceResult, subsidiesResult, complianceResult,
    farmerValueResult, engineeringResult, sharedInfraResult, equipmentRentalResult, fundingResult, logisticsResult,
  ] = await Promise.all([
    getPricingSection(product), getValueScoreSection(product), getColdChainSection(product), getInsuranceSection(farmer),
    getSubsidiesSection(product, farmer), getComplianceSection(product, farmer), getFarmerValueSection(farmer),
    getEngineeringSection(farmer), getSharedInfrastructureSection(product), getEquipmentRentalSection(),
    getFundingSection(farmer), getLogisticsSection(product, farmer),
  ]);
  const provenance = {
    product: dbSourced('products + categories', true),
    farmer: farmer ? dbSourced('farmers + addresses', true) : unavailable('farmerId not provided or not found'),
    ...pricingResult.provenance, ...valueScoreResult.provenance, ...coldChainResult.provenance,
    ...insuranceResult.provenance, ...subsidiesResult.provenance, ...complianceResult.provenance,
    ...farmerValueResult.provenance, ...engineeringResult.provenance, ...sharedInfraResult.provenance,
    ...equipmentRentalResult.provenance, ...fundingResult.provenance, ...logisticsResult.provenance,
  };
  const sections = {
    pricing: pricingResult.data, valueScore: valueScoreResult.data, coldChain: coldChainResult.data,
    insurance: insuranceResult.data, subsidies: subsidiesResult.data, compliance: complianceResult.data,
    farmerValue: farmerValueResult.data, engineering: engineeringResult.data,
    sharedInfrastructure: sharedInfraResult.data, equipmentRental: equipmentRentalResult.data,
    funding: fundingResult.data, logistics: logisticsResult.data,
  };
  const readiness = buildReadinessSummary(provenance, sections);
  provenance['readiness.summary'] = calculatedSourced('readiness.checks', true, readiness.formula);
  const handoffs = buildHandoffs(sections, provenance);
  const stages = buildStages(sections, { id: product.id, name: product.name }, provenance);
  provenance.handoffs = calculatedSourced('plan sections + provenance', true, 'Each status is derived from explicit section evidence and stored statuses.');
  provenance.stages = calculatedSourced('plan sections + provenance', true, 'Lifecycle stage states use the same evidence rules as readiness checks.');
  return {
    productId: product.id,
    farmerId: farmer ? farmer.id : (farmerId || null),
    generatedAt: nowIso(),
    planVersion: '3.0',
    product: {
      id: product.id, name: product.name, category: product.category_name,
      basePrice: product.base_price != null ? Number(product.base_price) : null,
      isActive: Boolean(product.is_active),
    },
    ...sections,
    stages,
    stakeholderLinks: buildStakeholderLinks(),
    handoffs,
    readiness,
    provenance,
  };
}

async function generatePositioningCopy(productData) {
  const name = (productData && productData.name) || 'Product';
  const category = (productData && productData.category) || 'agricultural product';
  const basePrice = productData && productData.basePrice;
  const prompt = [
    'Write 2-3 concise marketing sentences for an Indian rural GI / farm product.',
    'Name: ' + name + '. Category: ' + category + '.',
    basePrice != null ? ('Base price reference (INR): ' + basePrice + '.') : '',
    'Tone: honest, premium, farmer-first. No invented certifications or awards.',
  ].filter(Boolean).join(' ');
  try {
    const result = await aiAPI.generateRecommendation({
      task: prompt,
      parameters: { name, category, basePrice: basePrice ?? null },
      options: { maxTokens: 220, provider: 'openai' },
    });
    if (result?.status !== 'ok' || result.output == null) {
      return { copy: null, provenance: unavailable(result?.explanation || result?.error || 'OpenAI positioning unavailable') };
    }
    const text = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
    return { copy: text, provenance: evidence('ai', false, 'OpenAI positioning generation', 'Advisory positioning only; never used in calculations.') };
  } catch (e) {
    return { copy: null, provenance: unavailable(e.message) };
  }
}

async function generateProductImage(productId, prompt) {
  try {
    const result = await productMediaAIService.generateImage(productId, prompt);
    return { ...result, provenance: evidence('ai', false, 'configured image provider', 'Studio image — advisory media only.') };
  } catch (e) {
    return { imageUrl: null, provenance: unavailable(e.message) };
  }
}

module.exports = {
  buildLifecyclePlan,
  generatePositioningCopy,
  generateProductImage,
  getCapabilities,
  getProductContext,
  getFarmerContext,
  buildReadinessSummary,
  buildHandoffs,
  buildStages,
};
