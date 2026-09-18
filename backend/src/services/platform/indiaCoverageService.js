'use strict';

const pool = require('../../database/pool');
const { withTransaction } = require('../../core/withTransaction');

const STAGES = new Set(['candidate', 'pilot', 'active', 'paused']);
const REQUIRED_ACTIVE_EVIDENCE = ['districtCoverage', 'languageSupport', 'institutionOwner', 'schemeSources', 'fulfillmentCoverage', 'operatorSupport'];

function validateStageChange(current, proposed, evidence, rationale) {
  if (!STAGES.has(proposed)) throw Object.assign(new Error('Unknown rollout stage'), { statusCode: 400 });
  if (typeof rationale !== 'string' || rationale.trim().length < 20) throw Object.assign(new Error('A specific rollout rationale is required'), { statusCode: 400 });
  if (current === proposed) throw Object.assign(new Error('Rollout stage is unchanged'), { statusCode: 409 });
  if (proposed === 'active') {
    const missing = REQUIRED_ACTIVE_EVIDENCE.filter((key) => !evidence || !evidence[key]);
    if (missing.length) throw Object.assign(new Error(`Active rollout requires verified evidence: ${missing.join(', ')}`), { statusCode: 400 });
  }
  return true;
}

async function listCoverage({ type, region, stage } = {}) {
  const filters = [];
  const values = [];
  for (const [column, value] of [['jurisdiction_type', type], ['focus_region', region], ['rollout_stage', stage]]) {
    if (value) { values.push(value); filters.push(`${column}=$${values.length}`); }
  }
  const { rows } = await pool.query(`SELECT name,jurisdiction_type,focus_region,market_launch_scope,rollout_stage,presentation_priority,source_url,source_reviewed_on,local_evidence,updated_at
    FROM india_jurisdiction_coverage ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
    ORDER BY presentation_priority,name`, values);
  return { rows, meaning: 'All-India market launch scope is separate from locally certified services; candidate jurisdictions are not operationally certified.' };
}

async function changeStage(name, input, actorId) {
  if (!name || !actorId) throw Object.assign(new Error('Jurisdiction and named actor are required'), { statusCode: 400 });
  return withTransaction(async (client) => {
    const current = (await client.query('SELECT * FROM india_jurisdiction_coverage WHERE name=$1 FOR UPDATE', [name])).rows[0];
    if (!current) throw Object.assign(new Error('Jurisdiction not found'), { statusCode: 404 });
    validateStageChange(current.rollout_stage, input.stage, input.evidence, input.rationale);
    const updated = (await client.query(`UPDATE india_jurisdiction_coverage SET rollout_stage=$2,local_evidence=$3,updated_by=$4,updated_at=NOW()
      WHERE name=$1 RETURNING *`, [name, input.stage, input.evidence || {}, actorId])).rows[0];
    await client.query(`INSERT INTO india_jurisdiction_coverage_events
      (jurisdiction_name,previous_stage,next_stage,actor_id,rationale,evidence) VALUES($1,$2,$3,$4,$5,$6)`,
    [name, current.rollout_stage, input.stage, actorId, input.rationale.trim(), input.evidence || {}]);
    return updated;
  }, { name: 'indiaCoverage.changeStage' });
}

module.exports = { listCoverage, changeStage, validateStageChange, REQUIRED_ACTIVE_EVIDENCE };
