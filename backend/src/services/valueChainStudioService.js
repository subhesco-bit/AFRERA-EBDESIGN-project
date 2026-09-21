/**
 * Value-Chain Studio — orchestrator service (highest production level).
 *
 * Single entry point (`buildLifecyclePlan`) that assembles a farmer/product's
 * full lifecycle plan out of the platform's real, DB-backed services:
 * pricing, cold-chain, insurance, subsidies, compliance, product value
 * scoring, funding readiness, logistics, engineering, shared infrastructure,
 * equipment rental — plus explicit stakeholder handoffs and a deterministic
 * readiness summary.
 *
 * DESIGN RULES
 * ------------
 * 1. Nothing numeric is invented. Every section is computed from a real
 *    service/table read. If the underlying data is missing, the field is
 *    `null` and its provenance entry says `source: 'unavailable'` — never
 *    silently estimated.
 * 2. AI is scoped to exactly two isolated functions
 *    (`generatePositioningCopy`, `generateProductImage`), both easy to
 *    audit/disable independently of the deterministic sections.
 * 3. `buildLifecyclePlan` is a read path — no section it calls performs a
 *    write. Deliberately NOT called (write-on-read):
 *      - valueCommerceService.calculateValueBasedPrice()
 *      - complianceTrackingService.trackCompliance()
 *
 * See DOCUMENTATION/VALUE_CHAIN_STUDIO_ARCHITECTURE.md for the full
 * concept → architecture → microservices → studio layering.
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

// ===========================================================================
// Context resolution
// ===========================================================================

async function getProductContext(productId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.category_id, p.base_price, p.is_active, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1`,
    [productId],
  );
  return rows[0] || null;
}

async function getFarmerContext(farmerId) {
  if (!farmerId) return null;
  const { rows } = await pool.query(
    `SELECT f.id, f.user_id, f.fpo_id, f.farm_size_hectares, f.fdi_score, f.fdi_grade,
            a.state AS state, a.city AS city
       FROM farmers f
       LEFT JOIN addresses a ON a.id = f.farm_location_id
      WHERE f.id = $1`,
    [farmerId],
  );
  return rows[0] || null;
}

// ===========================================================================
// Section builders — each returns { data, provenance }. Errors are isolated.
// ===========================================================================

async function getPricingSection(product) {
  const provenance = {};
  const data = { floorBenchmark: null, activeLot: null };

  try {
    const categoryQuery = product.category_name || product.name;
    data.floorBenchmark = await dynamicPricingService.floorBenchmark(categoryQuery);
    provenance['pricing.floorBenchmark'] = dbSourced(data.floorBenchmark && data.floorBenchmark.count >= 2);
  } catch (error) {
    provenance['pricing.floorBenchmark'] = unavailable(error.message);
  }

  try {
    const { rows } = await pool.query(
      `SELECT lot_code FROM pricing_lots
        WHERE product_id = $1 AND status = 'active'
        ORDER BY expires_on ASC LIMIT 1`,
      [String(product.id)],
    );
    if (rows.length) {
      data.activeLot = await dynamicPricingService.priceForLot(rows[0].lot_code);
      provenance['pricing.activeLot'] = dbSourced(true);
    } else {
      provenance['pricing.activeLot'] = unavailable('No active yield-managed pricing lot for this product.');
    }
  } catch (error) {
    provenance['pricing.activeLot'] = unavailable(error.message);
  }

  return { data, provenance };
}

async function getValueScoreSection(product) {
  const provenance = {};
  const data = { score: null };
  try {
    data.score = await valueCommerceService.getProductValueScore(product.id);
    provenance['valueScore.score'] = dbSourced(true);
  } catch (error) {
    provenance['valueScore.score'] = unavailable(error.message);
  }
  return { data, provenance };
}

async function getColdChainSection() {
  const provenance = {};
  const data = { systemStatus: null, facilities: [] };
  try {
    data.systemStatus = await coldStorageService.getSystemStatus();
    provenance['coldChain.systemStatus'] = dbSourced(true);
  } catch (error) {
    provenance['coldChain.systemStatus'] = unavailable(error.message);
  }
  try {
    const facilities = await coldStorageService.getFacilitiesWithStatus();
    data.facilities = facilities.slice(0, 5);
    provenance['coldChain.facilities'] = dbSourced(true);
  } catch (error) {
    provenance['coldChain.facilities'] = unavailable(error.message);
  }
  return { data, provenance };
}

async function getInsuranceSection(farmer) {
  const provenance = {};
  const data = { policies: [] };
  if (!farmer || !farmer.user_id) {
    provenance['insurance.policies'] = unavailable('No linked farmer/user account.');
    return { data, provenance };
  }
  try {
    const result = await insurancePolicyIssuanceService.getUserPolicies(farmer.user_id, { limit: 10 });
    data.policies = result.policies || [];
    provenance['insurance.policies'] = dbSourced(true);
  } catch (error) {
    provenance['insurance.policies'] = unavailable(error.message);
  }
  return { data, provenance };
}

async function getSubsidiesSection(product, farmer) {
  const provenance = {};
  const data = { schemeEligibility: null, unclaimed: null };

  try {
    data.schemeEligibility = await governmentSchemeService.checkSchemeEligibility({
      category: product.category_name || undefined,
      state: farmer && farmer.state ? farmer.state : undefined,
    });
    provenance['subsidies.schemeEligibility'] = dbSourced(true);
  } catch (error) {
    provenance['subsidies.schemeEligibility'] = unavailable(error.message);
  }

  if (farmer) {
    try {
      data.unclaimed = await farmerValueService.detectUnclaimedSubsidy(farmer.id);
      provenance['subsidies.unclaimed'] = dbSourced(true);
    } catch (error) {
      provenance['subsidies.unclaimed'] = unavailable(error.message);
    }
  } else {
    provenance['subsidies.unclaimed'] = unavailable('No farmer context supplied.');
  }

  return { data, provenance };
}

async function getComplianceSection(product, farmer) {
  const provenance = {};
  const data = { gates: [] };
  const ids = [product.id, farmer ? farmer.id : null].filter(Boolean);
  try {
    const { rows } = await pool.query(
      `SELECT id, entity_type, entity_id, requirement_type, requirement_description,
              due_date, status, completed_date, verified_by, notes, created_at
         FROM compliance_records
        WHERE entity_id = ANY($1::uuid[])
        ORDER BY created_at DESC
        LIMIT 50`,
      [ids],
    );
    data.gates = rows;
    provenance['compliance.gates'] = dbSourced(true);
    if (rows.length === 0) {
      provenance['compliance.gates'].note = 'No compliance records tracked for this entity yet.';
    }
  } catch (error) {
    provenance['compliance.gates'] = unavailable(error.message);
  }
  return { data, provenance };
}

async function getFarmerValueSection(farmer) {
  const provenance = {};
  const data = { fvi: null };
  if (!farmer) {
    provenance['farmerValue.fvi'] = unavailable('No farmer context supplied.');
    return { data, provenance };
  }
  try {
    data.fvi = await farmerValueService.computeFVI({ farmerId: farmer.id });
    provenance['farmerValue.fvi'] = calculatedSourced(true);
  } catch (error) {
    provenance['farmerValue.fvi'] = unavailable(error.message);
  }
  return { data, provenance };
}

async function getEngineeringSection(farmer) {
  const provenance = {};
  const data = { projects: [] };
  if (!farmer || !farmer.user_id) {
    provenance['engineering.projects'] = unavailable('No linked farmer/user account.');
    return { data, provenance };
  }
  try {
    data.projects = await engineeringProjectService.listProjects(farmer.user_id, { limit: 10 });
    provenance['engineering.projects'] = dbSourced(true);
  } catch (error) {
    provenance['engineering.projects'] = unavailable(error.message);
  }
  return { data, provenance };
}

async function getSharedInfrastructureSection(product) {
  const provenance = {};
  const data = { availableAssets: [] };
  try {
    const where = ["a.status = 'available'"];
    const params = [];
    if (product.category_name) {
      params.push(`%${product.category_name}%`);
      where.push(`t.category ILIKE $${params.length}`);
    }
    const { rows } = await pool.query(
      `SELECT a.id, a.name, t.name AS type_name, t.category, a.capacity,
              a.daily_rate, a.utilization_rate, a.status
         FROM assets a
         LEFT JOIN asset_types t ON t.id = a.type_id
        WHERE ${where.join(' AND ')}
        ORDER BY a.created_at DESC
        LIMIT 10`,
      params,
    );
    data.availableAssets = rows;
    provenance['sharedInfrastructure.availableAssets'] = dbSourced(true);
  } catch (error) {
    provenance['sharedInfrastructure.availableAssets'] = unavailable(error.message);
  }
  return { data, provenance };
}

async function getEquipmentRentalSection() {
  const provenance = {};
  const data = { availableListings: [] };
  try {
    const listings = await equipmentExchangeService.listAvailable({});
    data.availableListings = listings.slice(0, 10);
    provenance['equipmentRental.availableListings'] = dbSourced(true);
  } catch (error) {
    provenance['equipmentRental.availableListings'] = unavailable(error.message);
  }
  return { data, provenance };
}

/**
 * Funding readiness — read-only loan applications linked to the farmer's user.
 * Does not invent credit scores or eligibility; only reports what exists.
 */
async function getFundingSection(farmer) {
  const provenance = {};
  const data = { applications: [], summary: null };
  if (!farmer || !farmer.user_id) {
    provenance['funding.applications'] = unavailable('No linked farmer/user account.');
    return { data, provenance };
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, loan_type, amount_requested, amount_approved, status, created_at, updated_at
         FROM loan_applications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20`,
      [farmer.user_id],
    );
    data.applications = rows;
    const open = rows.filter((r) => r.status && !['rejected', 'closed', 'disbursed'].includes(String(r.status).toLowerCase()));
    const approved = rows.filter((r) => String(r.status || '').toLowerCase() === 'approved' || String(r.status || '').toLowerCase() === 'disbursed');
    data.summary = {
      totalApplications: rows.length,
      openCount: open.length,
      approvedOrDisbursedCount: approved.length,
      totalRequested: rows.reduce((s, r) => s + (Number(r.amount_requested) || 0), 0),
      totalApproved: approved.reduce((s, r) => s + (Number(r.amount_approved) || 0), 0),
    };
    provenance['funding.applications'] = dbSourced(true);
    provenance['funding.summary'] = calculatedSourced(true);
  } catch (error) {
    // Table may not exist in every environment — surface as unavailable, never invent.
    provenance['funding.applications'] = unavailable(error.message);
    provenance['funding.summary'] = unavailable(error.message);
  }
  return { data, provenance };
}

/**
 * Logistics — recent shipments that reference this product or farmer context.
 * Pure read; no booking created.
 */
async function getLogisticsSection(product, farmer) {
  const provenance = {};
  const data = { shipments: [] };
  try {
    const params = [String(product.id)];
    let farmerClause = '';
    if (farmer && farmer.id) {
      params.push(String(farmer.id));
      farmerClause = ` OR farmer_id = $2`;
    }
    const { rows } = await pool.query(
      `SELECT id, tracking_number, status, origin, destination, product_id, farmer_id,
              estimated_delivery, created_at
         FROM shipments
        WHERE product_id = $1${farmerClause}
        ORDER BY created_at DESC
        LIMIT 15`,
      params,
    );
    data.shipments = rows;
    provenance['logistics.shipments'] = dbSourced(true);
    if (rows.length === 0) {
      provenance['logistics.shipments'].note = 'No shipments linked to this product/farmer yet.';
    }
  } catch (error) {
    provenance['logistics.shipments'] = unavailable(error.message);
  }
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
    { section: 'sharedInfrastructure', label: 'Shared Infrastructure', href: '/shared-infra' },
    { section: 'equipmentRental', label: 'Equipment Rental', href: '/equipment-rental' },
  ];
}

/**
 * Stakeholder handoffs — explicit status for each specialist workspace
 * derived only from already-verified section data (no new estimates).
 */
function buildHandoffs(sections) {
  const {
    pricing, coldChain, insurance, subsidies, compliance,
    funding, logistics, engineering, sharedInfrastructure, equipmentRental,
  } = sections;

  const handoff = (section, label, href, status, detail) => ({
    section, label, href, status, detail,
  });

  const hasPricing = Boolean(pricing?.floorBenchmark || pricing?.activeLot);
  const hasCold = Boolean(coldChain?.systemStatus);
  const hasInsurance = (insurance?.policies || []).length > 0;
  const hasSubsidy = Boolean(
    (subsidies?.schemeEligibility?.eligible_schemes || []).length
    || (subsidies?.unclaimed?.claimable_now_total > 0),
  );
  const openGates = (compliance?.gates || []).filter(
    (g) => g.status && !['completed', 'verified', 'closed'].includes(String(g.status).toLowerCase()),
  ).length;
  const hasFunding = (funding?.applications || []).length > 0;
  const hasLogistics = (logistics?.shipments || []).length > 0;
  const hasEngineering = (engineering?.projects || []).length > 0;
  const hasShared = (sharedInfrastructure?.availableAssets || []).length > 0;
  const hasEquipment = (equipmentRental?.availableListings || []).length > 0;

  return [
    handoff('pricing', 'Pricing workspace', '/dynamic-pricing', hasPricing ? 'ready' : 'needs_data',
      hasPricing ? 'Floor benchmark or active lot available' : 'No pricing data yet'),
    handoff('coldChain', 'Cold-chain ops', '/cold-storage', hasCold ? 'ready' : 'needs_data',
      hasCold ? `Network status: ${coldChain.systemStatus?.status || 'known'}` : 'Cold-chain status unavailable'),
    handoff('insurance', 'Insurance desk', '/insurance', hasInsurance ? 'ready' : 'action_needed',
      hasInsurance ? `${insurance.policies.length} policy(ies) on file` : 'No policies — consider coverage'),
    handoff('subsidies', 'Subsidy desk', '/government-subsidy', hasSubsidy ? 'ready' : 'review',
      hasSubsidy ? 'Eligible schemes or claimable amounts present' : 'No verified schemes matched'),
    handoff('compliance', 'Compliance gates', '/compliance', openGates === 0 ? 'clear' : 'action_needed',
      openGates === 0 ? 'No open gates' : `${openGates} open gate(s)`),
    handoff('funding', 'Funding / loans', '/loan-management', hasFunding ? 'ready' : 'optional',
      hasFunding ? `${funding.applications.length} application(s)` : 'No loan applications on file'),
    handoff('logistics', 'Logistics', '/logistics', hasLogistics ? 'ready' : 'optional',
      hasLogistics ? `${logistics.shipments.length} shipment(s)` : 'No linked shipments'),
    handoff('engineering', 'Engineering', '/engineering-projects', hasEngineering ? 'ready' : 'optional',
      hasEngineering ? `${engineering.projects.length} project(s)` : 'No engineering projects'),
    handoff('sharedInfrastructure', 'Shared infrastructure', '/shared-infra', hasShared ? 'ready' : 'optional',
      hasShared ? `${sharedInfrastructure.availableAssets.length} asset(s)` : 'No matching assets'),
    handoff('equipmentRental', 'Equipment rental', '/equipment-rental', hasEquipment ? 'ready' : 'optional',
      hasEquipment ? `${equipmentRental.availableListings.length} listing(s)` : 'No listings'),
  ];
}

/**
 * Deterministic readiness summary — aggregates only verified/calculated fields.
 */
function buildReadinessSummary(provenance, sections) {
  const entries = Object.values(provenance || {});
  const verifiedCount = entries.filter((e) => e && e.verified).length;
  const unavailableCount = entries.filter((e) => e && e.source === 'unavailable').length;
  const totalTracked = entries.length;

  const openCompliance = (sections.compliance?.gates || []).filter(
    (g) => g.status && !['completed', 'verified', 'closed'].includes(String(g.status).toLowerCase()),
  ).length;
  const hasActiveInsurance = (sections.insurance?.policies || []).some(
    (p) => p.status && ['active', 'issued', 'in_force'].includes(String(p.status).toLowerCase()),
  );
  const claimableSubsidy = Number(sections.subsidies?.unclaimed?.claimable_now_total) || 0;
  const hasPricing = Boolean(sections.pricing?.floorBenchmark || sections.pricing?.activeLot);

  // Simple 0–100 score from verified coverage (deterministic weights).
  const coverageRatio = totalTracked > 0 ? verifiedCount / totalTracked : 0;
  let score = Math.round(coverageRatio * 70);
  if (hasPricing) score += 10;
  if (hasActiveInsurance) score += 10;
  if (openCompliance === 0) score += 5;
  if (claimableSubsidy > 0) score += 5;
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    verifiedFields: verifiedCount,
    unavailableFields: unavailableCount,
    totalTrackedFields: totalTracked,
    openComplianceGates: openCompliance,
    hasActiveInsurance,
    claimableSubsidyTotal: claimableSubsidy,
    hasPricingSignal: hasPricing,
    label: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
  };
}

// ===========================================================================
// Orchestrator
// ===========================================================================

async function buildLifecyclePlan({ productId, farmerId }) {
  if (!productId) throw new Error('productId is required');

  const product = await getProductContext(productId);
  if (!product) throw new Error('Product not found');

  const farmer = await getFarmerContext(farmerId);

  const [
    pricingResult, valueScoreResult, coldChainResult, insuranceResult,
    subsidiesResult, complianceResult, farmerValueResult, engineeringResult,
    sharedInfraResult, equipmentRentalResult, fundingResult, logisticsResult,
  ] = await Promise.all([
    getPricingSection(product),
    getValueScoreSection(product),
    getColdChainSection(),
    getInsuranceSection(farmer),
    getSubsidiesSection(product, farmer),
    getComplianceSection(product, farmer),
    getFarmerValueSection(farmer),
    getEngineeringSection(farmer),
    getSharedInfrastructureSection(product),
    getEquipmentRentalSection(),
    getFundingSection(farmer),
    getLogisticsSection(product, farmer),
  ]);

  const provenance = {
    product: dbSourced(true),
    farmer: farmer ? dbSourced(true) : unavailable('farmerId not provided or not found'),
    ...pricingResult.provenance,
    ...valueScoreResult.provenance,
    ...coldChainResult.provenance,
    ...insuranceResult.provenance,
    ...subsidiesResult.provenance,
    ...complianceResult.provenance,
    ...farmerValueResult.provenance,
    ...engineeringResult.provenance,
    ...sharedInfraResult.provenance,
    ...equipmentRentalResult.provenance,
    ...fundingResult.provenance,
    ...logisticsResult.provenance,
  };

  const sections = {
    pricing: pricingResult.data,
    valueScore: valueScoreResult.data,
    coldChain: coldChainResult.data,
    insurance: insuranceResult.data,
    subsidies: subsidiesResult.data,
    compliance: complianceResult.data,
    farmerValue: farmerValueResult.data,
    engineering: engineeringResult.data,
    sharedInfrastructure: sharedInfraResult.data,
    equipmentRental: equipmentRentalResult.data,
    funding: fundingResult.data,
    logistics: logisticsResult.data,
  };

  const readiness = buildReadinessSummary(provenance, sections);
  provenance['readiness.summary'] = calculatedSourced(true);

  const handoffs = buildHandoffs(sections);

  return {
    productId: product.id,
    farmerId: farmer ? farmer.id : (farmerId || null),
    generatedAt: nowIso(),
    product: {
      id: product.id,
      name: product.name,
      category: product.category_name,
      basePrice: product.base_price !== null && product.base_price !== undefined ? Number(product.base_price) : null,
      isActive: Boolean(product.is_active),
    },
    ...sections,
    stakeholderLinks: buildStakeholderLinks(),
    handoffs,
    readiness,
    provenance,
  };
}

// ===========================================================================
// AI (advisory only — never used for calculable fields)
// ===========================================================================

async function generatePositioningCopy(productData) {
  const name = productData?.name || 'Product';
  const category = productData?.category || 'agricultural product';
  const basePrice = productData?.basePrice;
  const prompt = [
    `Write 2–3 concise marketing sentences for an Indian rural GI / farm product.`,
    `Name: ${name}. Category: ${category}.`,
    basePrice != null ? `Base price reference (INR): ${basePrice}.` : '',
    `Tone: honest, premium, farmer-first. No invented certifications or awards.`,
  ].filter(Boolean).join(' ');

  try {
    const result = await aiAPI.generateRecommendation({ prompt, maxTokens: 220 });
    const text = typeof result === 'string' ? result : (result?.text || result?.recommendation || JSON.stringify(result));
    return {
      copy: text,
      provenance: { source: 'ai', verified: false, asOf: nowIso(), note: 'Advisory positioning only' },
    };
  } catch (error) {
    return {
      copy: null,
      provenance: unavailable(error.message),
    };
  }
}

async function generateProductImage(productId, prompt) {
  try {
    const result = await productMediaAIService.generateImage(productId, prompt);
    return {
      ...result,
      provenance: { source: 'ai', verified: false, asOf: nowIso(), note: 'Studio image — advisory' },
    };
  } catch (error) {
    return {
      imageUrl: null,
      provenance: unavailable(error.message),
    };
  }
}

module.exports = {
  buildLifecyclePlan,
  generatePositioningCopy,
  generateProductImage,
  getProductContext,
  getFarmerContext,
};
