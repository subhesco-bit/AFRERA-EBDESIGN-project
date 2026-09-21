'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');

// M001-M050 are deliberately represented by domain-specific contracts. This
// is not a generic CRUD layer: each contract describes the business evidence,
// invariants and AI enhancement expected for that module.
const CONTRACTS = {
  M001: { name:'Platform Core', domain:'Platform Foundation', required:['platform_name','version','environment','deployment_type'], invariant:'deployment_type must be declared and environment must be one of development,test,staging,production', ai:'capacity risk, dependency health, deployment impact and rollback recommendation' },
  M002: { name:'Platform Configuration', domain:'Platform Foundation', required:['config_key','config_type','environment'], invariant:'sensitive configuration must not be stored unencrypted and production changes require audit context', ai:'configuration drift, dependency impact and security-risk analysis' },
  M003: { name:'Tenant Management', domain:'Platform Foundation', required:['tenant_name','tenant_code','plan_tier'], invariant:'tenant_code unique; quota changes cannot reduce below current usage', ai:'resource allocation, isolation risk and capacity forecasting' },
  M004: { name:'Organization Management', domain:'Platform Foundation', required:['organization_name'], invariant:'organization identity must be unique within tenant and parent-child hierarchy cannot cycle', ai:'organization hierarchy and delegation-risk analysis' },
  M005: { name:'Environment Management', domain:'Platform Foundation', required:['environment','status'], invariant:'production environment cannot be destroyed or disabled without explicit change approval', ai:'configuration drift and release-risk analysis' },
  M006: { name:'System Administration', domain:'Platform Foundation', required:['operation','target'], invariant:'administrative operation must identify actor, target and reason', ai:'privilege-impact and operational-risk assessment' },
  M007: { name:'Feature Flag Management', domain:'Platform Foundation', required:['flag_key','environment'], invariant:'percentage rollout must be 0..100 and production kill-switch changes are audited', ai:'rollout-risk, cohort impact and rollback recommendation' },
  M008: { name:'Localization Management', domain:'Platform Foundation', required:['locale','resource_key','value'], invariant:'locale must be supported and resource keys cannot silently overwrite protected translations', ai:'translation quality, terminology consistency and missing-key detection' },
  M009: { name:'Time Zone Management', domain:'Platform Foundation', required:['timezone'], invariant:'timezone must be IANA-compatible and business dates must be timezone-aware', ai:'DST boundary and cross-region scheduling risk' },
  M010: { name:'Master Configuration', domain:'Platform Foundation', required:['config_key','value','category'], invariant:'configuration ownership and effective environment must be explicit', ai:'configuration dependency graph and anomaly detection' },
  M011: { name:'User Management', domain:'Identity', required:['user_id','status'], invariant:'disabled users cannot retain active sessions or privileged assignments', ai:'account-risk, dormant-user detection and access recommendation' },
  M012: { name:'Authentication', domain:'Identity', required:['credential_context'], invariant:'authentication must use approved token/session mechanism and never expose credentials in logs', ai:'adaptive authentication and suspicious-login detection' },
  M013: { name:'Authorization', domain:'Identity', required:['subject','resource','action'], invariant:'authorization decision must be deny-by-default with tenant/resource scope', ai:'privilege escalation and unusual-access detection' },
  M014: { name:'Role Management', domain:'Identity', required:['role_name','permissions'], invariant:'role hierarchy must be acyclic and privileged roles require controlled assignment', ai:'least-privilege role optimization' },
  M015: { name:'Permission Management', domain:'Identity', required:['permission','resource'], invariant:'wildcard permissions require elevated approval and permission changes are versioned', ai:'permission blast-radius and toxic-combination detection' },
  M016: { name:'Single Sign-On', domain:'Identity', required:['provider','redirect_uri'], invariant:'redirect URI must be registered and state/nonce verification is mandatory', ai:'provider anomaly and SSO failure analysis' },
  M017: { name:'Multi-Factor Authentication', domain:'Identity', required:['user_id','factor_type'], invariant:'recovery path must not bypass MFA assurance requirements', ai:'factor-risk and anomalous authentication pattern analysis' },
  M018: { name:'Digital Identity', domain:'Identity', required:['identity_id','assurance_level'], invariant:'identity proofing evidence must be traceable and assurance level cannot be self-elevated', ai:'identity confidence and duplicate-identity detection' },
  M019: { name:'Consent Management', domain:'Identity', required:['subject_id','purpose','status'], invariant:'consent must be purpose-specific, versioned and revocable', ai:'consent-expiry and purpose-mismatch detection' },
  M020: { name:'Session Management', domain:'Identity', required:['session_id','user_id','issued_at'], invariant:'expired or revoked sessions cannot authorize requests', ai:'session anomaly and concurrent-session risk detection' },
  M021: { name:'Farmer Registry', domain:'Farmer', required:['farmer_id','name','village_id'], invariant:'farmer identity must be unique and linked to a verified geography', ai:'duplicate farmer detection, onboarding risk and profile completeness' },
  M022: { name:'Farmer Profile', domain:'Farmer', required:['farmer_id'], invariant:'profile changes preserve verified identity and provenance', ai:'profile completeness, livelihood segmentation and service recommendations' },
  M023: { name:'Farmer Family', domain:'Farmer', required:['farmer_id','members'], invariant:'family member relationships cannot create impossible self/duplicate relationships', ai:'household dependency and livelihood-risk analysis' },
  M024: { name:'Farmer KYC', domain:'Farmer', required:['farmer_id','document_type','document_reference'], invariant:'KYC status cannot become verified without evidence and verifier identity', ai:'document-quality and KYC anomaly detection' },
  M025: { name:'Farmer Verification', domain:'Farmer', required:['farmer_id','verification_type','status'], invariant:'verification decisions require evidence and reviewer traceability', ai:'verification confidence and conflicting-evidence detection' },
  M026: { name:'Farmer Skill Management', domain:'Farmer', required:['farmer_id','skill'], invariant:'skill proficiency must have source/evidence and valid proficiency scale', ai:'skill-gap analysis and training-path recommendation' },
  M027: { name:'Farmer Certification', domain:'Farmer', required:['farmer_id','certificate_type','expiry_date'], invariant:'expired certificates cannot satisfy active certification requirements', ai:'renewal forecasting and certification-risk alerts' },
  M028: { name:'Farmer Advisory', domain:'Farmer', required:['farmer_id','advisory_type','recommendation'], invariant:'advice must record evidence/time/context and cannot claim certainty beyond source quality', ai:'personalized agronomic/economic recommendations' },
  M029: { name:'Farmer Health & Welfare', domain:'Farmer', required:['farmer_id','assessment_date'], invariant:'sensitive health data requires strict access scope and purpose limitation', ai:'non-diagnostic welfare-risk prioritization and service referral' },
  M030: { name:'Farmer Performance', domain:'Farmer', required:['farmer_id','period'], invariant:'performance metrics must declare calculation period and source data', ai:'yield/value/productivity benchmarking with explainable drivers' },
  M031: { name:'Land Registry', domain:'Land', required:['land_id','owner_reference','location'], invariant:'land identity and ownership evidence must be versioned', ai:'registry completeness and conflicting-record detection' },
  M032: { name:'Land Ownership', domain:'Land', required:['land_id','owner_reference','effective_date'], invariant:'overlapping exclusive ownership claims require conflict status', ai:'ownership-conflict and provenance analysis' },
  M033: { name:'Land Lease Management', domain:'Land', required:['land_id','lessor','lessee','start_date','end_date'], invariant:'lease dates must be ordered and overlapping exclusive leases blocked', ai:'lease-expiry, rent-risk and renewal forecasting' },
  M034: { name:'Parcel Mapping', domain:'Land', required:['parcel_id','geometry'], invariant:'parcel geometry must be valid and area must be non-negative', ai:'geometry anomaly and parcel-overlap detection' },
  M035: { name:'GIS Land Mapping', domain:'Land', required:['layer','geometry'], invariant:'spatial records must declare coordinate reference system', ai:'land-use pattern and spatial suitability analysis' },
  M036: { name:'Soil Mapping', domain:'Land', required:['location','sample_date','soil_attributes'], invariant:'soil observations must retain sample date and method/provenance', ai:'soil-health trend and crop suitability inference' },
  M037: { name:'Water Resource Mapping', domain:'Land', required:['resource_id','resource_type','location'], invariant:'water source capacity and seasonal status must be distinguishable', ai:'water availability, seasonal stress and irrigation prioritization' },
  M038: { name:'Geo Boundary Management', domain:'Land', required:['boundary_type','geometry'], invariant:'boundaries must be versioned and topology conflicts flagged', ai:'boundary anomaly and jurisdiction-conflict detection' },
  M039: { name:'Survey Management', domain:'Land', required:['survey_id','survey_date','location'], invariant:'survey observations require enumerator/source provenance', ai:'survey consistency, outlier and missing-evidence detection' },
  M040: { name:'Digital Land Records', domain:'Land', required:['record_id','record_type','source_reference'], invariant:'digital record must retain source reference, version and verification status', ai:'record reconciliation and document-to-record discrepancy detection' },
  M041: { name:'Village Registry', domain:'Community', required:['village_id','village_name','district','state'], invariant:'village code/geography must be unique and administrative hierarchy consistent', ai:'village readiness, service-gap and development-priority analysis' },
  M042: { name:'Panchayat Management', domain:'Community', required:['panchayat_id','village_id'], invariant:'meeting/resolution records require date, decision and responsible authority', ai:'implementation-delay and governance-action prioritization' },
  M043: { name:'Block Management', domain:'Community', required:['block_id','district_id'], invariant:'block must belong to exactly one district in an effective period', ai:'block-level service coverage and resource allocation' },
  M044: { name:'District Management', domain:'Community', required:['district_id','state_id'], invariant:'district hierarchy and administrative codes must remain unique', ai:'district comparative performance and investment prioritization' },
  M045: { name:'State Management', domain:'Community', required:['state_id','state_code'], invariant:'state code must be unique and administrative hierarchy must be closed', ai:'state-level portfolio and regional disparity analysis' },
  M046: { name:'SHG Management', domain:'Community', required:['group_id','members','meeting_frequency'], invariant:'member must not be duplicated within an active group and savings/loan records reconcile', ai:'SHG financial health and livelihood opportunity recommendations' },
  M047: { name:'Cooperative Management', domain:'Community', required:['cooperative_id','members'], invariant:'membership/share holdings must reconcile with cooperative ledger', ai:'member economics, governance and capital-adequacy analysis' },
  M048: { name:'Producer Group Management', domain:'Community', required:['group_id','producer_type','members'], invariant:'group membership and producer aggregation must be traceable', ai:'aggregation potential and market-readiness analysis' },
  M049: { name:'Community Asset Management', domain:'Community', required:['asset_id','asset_type','location','condition'], invariant:'asset lifecycle requires custodian and maintenance state', ai:'maintenance prioritization, utilization and replacement forecasting' },
  M050: { name:'Rural Development Management', domain:'Community', required:['village_id','initiative','status'], invariant:'development initiative must have owner, target, baseline and measurable outcome', ai:'multi-dimensional village development portfolio optimization' },
};

function missingFields(contract, payload) {
  return contract.required.filter((key) => {
    const value = payload?.[key];
    return value === undefined || value === null || (typeof value === 'string' && !value.trim());
  });
}

function validateModule(moduleId, payload = {}) {
  const contract = CONTRACTS[moduleId];
  if (!contract) throw Object.assign(new Error(`Unknown production contract: ${moduleId}`), { code: 'UNKNOWN_MODULE' });
  const missing = missingFields(contract, payload);
  const violations = [];
  if (moduleId === 'M001' && payload.environment && !['development','test','staging','production'].includes(payload.environment)) violations.push('invalid_environment');
  if (moduleId === 'M007' && payload.rollout_percentage != null && (payload.rollout_percentage < 0 || payload.rollout_percentage > 100)) violations.push('rollout_percentage_out_of_range');
  if (moduleId === 'M009' && payload.timezone && !/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(payload.timezone)) violations.push('invalid_iana_timezone');
  if (moduleId === 'M033' && payload.start_date && payload.end_date && new Date(payload.start_date) >= new Date(payload.end_date)) violations.push('lease_end_must_follow_start');
  if (moduleId === 'M049' && payload.condition && !['excellent','good','fair','poor','critical'].includes(payload.condition)) violations.push('invalid_asset_condition');
  return { module_id: moduleId, name: contract.name, domain: contract.domain, valid: missing.length === 0 && violations.length === 0, missing, violations, invariant: contract.invariant, ai_enhancement: contract.ai };
}

async function assess(moduleId, payload = {}) {
  const validation = validateModule(moduleId, payload);
  const riskSignals = [];
  if (!validation.valid) riskSignals.push('validation_failure');
  if (moduleId === 'M024' && payload.verification_status === 'verified' && !payload.verifier_id) riskSignals.push('unattributed_kyc_verification');
  if (moduleId === 'M013' && payload.effect === 'grant_privilege' && payload.approval_id == null) riskSignals.push('privilege_change_without_approval');
  if (moduleId === 'M041' && Number(payload.population || 0) > 0 && Number(payload.households || 0) > Number(payload.population)) riskSignals.push('household_population_inconsistency');
  if (moduleId === 'M046' && Array.isArray(payload.members) && new Set(payload.members).size !== payload.members.length) riskSignals.push('duplicate_shg_member');
  if (moduleId === 'M047' && payload.member_shares_total != null && payload.ledger_share_total != null && Number(payload.member_shares_total) !== Number(payload.ledger_share_total)) riskSignals.push('cooperative_share_ledger_mismatch');
  return { ...validation, risk_signals: riskSignals, risk_level: riskSignals.length ? 'high' : 'normal', correlation_id: crypto.randomUUID() };
}

async function recordAssessment(moduleId, payload, assessment) {
  const pg = pool;
  if (!pg) return assessment;
  const q = await pg.query(
    `INSERT INTO module_production_assurance (id,module_id,module_name,domain,payload,assessment,status,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING id,created_at`,
    [crypto.randomUUID(), moduleId, assessment.name, assessment.domain, JSON.stringify(payload), JSON.stringify(assessment), assessment.valid ? 'passed' : 'failed'],
  );
  return { ...assessment, assurance_id: q.rows[0].id, created_at: q.rows[0].created_at };
}

module.exports = { CONTRACTS, validateModule, assess, recordAssessment };
