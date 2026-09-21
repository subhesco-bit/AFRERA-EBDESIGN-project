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

const nowIso = () => new Date().toISOString();
const unavailable = (note) => ({ source: 'unavailable', verified: false, asOf: nowIso(), note: note || null });
const dbSourced = (verified = true) => ({ source: 'db', verified, asOf: nowIso() });
const calculatedSourced = (verified = true) => ({ source: 'calculated', verified, asOf: nowIso() });

async function getProductContext(productId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category_id, p.base_price, p.is_active, c.name AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = $1`, [productId]);
  return rows[0] || null;
}

async function getFarmerContext(farmerId) {
  if (!farmerId) return null;
  const { rows } = await pool.query(
    `SELECT f.id, f.user_id, f.fpo_id, f.farm_size_hectares, f.fdi_score, f.fdi_grade,
            a.state AS state, a.city AS city
       FROM farmers f LEFT JOIN addresses a ON a.id = f.farm_location_id WHERE f.id = $1`, [farmerId]);
  return rows[0] || null;
}

async function getPricingSection(product) {
  const provenance = {};
  const data = { floorBenchmark: null, activeLot: null, transparency: null };
  try {
    data.floorBenchmark = await dynamicPricingService.floorBenchmark(product.category_name || product.name);
    provenance['pricing.floorBenchmark'] = dbSourced(data.floorBenchmark && data.floorBenchmark.count >= 2);
  } catch (e) { provenance['pricing.floorBenchmark'] = unavailable(e.message); }
  try {
    const { rows } = await pool.query(
      `SELECT lot_code FROM pricing_lots WHERE product_id = $1 AND status = 'active' ORDER BY expires_on ASC LIMIT 1`,
      [String(product.id)]);
    if (rows.length) {
      data.activeLot = await dynamicPricingService.priceForLot(rows[0].lot_code);
      provenance['pricing.activeLot'] = dbSourced(true);
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
  provenance['pricing.transparency'] = calculatedSourced(base != null || floorMin != null || lotPrice != null);
  return { data, provenance };
}

async function getValueScoreSection(product) {
  const provenance = {}; const data = { score: null };
  try { data.score = await valueCommerceService.getProductValueScore(product.id); provenance['valueScore.score'] = dbSourced(true); }
  catch (e) { provenance['valueScore.score'] = unavailable(e.message); }
  return { data, provenance };
}

async function getColdChainSection(product) {
  const provenance = {}; const data = { systemStatus: null, facilities: [], requirements: null };
  try { data.systemStatus = await coldStorageService.getSystemStatus(); provenance['coldChain.systemStatus'] = dbSourced(true); }
  catch (e) { provenance['coldChain.systemStatus'] = unavailable(e.message); }
  try { data.facilities = (await coldStorageService.getFacilitiesWithStatus()).slice(0, 5); provenance['coldChain.facilities'] = dbSourced(true); }
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
  provenance['coldChain.requirements'] = calculatedSourced(Boolean(product && product.category_name));
  return { data, provenance };
}

async function getInsuranceSection(farmer) {
  const provenance = {}; const data = { policies: [] };
  if (!farmer || !farmer.user_id) { provenance['insurance.policies'] = unavailable('No linked farmer/user account.'); return { data, provenance }; }
  try {
    const result = await insurancePolicyIssuanceService.getUserPolicies(farmer.user_id, { limit: 10 });
    data.policies = result.policies || []; provenance['insurance.policies'] = dbSourced(true);
  } catch (e) { provenance['insurance.policies'] = unavailable(e.message); }
  return { data, provenance };
}

async function getSubsidiesSection(product, farmer) {
  const provenance = {}; const data = { schemeEligibility: null, unclaimed: null };
  try {
    data.schemeEligibility = await governmentSchemeService.checkSchemeEligibility({
      category: product.category_name || undefined, state: farmer && farmer.state ? farmer.state : undefined,
    });
    provenance['subsidies.schemeEligibility'] = dbSourced(true);
  } catch (e) { provenance['subsidies.schemeEligibility'] = unavailable(e.message); }
  if (farmer) {
    try { data.unclaimed = await farmerValueService.detectUnclaimedSubsidy(farmer.id); provenance['subsidies.unclaimed'] = dbSourced(true); }
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
    data.gates = rows; provenance['compliance.gates'] = dbSourced(true);
    if (!rows.length) provenance['compliance.gates'].note = 'No compliance records tracked for this entity yet.';
  } catch (e) { provenance['compliance.gates'] = unavailable(e.message); }
  return { data, provenance };
}

async function getFarmerValueSection(farmer) {
  const provenance = {}; const data = { fvi: null };
  if (!farmer) { provenance['farmerValue.fvi'] = unavailable('No farmer context supplied.'); return { data, provenance }; }
  try { data.fvi = await farmerValueService.computeFVI({ farmerId: farmer.id }); provenance['farmerValue.fvi'] = calculatedSourced(true); }
  catch (e) { provenance['farmerValue.fvi'] = unavailable(e.message); }
  return { data, provenance };
}

async function getEngineeringSection(farmer) {
  const provenance = {}; const data = { projects: [] };
  if (!farmer || !farmer.user_id) { provenance['engineering.projects'] = unavailable('No linked farmer/user account.'); return { data, provenance }; }
  try { data.projects = await engineeringProjectService.listProjects(farmer.user_id, { limit: 10 }); provenance['engineering.projects'] = dbSourced(true); }
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
    data.availableAssets = rows; provenance['sharedInfrastructure.availableAssets'] = dbSourced(true);
  } catch (e) { provenance['sharedInfrastructure.availableAssets'] = unavailable(e.message); }
  return { data, provenance };
}

async function getEquipmentRentalSection() {
  const provenance = {}; const data = { availableListings: [] };
  try { data.availableListings = (await equipmentExchangeService.listAvailable({})).slice(0, 10); provenance['equipmentRental.availableListings'] = dbSourced(true); }
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
    provenance['funding.applications'] = dbSourced(true);
    provenance['funding.summary'] = calculatedSourced(true);
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
    data.shipments = rows; provenance['logistics.shipments'] = dbSourced(true);
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

function buildHandoffs(sections) {
  const { pricing, coldChain, insurance, subsidies, compliance, funding, logistics, engineering, sharedInfrastructure, equipmentRental } = sections;
  const h = (section, label, href, status, detail) => ({ section, label, href, status, detail });
  const hasPricing = Boolean(pricing && (pricing.floorBenchmark || pricing.activeLot));
  const hasCold = Boolean(coldChain && coldChain.systemStatus);
  const hasInsurance = (insurance && insurance.policies || []).length > 0;
  const hasSubsidy = Boolean((subsidies && subsidies.schemeEligibility && subsidies.schemeEligibility.eligible_schemes || []).length || (subsidies && subsidies.unclaimed && subsidies.unclaimed.claimable_now_total > 0));
  const openGates = (compliance && compliance.gates || []).filter((g) => g.status && !['completed', 'verified', 'closed'].includes(String(g.status).toLowerCase())).length;
  const hasFunding = (funding && funding.applications || []).length > 0;
  const hasLogistics = (logistics && logistics.shipments || []).length > 0;
  const hasEngineering = (engineering && engineering.projects || []).length > 0;
  const hasShared = (sharedInfrastructure && sharedInfrastructure.availableAssets || []).length > 0;
  const hasEquipment = (equipmentRental && equipmentRental.availableListings || []).length > 0;
  return [
    h('pricing', 'Pricing workspace', '/dynamic-pricing', hasPricing ? 'ready' : 'needs_data', hasPricing ? 'Floor benchmark or active lot available' : 'No pricing data yet'),
    h('coldChain', 'Cold-chain ops', '/cold-storage', hasCold ? 'ready' : 'needs_data', hasCold ? ('Network status: ' + (coldChain.systemStatus.status || 'known')) : 'Cold-chain status unavailable'),
    h('insurance', 'Insurance desk', '/insurance', hasInsurance ? 'ready' : 'action_needed', hasInsurance ? (insurance.policies.length + ' policy(ies) on file') : 'No policies — consider coverage'),
    h('subsidies', 'Subsidy desk', '/government-subsidy', hasSubsidy ? 'ready' : 'review', hasSubsidy ? 'Eligible schemes or claimable amounts present' : 'No verified schemes matched'),
    h('compliance', 'Compliance gates', '/compliance', openGates === 0 ? 'clear' : 'action_needed', openGates === 0 ? 'No open gates' : (openGates + ' open gate(s)')),
    h('funding', 'Funding / loans', '/loan-management', hasFunding ? 'ready' : 'optional', hasFunding ? (funding.applications.length + ' application(s)') : 'No loan applications on file'),
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
  const verifiedCount = entries.filter((e) => e && e.verified).length;
  const unavailableCount = entries.filter((e) => e && e.source === 'unavailable').length;
  const totalTracked = entries.length;
  const openCompliance = (sections.compliance && sections.compliance.gates || []).filter((g) => g.status && !['completed', 'verified', 'closed'].includes(String(g.status).toLowerCase())).length;
  const hasActiveInsurance = (sections.insurance && sections.insurance.policies || []).some((p) => p.status && ['active', 'issued', 'in_force'].includes(String(p.status).toLowerCase()));
  const claimableSubsidy = Number(sections.subsidies && sections.subsidies.unclaimed && sections.subsidies.unclaimed.claimable_now_total) || 0;
  const hasPricing = Boolean(sections.pricing && (sections.pricing.floorBenchmark || sections.pricing.activeLot));
  const coverageRatio = totalTracked > 0 ? verifiedCount / totalTracked : 0;
  let score = Math.round(coverageRatio * 70);
  if (hasPricing) score += 10;
  if (hasActiveInsurance) score += 10;
  if (openCompliance === 0) score += 5;
  if (claimableSubsidy > 0) score += 5;
  score = Math.min(100, Math.max(0, score));
  return {
    score, verifiedFields: verifiedCount, unavailableFields: unavailableCount, totalTrackedFields: totalTracked,
    openComplianceGates: openCompliance, hasActiveInsurance, claimableSubsidyTotal: claimableSubsidy,
    hasPricingSignal: hasPricing, label: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
  };
}

function buildStages(sections, product) {
  const stage = (id, label, status, detail, href) => ({ id, label, status, detail, href });
  const hasProduct = Boolean(product && product.id);
  const hasPricing = Boolean(sections.pricing && (sections.pricing.floorBenchmark || sections.pricing.activeLot));
  const hasCold = Boolean(sections.coldChain && sections.coldChain.systemStatus);
  const openGates = (sections.compliance && sections.compliance.gates || []).filter((g) => g.status && !['completed', 'verified', 'closed'].includes(String(g.status).toLowerCase())).length;
  const hasInsurance = (sections.insurance && sections.insurance.policies || []).length > 0;
  const hasFunding = (sections.funding && sections.funding.applications || []).length > 0;
  const hasLogistics = (sections.logistics && sections.logistics.shipments || []).length > 0;
  const marketReady = hasPricing && openGates === 0;
  return [
    stage('identity', 'Product identity', hasProduct ? 'complete' : 'blocked', hasProduct ? product.name : 'Product not found', null),
    stage('pricing', 'Pricing signal', hasPricing ? 'complete' : 'in_progress', hasPricing ? 'Floor or lot price available' : 'No pricing data yet', '/dynamic-pricing'),
    stage('cold_chain', 'Cold-chain readiness', hasCold ? 'complete' : 'unknown', hasCold ? ('Network: ' + ((sections.coldChain.systemStatus && sections.coldChain.systemStatus.status) || 'known')) : 'Status unavailable', '/cold-storage'),
    stage('compliance', 'Compliance', openGates === 0 ? 'complete' : 'blocked', openGates === 0 ? 'No open gates' : (openGates + ' open gate(s)'), '/compliance'),
    stage('insurance', 'Insurance', hasInsurance ? 'complete' : 'optional', hasInsurance ? (sections.insurance.policies.length + ' policy(ies)') : 'No policies on file', '/insurance'),
    stage('funding', 'Funding', hasFunding ? 'complete' : 'optional', hasFunding ? (sections.funding.applications.length + ' application(s)') : 'No applications', '/loan-management'),
    stage('logistics', 'Logistics', hasLogistics ? 'complete' : 'optional', hasLogistics ? (sections.logistics.shipments.length + ' shipment(s)') : 'No shipments', '/logistics'),
    stage('market', 'Market ready', marketReady ? 'complete' : 'in_progress', marketReady ? 'Pricing + compliance clear' : 'Needs pricing and clear compliance', '/marketplace'),
  ];
}

function getCapabilities() {
  return {
    planVersion: '2.1',
    designRules: [
      'Nothing numeric is invented',
      'Missing data is unavailable, never estimated',
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

async function buildLifecyclePlan({ productId, farmerId }) {
  if (!productId) throw new Error('productId is required');
  const product = await getProductContext(productId);
  if (!product) throw new Error('Product not found');
  const farmer = await getFarmerContext(farmerId);
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
    product: dbSourced(true),
    farmer: farmer ? dbSourced(true) : unavailable('farmerId not provided or not found'),
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
  provenance['readiness.summary'] = calculatedSourced(true);
  const handoffs = buildHandoffs(sections);
  const stages = buildStages(sections, { id: product.id, name: product.name });
  provenance['stages'] = calculatedSourced(true);
  return {
    productId: product.id,
    farmerId: farmer ? farmer.id : (farmerId || null),
    generatedAt: nowIso(),
    planVersion: '2.1',
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
    const result = await aiAPI.generateRecommendation({ prompt, maxTokens: 220 });
    const text = typeof result === 'string' ? result : (result && (result.text || result.recommendation) || JSON.stringify(result));
    return { copy: text, provenance: { source: 'ai', verified: false, asOf: nowIso(), note: 'Advisory positioning only' } };
  } catch (e) {
    return { copy: null, provenance: unavailable(e.message) };
  }
}

async function generateProductImage(productId, prompt) {
  try {
    const result = await productMediaAIService.generateImage(productId, prompt);
    return { ...result, provenance: { source: 'ai', verified: false, asOf: nowIso(), note: 'Studio image - advisory' } };
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
};
