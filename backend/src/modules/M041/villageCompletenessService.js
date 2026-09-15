'use strict';

const pool = require('../../database/pool');
const { ValidationError, NotFoundError } = require('../../utils/errors');

function villageId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Valid village id is required');
  return id;
}

async function getCompleteness(villageIdValue) {
  const id = villageId(villageIdValue);
  const result = await pool.query('SELECT * FROM village_completeness_gap WHERE village_id = $1', [id]);
  if (!result.rows.length) throw new NotFoundError(`Village not found: ${id}`);
  return result.rows[0];
}

async function getInfrastructureProfile(villageIdValue) {
  const id = villageId(villageIdValue);
  const [assets, institutions, services, hazards, emergency, connectivity, resources] = await Promise.all([
    pool.query('SELECT * FROM village_assets WHERE village_id = $1 ORDER BY asset_type, name', [id]),
    pool.query('SELECT * FROM village_institutions WHERE village_id = $1 ORDER BY institution_type, name', [id]),
    pool.query('SELECT * FROM village_service_coverage WHERE village_id = $1 ORDER BY service_type, measured_on DESC', [id]),
    pool.query('SELECT * FROM village_hazard_profiles WHERE village_id = $1 ORDER BY risk_score DESC NULLS LAST', [id]),
    pool.query('SELECT * FROM village_emergency_resources WHERE village_id = $1 ORDER BY resource_type, name', [id]),
    pool.query('SELECT * FROM village_connectivity_profiles WHERE village_id = $1', [id]),
    pool.query('SELECT * FROM village_natural_resources WHERE village_id = $1 ORDER BY resource_type, resource_name', [id])
  ]);
  return {
    assets: assets.rows,
    institutions: institutions.rows,
    serviceCoverage: services.rows,
    hazards: hazards.rows,
    emergencyResources: emergency.rows,
    connectivity: connectivity.rows[0] || null,
    naturalResources: resources.rows
  };
}

async function readinessSnapshot(villageIdValue) {
  const id = villageId(villageIdValue);
  const result = await pool.query(`
    WITH c AS (SELECT * FROM village_completeness_gap WHERE village_id = $1),
    svc AS (SELECT COALESCE(AVG(coverage_percent),0) AS score FROM village_service_coverage WHERE village_id=$1),
    sk AS (SELECT COUNT(*) AS gaps FROM village_skill_gaps WHERE village_id=$1 AND workers_required > workers_available),
    hz AS (SELECT COALESCE(AVG(100-LEAST(COALESCE(risk_score,100),100)),0) AS score FROM village_hazard_profiles WHERE village_id=$1),
    con AS (SELECT COALESCE((mobile_coverage_percent + broadband_coverage_percent + internet_quality_score)/3,0) AS score FROM village_connectivity_profiles WHERE village_id=$1)
    SELECT c.*, ROUND(svc.score::numeric,2) AS service_readiness,
      GREATEST(0, 100 - sk.gaps * 10) AS skill_readiness,
      ROUND(hz.score::numeric,2) AS resilience_readiness,
      ROUND(con.score::numeric,2) AS connectivity_readiness
    FROM c, svc, sk, hz, con`, [id]);
  if (!result.rows.length) throw new NotFoundError(`Village not found: ${id}`);
  return result.rows[0];
}

module.exports = { getCompleteness, getInfrastructureProfile, readinessSnapshot };
