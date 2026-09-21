'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');

const TEMPLATE_VERSION = 'ebdesign-governed-v1';
const hash = (value) => crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

async function start({ companyId, actorId, moduleId, capability, prompt, context }) {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO ai_generation_runs
      (id,company_id,actor_id,module_id,capability,status,prompt_sha256,context_sha256,prompt_template_version,policy_decision)
     VALUES ($1,$2,$3,$4,$5,'running',$6,$7,$8,$9::jsonb)`,
    [id, companyId || null, actorId || null, moduleId, capability, hash(prompt), hash(context), TEMPLATE_VERSION,
      JSON.stringify({ externalActionsAllowed: false, humanReviewRequired: true })],
  );
  return { id, startedAt: Date.now() };
}

async function finish(run, result, provenance = []) {
  const usage = result.usage || {};
  await pool.query(
    `UPDATE ai_generation_runs SET status=$2,provider=$3,model=$4,input_tokens=$5,output_tokens=$6,total_tokens=$7,
       latency_ms=$8,library_provenance=$9::jsonb,error_code=$10,completed_at=NOW() WHERE id=$1 AND status='running'`,
    [run.id, result.status, result.provider || null, result.model || null, usage.input_tokens ?? usage.prompt_tokens ?? null,
      usage.output_tokens ?? usage.completion_tokens ?? null, usage.total_tokens ?? usage.totalTokenCount ?? null,
      Date.now() - run.startedAt, JSON.stringify(provenance), result.errorCode || null],
  );
}

module.exports = { start, finish, TEMPLATE_VERSION, hash };
