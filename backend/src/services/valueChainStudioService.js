/**
 * Value-Chain Studio — orchestrator service.
 *
 * Single entry point (`buildLifecyclePlan`) that assembles a farmer/product's
 * full lifecycle plan out of the platform's real, DB-backed services:
 * pricing, cold-chain, insurance, subsidies, compliance, product value
 * scoring, plus the scope-expansion concepts (engineering, shared
 * infrastructure, equipment rental) that turned out to have real,
 * non-stub implementations.
 *
 * DESIGN RULES (per the approved plan)
 * -------------------------------------
 * 1. Nothing numeric is invented. Every section is computed from a real
 *    service/table read. If the underlying data is missing, the field is
 *    `null` and its provenance entry says `source: 'unavailable'` — never
 *    silently estimated.
 * 2. AI is scoped to exactly two isolated functions below
 *    (`generatePositioningCopy`, `generateProductImage`), both easy to
 *    audit/disable independently of the deterministic sections.
 * 3. `buildLifecyclePlan` is a read path — no section it calls performs a
 *    write. Two functions that exist elsewhere in the codebase were
 *    deliberately NOT called here because they write on every invocation:
 *      - valueCommerceService.calculateValueBasedPrice() inserts a row into
 *        product_value_pricing every time it runs. Calling it from a GET
 *        that a page loads on every visit would flood that table. Only
 *        the (pure-read) getProductValueScore() is used here.
 *      - complianceTrackingService.trackCompliance() is a write, and its
 *        INSERT (`entity_id, regulation_id, status`) does not even match
 *        the real compliance_records schema in 000_base_schema.sql
 *        (entity_type, entity_id, requirement_type, requirement_description,
 *        due_date, status, completed_date, verified_by, notes) — the table
 *        was independently redefined by migration 3025 as
 *        `CREATE TABLE IF NOT EXISTS` and lost, since 000 runs first. Calling
 *        trackCompliance() would throw ("column regulation_id does not
 *        exist"). Compliance gates are read directly off compliance_records
 *        instead, using its real columns.
 *
 * SCOPE-EXPANSION VERIFICATION SUMMARY (engineering / shared-infra / rental)
 * ---------------------------------------------------------------------------
 *  - Engineering: services/legacy/engineeringProjectService.js is real
 *    (writes/reads engineering_projects, a real migration-023 table) and is
 *    mounted live via routes/engineeringProjectRoutes.js. Used directly:
 *    listProjects(userId).
 *  - Shared infrastructure: services/legacy/sharedInfraService.js is real
 *    against `assets` / `shared_infrastructure_access`, but its only public
 *    search entry point (searchSharedInfrastructure) wraps
 *    aiAPI.generateRecommendation and reshapes its result from the AI
 *    response, not from its own real getAvailableAssets() DB helper — so it
 *    is not deterministic and was not used. getAvailableAssets() is real and
 *    deterministic but is a private, unexported helper in that file, and per
 *    the "do not modify existing services" rule it was left untouched.
 *    Instead this service replicates the same (real) assets/asset_types
 *    query directly, which is the same pattern the plan itself uses for
 *    valueCommerceService (call real data directly rather than fix mounting
 *    or edit the source file). services/legacy/sharedInfrastructureService.js
 *    (a different file/module, M852100) is the one referenced by the dead
 *    ORPHANED_SERVICES_MOUNT.js and was not used at all.
 *  - Rental/equipment: services/legacy/equipmentExchangeService.js is real
 *    (equipment_exchange_listings table) and mounted live twice
 *    (routes/equipmentExchangeRoutes.js, routes/equipmentExchangeDomainRoutes.js).
 *    Used directly: listAvailable().
 *    services/legacy/machineryAccessService.js is ALSO real (machinery_access
 *    table, migration 041) but was excluded from the studio: it is scoped by
 *    village_id, and there is no join from farmerId/productId to a village
 *    in the current schema (farmers only carries farm_location_id ->
 *    addresses, no village reference) — using it would mean guessing a
 *    village, which is the exact fabrication this feature exists to avoid.
 *    This is a scoping exclusion, not a stub finding.
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
// Section builders — each returns { data, provenance }. Each catches its own
// errors so one failing/unavailable section never fails the whole plan.
// ===========================================================================

/** Pricing — dynamicPricingService's real, deterministic (non-AI) functions:
 * floorBenchmark() (peer floor-price aggregate from farmer_listings) and, if
 * an active yield-managed lot exists for this product, priceForLot() (real
 * markdown/floor math over pricing_lots/pricing_buckets). Deliberately does
 * NOT call calculateLocalMarketPricing() — that function is AI-driven
 * (aiAPI.generateRecommendation) and its own helper functions
 * (getLocalMarketData, getHistoricalPrices, etc.) return hardcoded mock data,
 * which would violate the "no AI-estimated numbers in pricing" rule.
 */
async function getPricingSection(product) {
  const provenance = {};
  const data = { floorBenchmark: null, activeLot: null };

  try {
    const categoryQuery = product.category_name || product.name;
    data.floorBenchmark = await dynamicPricingService.floorBenchmark(categoryQuery);
    provenance['pricing.floorBenchmark'] = dbSourced(data.floorBenchmark.count >= 2);
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

/** Product value score — read-only. calculateValueBasedPrice() is
 * deliberately not called here; see file header. */
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

/** Cold-chain — real, live-computed aggregates off cold_storage_* tables.
 * No booking is created here (that is a farmer-initiated action, not part of
 * a read-only lifecycle plan). */
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

/** Insurance readiness — the farmer's real existing policies
 * (insurance_policies, via insurancePolicyIssuanceService.getUserPolicies).
 * Deliberately does NOT trigger a fresh insurancePremiumService premium
 * calculation: those formulas run off hardcoded regional risk tables (not
 * measured per-farmer data) and need inputs (area, sum insured, season) this
 * endpoint has no honest way to supply without guessing them. */
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

/** Subsidies — governmentSchemeService.checkSchemeEligibility() (real,
 * grounded strictly in the verified government_schemes registry, not a
 * free-form AI call) plus farmerValueService.detectUnclaimedSubsidy()
 * (complementary, different tables). */
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

/** Compliance gates — read directly off compliance_records (real table,
 * migration 000_base_schema.sql). complianceTrackingService.trackCompliance()
 * is a write and, per the file header, does not even match this table's real
 * columns, so it is not used. */
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

/** Farmer Value Index — the decision layer above every other module. */
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

/** Engineering — real engineering_projects rows for the farmer's linked
 * user account, via the live-mounted engineeringProjectService. */
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

/** Shared infrastructure — real assets/asset_types read. See file header for
 * why this queries the schema directly instead of calling
 * sharedInfraService.searchSharedInfrastructure() (AI-gated). */
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

/** Equipment rental — real equipment_exchange_listings read, via the
 * live-mounted equipmentExchangeService. Platform-wide (not farmer/product
 * scoped): the listings table has no reliable link back to a specific
 * product, and scoping by the farmer's state would require a states.id
 * lookup this endpoint's inputs do not carry. */
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

function buildStakeholderLinks() {
  return [
    { section: 'coldChain', label: 'Cold Storage', href: '/cold-storage' },
    { section: 'insurance', label: 'Insurance', href: '/insurance' },
    { section: 'subsidies', label: 'Government Subsidy', href: '/government-subsidy' },
    { section: 'compliance', label: 'Compliance', href: '/compliance' },
    { section: 'engineering', label: 'Engineering Projects', href: '/engineering-projects' },
    { section: 'sharedInfrastructure', label: 'Shared Infrastructure', href: '/shared-infra' },
    { section: 'equipmentRental', label: 'Equipment Rental', href: '/equipment-rental' },
  ];
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
    sharedInfraResult, equipmentRentalResult,
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
  };

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
    stakeholderLinks: buildStakeholderLinks(),
    provenance,
  };
}

// ===========================================================================
// AI — exactly two narrow, isolated, auditable functions. Both delegate to
// existing, already-governed real services; neither is called from
// buildLifecyclePlan() above, so the base plan stays deterministic/cheap.
// ===========================================================================

/**
 * Product positioning copy. Uses aiAPI.generateRecommendation() from
 * aiBackboneService.js — the same governed envelope pattern
 * governmentSchemeService already relies on. Returns the envelope as-is
 * (status 'ok' | 'unavailable' | 'error' | 'rejected', actionBoundary
 * 'advisory_only') — never fabricates copy if no provider is configured.
 */
async function generatePositioningCopy(productData) {
  return aiAPI.generateRecommendation({
    task: 'product_positioning_copy',
    parameters: {
      productId: productData.id,
      name: productData.name,
      category: productData.category,
      basePrice: productData.basePrice,
      valueScore: productData.valueScore || null,
      pricing: productData.pricing || null,
    },
  });
}

/**
 * Product image generation. Delegates entirely to productMediaAIService's
 * real DALL-E 3 adapter, which is honestly `not_configured` with no
 * OPENAI_API_KEY set rather than fabricating an image URL.
 */
async function generateProductImage(productId, prompt) {
  return productMediaAIService.requestProductImageGeneration(productId, prompt);
}

module.exports = {
  buildLifecyclePlan,
  generatePositioningCopy,
  generateProductImage,
  // exported for tests / diagnostics
  getProductContext,
  getFarmerContext,
};
