'use strict';
/** Real Postgres persistence for the Module OS (module_runs, module_steps,
 * module_messages, module_state tables). Faithful port of pine-shadow's
 * src/lib/modules/boot.server.ts (394 lines, read in full), adapted from
 * getSql() to this project's pg Pool the same way erp/boot.server.js and
 * organism/boot.server.js are. */

const { getPostgreSQL } = require('../../database/connection');
const { lastCopilot, runWorkflow } = require('./engine');
const { runtimeStats } = require('./registry');
const { WORKFLOWS } = require('./workflows');

async function query(pool, text, params = []) {
  const r = await pool.query(text, params);
  return r.rows;
}

function asTime(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value ?? '');
}

function asPayload(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

function asEnvelope(value) {
  const o = asPayload(value);
  return { decision: o.decision ?? '', organ: o.organ ?? '', lotId: o.lotId ?? null };
}

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const pool = getPostgreSQL();
  if (!pool) throw new Error('PostgreSQL pool not initialized — call database initialize() first.');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS module_state (
      id INTEGER PRIMARY KEY DEFAULT 1, booted_at TIMESTAMPTZ, living_plugs INTEGER, last_run_id TEXT, last_error TEXT,
      CONSTRAINT module_state_singleton CHECK (id = 1)
    );
    CREATE TABLE IF NOT EXISTS module_runs (
      id TEXT PRIMARY KEY, workflow_id TEXT NOT NULL, organ_id TEXT NOT NULL, lot_id TEXT, status TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL, finished_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS module_steps (
      id SERIAL PRIMARY KEY, run_id TEXT NOT NULL REFERENCES module_runs(id), seq INTEGER NOT NULL, module_id TEXT NOT NULL,
      step_code TEXT NOT NULL, kind TEXT NOT NULL, organ_id TEXT NOT NULL, decision TEXT NOT NULL, reason TEXT NOT NULL,
      algorithm TEXT, rupee_write BOOLEAN NOT NULL DEFAULT false, payload JSONB NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS module_messages (
      id SERIAL PRIMARY KEY, run_id TEXT NOT NULL REFERENCES module_runs(id), from_module TEXT NOT NULL,
      to_module TEXT NOT NULL, signal TEXT NOT NULL, envelope JSONB NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS spine_events (
      id SERIAL PRIMARY KEY, signal TEXT NOT NULL, organ_id TEXT, ligament_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  schemaReady = true;
}

async function persistRun(pool, run) {
  await query(pool, `insert into module_runs (id, workflow_id, organ_id, lot_id, status, started_at, finished_at) values ($1,$2,$3,$4,$5,$6,$7)`,
    [run.id, run.workflowId, run.organId, run.lotId, run.status, run.startedAt, run.finishedAt]);
  for (const [i, step] of run.steps.entries()) {
    await query(pool, `insert into module_steps (run_id, seq, module_id, step_code, kind, organ_id, decision, reason, algorithm, rupee_write, payload) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)`,
      [run.id, i + 1, step.moduleId, step.code, step.kind, step.organ, step.decision, step.reason, step.algorithm, step.rupeeWrite, JSON.stringify(step.payload)]);
  }
  for (const msg of run.messages) {
    await query(pool, `insert into module_messages (run_id, from_module, to_module, signal, envelope) values ($1,$2,$3,$4,$5::jsonb)`,
      [run.id, msg.from, msg.to, msg.signal, JSON.stringify(msg.envelope)]);
  }
  await query(pool, `update module_state set booted_at = coalesce(booted_at, now()), living_plugs = $1, last_run_id = $2, last_error = null where id = 1`,
    [runtimeStats().livingPlugs, run.id]);
}

function assemble(runRows, stepRows, msgRows) {
  const stepsBy = new Map();
  for (const s of stepRows) {
    const list = stepsBy.get(s.run_id) ?? [];
    list.push({ code: s.step_code, moduleId: s.module_id, name: s.step_code, kind: s.kind, organ: s.organ_id, decision: s.decision, reason: s.reason, algorithm: s.algorithm ?? '', rupeeWrite: Boolean(s.rupee_write), emits: s.step_code, payload: asPayload(s.payload) });
    stepsBy.set(s.run_id, list);
  }
  const msgBy = new Map();
  for (const m of msgRows) {
    const list = msgBy.get(m.run_id) ?? [];
    list.push({ from: m.from_module, to: m.to_module, signal: m.signal, envelope: asEnvelope(m.envelope) });
    msgBy.set(m.run_id, list);
  }
  return runRows.map((r) => ({ id: r.id, workflowId: r.workflow_id, organId: r.organ_id, lotId: r.lot_id, status: r.status, startedAt: asTime(r.started_at), finishedAt: r.finished_at ? asTime(r.finished_at) : null, steps: stepsBy.get(r.id) ?? [], messages: msgBy.get(r.id) ?? [] }));
}

async function readModuleOs() {
  await ensureSchema();
  const pool = getPostgreSQL();
  const state = await query(pool, 'select living_plugs, last_run_id, last_error, booted_at from module_state where id = 1');
  const runRows = await query(pool, 'select id, workflow_id, organ_id, lot_id, status, started_at, finished_at from module_runs order by started_at desc, id desc limit 12');
  const ids = runRows.map((r) => r.id);
  let stepRows = [];
  let msgRows = [];
  if (ids.length) {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    stepRows = await query(pool, `select run_id, seq, module_id, step_code, kind, organ_id, decision, reason, algorithm, rupee_write, payload from module_steps where run_id in (${placeholders}) order by seq`, ids);
    msgRows = await query(pool, `select run_id, from_module, to_module, signal, envelope from module_messages where run_id in (${placeholders}) order by id`, ids);
  }
  const runs = assemble(runRows, stepRows, msgRows);
  const stats = runtimeStats();
  return {
    livingPlugs: stats.livingPlugs, partialPlugs: stats.partialPlugs, modules: stats.modules, workflows: WORKFLOWS.length,
    lastRunId: state[0]?.last_run_id ?? runs[0]?.id ?? null, lastError: state[0]?.last_error ?? null,
    bootedAt: state[0]?.booted_at ? asTime(state[0].booted_at) : null, runs, copilot: lastCopilot(runs[0]),
  };
}

const MAGH = [
  { workflowId: 'harvest-mint', ctx: { lotId: 'lot-chakhao-enghi', cellId: 'c-enghi', variety: 'Chakhao Poireiton', commodity: 'black rice', grams: 510000, remainingGrams: 510000, qtyGrams: 0, giMarker: 'GI-AS-CHAKHAO', status: 'minted', query: 'harvest mint lot Chakhao hippocampus' } },
  { workflowId: 'warehouse-intake', ctx: { lotId: 'lot-chakhao-enghi', grams: 510000, remainingGrams: 510000, giMarker: 'GI-AS-CHAKHAO', status: 'inward', pledged: 0 } },
  { workflowId: 'offtake-settle', ctx: { lotId: 'lot-chakhao-enghi', cellId: 'c-enghi', grams: 510000, remainingGrams: 510000, qtyGrams: 510000, pricePaisePerKg: 18500, freightPaisePerKg: 400, paymentRef: 'UPI-KA-8841', hoursToPay: 18, pledged: 0, status: 'settled' } },
  { workflowId: 'harvest-mint', ctx: { lotId: 'lot-chakhao-ronghang', cellId: 'c-ronghang', variety: 'Chakhao Poireiton', commodity: 'black rice', grams: 840000, remainingGrams: 440000, qtyGrams: 400000, giMarker: 'GI-AS-CHAKHAO', status: 'listed', query: 'harvest mint remaining mass' } },
  { workflowId: 'offtake-settle', ctx: { lotId: 'lot-chakhao-ronghang', cellId: 'c-ronghang', grams: 840000, remainingGrams: 440000, qtyGrams: 400000, pricePaisePerKg: 19200, freightPaisePerKg: 400, paymentRef: null, hoursToPay: null, pledged: 0, status: 'listed' } },
  { workflowId: 'period-close', ctx: { journalBalanced: true, clerk: 'Biren', query: 'period close Magh' } },
  { workflowId: 'climate-reflex', ctx: { lotId: 'lot-ginger-teron', remainingGrams: 180000, status: 'outage', alert: true, iotTempC: 31.4, query: 'climate reflex mill' } },
  { workflowId: 'claim-file', ctx: { lotId: 'lot-ginger-teron', query: 'flood claim' } },
];

async function seedModuleOs(pool) {
  await query(pool, 'insert into module_state (id) values (1) on conflict (id) do nothing', []);
  const existing = await query(pool, 'select count(*)::int as n from module_runs');
  if ((existing[0]?.n ?? 0) > 0) return;
  await persistRun(pool, runWorkflow('platform-bus', { query: 'module OS plug harvest lot spine' }));
  await persistRun(pool, runWorkflow('nerve-consult', { query: 'agentic companion harvest lot remaining' }));
  await persistRun(pool, runWorkflow('domain-advise', { query: 'weather alert EMI pause Chakhao' }));
  for (const row of MAGH) await persistRun(pool, runWorkflow(row.workflowId, row.ctx));
}

let seedChain = null;

async function ensureModuleOs() {
  await ensureSchema();
  const pool = getPostgreSQL();
  if (!seedChain) {
    seedChain = seedModuleOs(pool).catch((err) => { seedChain = null; throw err; });
  }
  await seedChain;
  return readModuleOs();
}

async function hydrateCtx(workflowId, ctx) {
  if (workflowId !== 'period-close' && workflowId !== 'climate-reflex') return ctx;
  try {
    const { ensureBooks } = require('../erp/boot.server');
    const books = await ensureBooks();
    if (workflowId === 'period-close') {
      return { ...ctx, journalBalanced: ctx.journalBalanced ?? books.kpis.journalBalanced, clerk: ctx.clerk ?? 'Biren' };
    }
    const outage = books.energyWindows.some((w) => w.active && w.status === 'outage');
    const alert = books.weatherAlerts.some((a) => a.claimOpen);
    const temp = books.iotReadings.find((r) => r.unit === 'C' || /temp/i.test(r.kind));
    const lot = books.lots.find((l) => l.id === ctx.lotId) ?? books.lots[0];
    const win = books.energyWindows.find((w) => w.active);
    return { ...ctx, status: outage ? 'outage' : ctx.status, alert: ctx.alert ?? alert, iotTempC: ctx.iotTempC ?? temp?.valueNum ?? null, remainingGrams: ctx.remainingGrams ?? lot?.remainingGrams, kwh: ctx.kwh ?? win?.kwh ?? null };
  } catch {
    return ctx;
  }
}

async function executeWorkflow(workflowId, ctx = {}) {
  await ensureModuleOs();
  const pool = getPostgreSQL();
  const run = runWorkflow(workflowId, await hydrateCtx(workflowId, ctx));
  await persistRun(pool, run);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'module','b-module-spine',$2::jsonb)`,
    [`module.${workflowId}`, JSON.stringify({ runId: run.id, status: run.status, lotId: run.lotId })]);
  return readModuleOs();
}

async function trackErpSignal(signal, ctx) {
  const map = { 'harvest.completed': 'harvest-mint', 'lot.mint': 'harvest-mint', 'warehouse.intake': 'warehouse-intake', 'lot.ready': 'offtake-settle', 'order.settled': 'offtake-settle' };
  const workflowId = map[signal];
  if (!workflowId) return;
  try {
    await executeWorkflow(workflowId, { ...ctx, query: signal });
  } catch {
    /* Tracking must not roll back village books. */
  }
}

module.exports = { ensureSchema, ensureModuleOs, readModuleOs, executeWorkflow, trackErpSignal };
