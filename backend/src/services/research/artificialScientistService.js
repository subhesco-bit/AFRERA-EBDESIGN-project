'use strict';

const crypto = require('crypto');
const pool = require('../../database/pool');
const aiGateway = require('../aiGatewayService');

const TRANSITIONS = Object.freeze({
  hypothesis: { draft: ['approved', 'rejected'], approved: ['retired'], rejected: [], retired: [] },
  protocol: { draft: ['approved', 'superseded'], approved: ['superseded'], superseded: [] },
  experiment: { draft: ['approved', 'cancelled'], approved: ['running', 'cancelled'], running: ['completed', 'failed', 'cancelled'], completed: [], failed: [], cancelled: [] },
  run: { queued: ['running', 'cancelled'], running: ['succeeded', 'failed', 'cancelled'], succeeded: [], failed: [], cancelled: [] },
});

function required(value, name) {
  if (value === undefined || value === null || String(value).trim() === '') throw new Error(`${name} is required`);
  return value;
}

function assertTransition(kind, from, to) {
  if (!TRANSITIONS[kind]?.[from]?.includes(to)) throw new Error(`Invalid ${kind} transition ${from} -> ${to}`);
}

function validateReproducibility(value) {
  const r = value || {};
  required(r.codeRevision, 'reproducibility.codeRevision');
  required(r.runtime, 'reproducibility.runtime');
  if (!/^[0-9a-f]{64}$/.test(String(r.environmentDigest || ''))) throw new Error('reproducibility.environmentDigest must be lowercase SHA-256');
  if (!Number.isSafeInteger(Number(r.randomSeed))) throw new Error('reproducibility.randomSeed must be an integer');
  if (!Array.isArray(r.datasets) || !r.datasets.length) throw new Error('reproducibility.datasets must contain versioned datasets');
  for (const [i, dataset] of r.datasets.entries()) {
    required(dataset.uri, `reproducibility.datasets[${i}].uri`);
    if (!/^[0-9a-f]{64}$/.test(String(dataset.sha256 || ''))) throw new Error(`reproducibility.datasets[${i}].sha256 must be lowercase SHA-256`);
  }
  return r;
}

function validateExperimentalDesign(data) {
  if (!Array.isArray(data.protocol?.steps) || !data.protocol.steps.length) throw new Error('protocol.steps must contain at least one step');
  if (!Array.isArray(data.variables?.independent) || !data.variables.independent.length) throw new Error('variables.independent is required');
  if (!Array.isArray(data.variables?.dependent) || !data.variables.dependent.length) throw new Error('variables.dependent is required');
  required(data.acceptanceCriteria?.primaryMetric, 'acceptanceCriteria.primaryMetric');
  required(data.acceptanceCriteria?.decisionRule, 'acceptanceCriteria.decisionRule');
  return validateReproducibility(data.reproducibility);
}

async function tx(work) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const value = await work(client); await client.query('COMMIT'); return value; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function audit(client, entityType, entityId, action, actorId, previousState, nextState, detail = {}) {
  await client.query(
    `INSERT INTO research_audit_events(entity_type,entity_id,action,actor_id,previous_state,next_state,detail)
     VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [entityType, entityId, action, actorId || null, previousState || null, nextState || null, JSON.stringify(detail)],
  );
}

async function createHypothesis(data, actorId) {
  required(actorId, 'actorId');
  return tx(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO research_hypotheses(title,statement,rationale,null_hypothesis,domain,evidence_refs,created_by)
       VALUES($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING *`,
      [required(data.title, 'title'), required(data.statement, 'statement'), required(data.rationale, 'rationale'),
        data.nullHypothesis || null, required(data.domain, 'domain'), JSON.stringify(data.evidenceRefs || []), actorId],
    );
    await audit(client, 'hypothesis', rows[0].id, 'created', actorId, null, 'draft');
    return rows[0];
  });
}

async function transition(kind, table, id, nextState, actorId, extraSql = '') {
  return tx(async (client) => {
    const current = await client.query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`, [id]);
    if (!current.rows.length) throw new Error(`${kind} ${id} not found`);
    assertTransition(kind, current.rows[0].state, nextState);
    const updated = await client.query(
      `UPDATE ${table} SET state=$2,updated_at=NOW() ${extraSql} WHERE id=$1 RETURNING *`, [id, nextState, actorId],
    );
    await audit(client, kind, id, 'state_changed', actorId, current.rows[0].state, nextState);
    return updated.rows[0];
  });
}

async function reviewHypothesis(id, decision, actorId, reviewData = {}) {
  if (!['approved', 'rejected', 'retired'].includes(decision)) throw new Error('decision must be approved, rejected, or retired');
  return tx(async (client) => {
    const current = await client.query('SELECT * FROM research_hypotheses WHERE id=$1 FOR UPDATE', [id]);
    if (!current.rows.length) throw new Error(`hypothesis ${id} not found`);
    assertTransition('hypothesis', current.rows[0].state, decision);
    const updated = await client.query('UPDATE research_hypotheses SET state=$2,reviewed_by=$3,reviewed_at=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *', [id, decision, actorId]);
    if (decision !== 'retired') {
      await client.query(
        `INSERT INTO research_reviews(entity_type,entity_id,decision,comments,checklist,reviewer_id)
         VALUES('hypothesis',$1,$2,$3,$4::jsonb,$5)`,
        [id, decision, required(reviewData.comments, 'comments'), JSON.stringify(reviewData.checklist || {}), actorId],
      );
    }
    await audit(client, 'hypothesis', id, 'state_changed', actorId, current.rows[0].state, decision);
    return updated.rows[0];
  });
}

async function createExperiment(data, actorId) {
  validateExperimentalDesign(data);
  return tx(async (client) => {
    const hypothesis = await client.query('SELECT state FROM research_hypotheses WHERE id=$1 FOR SHARE', [required(data.hypothesisId, 'hypothesisId')]);
    if (!hypothesis.rows.length || hypothesis.rows[0].state !== 'approved') throw new Error('Experiment requires an approved hypothesis');
    const { rows } = await client.query(
      `INSERT INTO research_experiments(hypothesis_id,title,objective,protocol,variables,acceptance_criteria,reproducibility,created_by)
       VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8) RETURNING *`,
      [data.hypothesisId, required(data.title, 'title'), required(data.objective, 'objective'),
        JSON.stringify(data.protocol || {}), JSON.stringify(data.variables || {}),
        JSON.stringify(data.acceptanceCriteria || {}), JSON.stringify(data.reproducibility), actorId],
    );
    const protocolText = JSON.stringify(data.protocol || {});
    const protocolHash = crypto.createHash('sha256').update(protocolText).digest('hex');
    const protocol = await client.query(
      `INSERT INTO research_protocols(experiment_id,version,content,sha256,authored_by)
       VALUES($1,1,$2::jsonb,$3,$4) RETURNING *`, [rows[0].id, protocolText, protocolHash, actorId],
    );
    await audit(client, 'experiment', rows[0].id, 'created', actorId, null, 'draft', { hypothesisId: data.hypothesisId });
    await audit(client, 'protocol', protocol.rows[0].id, 'created', actorId, null, 'draft', { experimentId: rows[0].id, sha256: protocolHash });
    return { ...rows[0], protocol: protocol.rows[0] };
  });
}

async function transitionExperiment(id, state, actorId) {
  if (state !== 'approved') return transition('experiment', 'research_experiments', id, state, actorId);
  const extra = state === 'approved' ? ',approved_by=$3,approved_at=NOW()' : '';
  return tx(async (client) => {
    const current = await client.query('SELECT * FROM research_experiments WHERE id=$1 FOR UPDATE', [id]);
    if (!current.rows.length) throw new Error(`experiment ${id} not found`);
    assertTransition('experiment', current.rows[0].state, state);
    const protocol = await client.query("SELECT id FROM research_protocols WHERE experiment_id=$1 AND state='approved' ORDER BY version DESC LIMIT 1 FOR SHARE", [id]);
    if (!protocol.rows.length) throw new Error('Experiment approval requires an approved protocol');
    const updated = await client.query(`UPDATE research_experiments SET state=$2,updated_at=NOW() ${extra} WHERE id=$1 RETURNING *`, [id, state, actorId]);
    await audit(client, 'experiment', id, 'state_changed', actorId, current.rows[0].state, state, { protocolId: protocol.rows[0].id });
    return updated.rows[0];
  });
}

async function reviseProtocol(experimentId, content, actorId) {
  const serialized = JSON.stringify(content || {});
  if (!Array.isArray(content?.steps) || !content.steps.length) throw new Error('protocol.steps must contain at least one step');
  return tx(async (client) => {
    const experiment = await client.query('SELECT state FROM research_experiments WHERE id=$1 FOR UPDATE', [experimentId]);
    if (!experiment.rows.length) throw new Error(`experiment ${experimentId} not found`);
    if (experiment.rows[0].state !== 'draft') throw new Error('Protocols can be revised only while the experiment is draft');
    const previous = await client.query('SELECT * FROM research_protocols WHERE experiment_id=$1 ORDER BY version DESC LIMIT 1 FOR UPDATE', [experimentId]);
    if (previous.rows.length) await client.query("UPDATE research_protocols SET state='superseded' WHERE id=$1", [previous.rows[0].id]);
    const version = previous.rows.length ? Number(previous.rows[0].version) + 1 : 1;
    const sha256 = crypto.createHash('sha256').update(serialized).digest('hex');
    const created = await client.query(
      `INSERT INTO research_protocols(experiment_id,version,content,sha256,authored_by)
       VALUES($1,$2,$3::jsonb,$4,$5) RETURNING *`, [experimentId, version, serialized, sha256, actorId],
    );
    await audit(client, 'protocol', created.rows[0].id, 'created', actorId, null, 'draft', { experimentId, supersedes: previous.rows[0]?.id || null });
    return created.rows[0];
  });
}

async function reviewProtocol(id, decision, comments, checklist, actorId) {
  if (!['approved', 'changes_requested'].includes(decision)) throw new Error('Protocol decision must be approved or changes_requested');
  return tx(async (client) => {
    const current = await client.query('SELECT * FROM research_protocols WHERE id=$1 FOR UPDATE', [id]);
    if (!current.rows.length) throw new Error(`protocol ${id} not found`);
    if (current.rows[0].state !== 'draft') throw new Error('Only draft protocols can be reviewed');
    if (decision === 'approved') {
      await client.query("UPDATE research_protocols SET state='approved',reviewed_by=$2,reviewed_at=NOW() WHERE id=$1", [id, actorId]);
    }
    const review = await client.query(
      `INSERT INTO research_reviews(entity_type,entity_id,decision,comments,checklist,reviewer_id)
       VALUES('protocol',$1,$2,$3,$4::jsonb,$5) RETURNING *`,
      [id, decision, required(comments, 'comments'), JSON.stringify(checklist || {}), actorId],
    );
    await audit(client, 'protocol', id, 'reviewed', actorId, 'draft', decision === 'approved' ? 'approved' : 'draft', { reviewId: review.rows[0].id, decision });
    return { protocolId: id, decision, review: review.rows[0] };
  });
}

async function recordReview(entityType, entityId, data, actorId) {
  if (!['hypothesis', 'experiment', 'run', 'artifact'].includes(entityType)) throw new Error('Unsupported review entity type');
  if (!['approved', 'rejected', 'changes_requested'].includes(data.decision)) throw new Error('Unsupported review decision');
  return tx(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO research_reviews(entity_type,entity_id,decision,comments,checklist,reviewer_id)
       VALUES($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
      [entityType, entityId, data.decision, required(data.comments, 'comments'), JSON.stringify(data.checklist || {}), actorId],
    );
    await audit(client, entityType, entityId, 'reviewed', actorId, null, null, { reviewId: rows[0].id, decision: data.decision });
    return rows[0];
  });
}

async function createRun(experimentId, data, actorId) {
  const reproducibility = validateReproducibility(data.reproducibility);
  const requestHash = crypto.createHash('sha256').update(JSON.stringify({
    inputSnapshot: data.inputSnapshot || {}, reproducibility,
  })).digest('hex');
  return tx(async (client) => {
    const experiment = await client.query('SELECT * FROM research_experiments WHERE id=$1 FOR UPDATE', [experimentId]);
    if (!experiment.rows.length || !['approved', 'running'].includes(experiment.rows[0].state)) throw new Error('Runs require an approved or running experiment');
    const key = required(data.idempotencyKey, 'idempotencyKey');
    const replay = await client.query('SELECT * FROM research_experiment_runs WHERE experiment_id=$1 AND idempotency_key=$2', [experimentId, key]);
    if (replay.rows.length) {
      if (replay.rows[0].request_hash !== requestHash) throw new Error('Idempotency key was already used for a different run payload');
      return { ...replay.rows[0], replayed: true };
    }
    const number = await client.query('SELECT COALESCE(MAX(run_number),0)+1 AS n FROM research_experiment_runs WHERE experiment_id=$1', [experimentId]);
    const { rows } = await client.query(
      `INSERT INTO research_experiment_runs(experiment_id,run_number,idempotency_key,request_hash,input_snapshot,reproducibility,started_by)
       VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7) RETURNING *`,
      [experimentId, number.rows[0].n, key, requestHash, JSON.stringify(data.inputSnapshot || {}), JSON.stringify(reproducibility), actorId],
    );
    await audit(client, 'run', rows[0].id, 'created', actorId, null, 'queued', { experimentId });
    return rows[0];
  });
}

async function transitionRun(id, state, data, actorId) {
  return tx(async (client) => {
    const current = await client.query('SELECT * FROM research_experiment_runs WHERE id=$1 FOR UPDATE', [id]);
    if (!current.rows.length) throw new Error(`run ${id} not found`);
    assertTransition('run', current.rows[0].state, state);
    const finished = ['succeeded', 'failed', 'cancelled'].includes(state);
    if (state === 'succeeded' && (!data?.resultSummary || typeof data.resultSummary !== 'object')) throw new Error('Successful run requires resultSummary');
    if (state === 'failed') required(data?.failureReason, 'failureReason');
    const { rows } = await client.query(
      `UPDATE research_experiment_runs SET state=$2,
       started_at=CASE WHEN $2='running' THEN NOW() ELSE started_at END,
       finished_at=CASE WHEN $3 THEN NOW() ELSE finished_at END,
       result_summary=COALESCE($4::jsonb,result_summary),failure_reason=COALESCE($5,failure_reason) WHERE id=$1 RETURNING *`,
      [id, state, finished, data?.resultSummary ? JSON.stringify(data.resultSummary) : null, data?.failureReason || null],
    );
    await audit(client, 'run', id, 'state_changed', actorId, current.rows[0].state, state);
    return rows[0];
  });
}

async function addArtifact(parent, data, actorId) {
  const keys = ['hypothesisId', 'experimentId', 'runId'].filter((key) => parent[key]);
  if (keys.length !== 1) throw new Error('Artifact requires exactly one parent');
  const content = data.content === undefined ? null : (typeof data.content === 'string' ? data.content : JSON.stringify(data.content));
  const computed = content === null ? null : crypto.createHash('sha256').update(content).digest('hex');
  const checksum = String(data.sha256 || computed || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(checksum)) throw new Error('sha256 is required for non-inline artifacts');
  if (computed && data.sha256 && computed !== checksum) throw new Error('Artifact checksum does not match content');
  return tx(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO research_artifacts(hypothesis_id,experiment_id,run_id,kind,name,uri,media_type,sha256,size_bytes,metadata,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11) RETURNING *`,
      [parent.hypothesisId || null, parent.experimentId || null, parent.runId || null,
        required(data.kind, 'kind'), required(data.name, 'name'), data.uri || null, data.mediaType || null,
        checksum, data.sizeBytes ?? (content === null ? null : Buffer.byteLength(content)),
        JSON.stringify({ ...(data.metadata || {}), ...(content === null ? {} : { inlineContent: content }) }), actorId],
    );
    await audit(client, 'artifact', rows[0].id, 'created', actorId, null, null, { kind: data.kind, sha256: checksum, parent });
    return rows[0];
  });
}

async function requestAIAssistance(data, actorId) {
  const operation = String(required(data.operation, 'operation'));
  if (!['hypothesis_review', 'experimental_design', 'result_analysis', 'reproducibility_review'].includes(operation)) throw new Error('Unsupported Artificial Scientist operation');
  const result = await aiGateway.run({
    moduleId: 'artificial-scientist', capability: operation,
    prompt: required(data.prompt, 'prompt'),
    context: { hypothesisId: data.hypothesisId, experimentId: data.experimentId, runId: data.runId,
      instruction: 'Advisory scientific analysis only. Do not claim an experiment ran or evidence exists unless supplied.' },
    provider: data.provider, maxTokens: data.maxTokens,
  });
  const parent = data.runId ? { runId: data.runId } : data.experimentId ? { experimentId: data.experimentId } : { hypothesisId: required(data.hypothesisId, 'hypothesisId') };
  const artifact = await addArtifact(parent, {
    kind: 'ai_output', name: `Governed AI ${operation}`,
    content: result, mediaType: 'application/json',
    metadata: { operation, generated: result.success, provider: result.provider || null, humanReviewRequired: true },
  }, actorId);
  return { ...result, artifactId: artifact.id, persisted: true };
}

async function getResearchRecord(kind, id) {
  const tables = { hypothesis: 'research_hypotheses', protocol: 'research_protocols', experiment: 'research_experiments', run: 'research_experiment_runs' };
  if (!tables[kind]) throw new Error('Unsupported research record kind');
  const [record, artifacts, events, reviews] = await Promise.all([
    pool.query(`SELECT * FROM ${tables[kind]} WHERE id=$1`, [id]),
    kind === 'protocol' ? Promise.resolve({ rows: [] }) : pool.query(`SELECT * FROM research_artifacts WHERE ${kind}_id=$1 ORDER BY created_at`, [id]),
    pool.query('SELECT * FROM research_audit_events WHERE entity_type=$1 AND entity_id=$2 ORDER BY occurred_at,id', [kind, id]),
    pool.query('SELECT * FROM research_reviews WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at', [kind, id]),
  ]);
  if (!record.rows.length) throw new Error(`${kind} ${id} not found`);
  return { ...record.rows[0], artifacts: artifacts.rows, auditEvents: events.rows, reviews: reviews.rows };
}

module.exports = { TRANSITIONS, assertTransition, validateReproducibility, validateExperimentalDesign, createHypothesis, reviewHypothesis,
  createExperiment, reviseProtocol, reviewProtocol, recordReview, transitionExperiment, createRun, transitionRun, addArtifact, requestAIAssistance, getResearchRecord };
