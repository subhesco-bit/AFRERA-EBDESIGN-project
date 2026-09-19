'use strict';

const { getPostgreSQL } = require('../../database/connection');

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function analyze(context = {}) {
  const findings = [];
  const recommendations = [];

  const demand = number(context.demand);
  const supply = number(context.supply);
  const available = number(context.available, supply);
  const stock = number(context.stock);
  const reorderPoint = number(context.reorderPoint);
  const overdue = number(context.overdueDays);
  const variance = Math.abs(number(context.variance));

  if (demand > 0 && supply < demand) {
    findings.push({ code: 'SUPPLY_GAP', severity: 'high', value: demand - supply });
    recommendations.push({ action: 'increase_supply', priority: 'high', reason: 'Demand exceeds committed supply' });
  }
  if (reorderPoint > 0 && stock < reorderPoint) {
    findings.push({ code: 'LOW_STOCK', severity: 'medium', value: reorderPoint - stock });
    recommendations.push({ action: 'replenish_stock', priority: 'medium', reason: 'Stock is below reorder point' });
  }
  if (overdue > 0) {
    findings.push({ code: 'OVERDUE', severity: overdue > 7 ? 'high' : 'medium', value: overdue });
    recommendations.push({ action: 'escalate_overdue', priority: overdue > 7 ? 'high' : 'medium', reason: 'Operational item is overdue' });
  }
  if (variance > 0) {
    findings.push({ code: 'VARIANCE', severity: variance > 1000 ? 'high' : 'medium', value: variance });
    recommendations.push({ action: 'reconcile_variance', priority: variance > 1000 ? 'high' : 'medium', reason: 'Ledger variance requires review' });
  }
  if (available > 0 && demand > 0 && available / demand >= 1.2) {
    recommendations.push({ action: 'optimize_allocation', priority: 'low', reason: 'Available supply materially exceeds demand' });
  }

  const riskCount = findings.filter(f => f.severity === 'high').length;
  const confidence = findings.length === 0 ? 0.72 : Math.min(0.97, 0.78 + Math.min(findings.length, 4) * 0.04);
  return { findings, recommendations, confidence, risk: riskCount ? 'high' : findings.length ? 'medium' : 'low' };
}

async function persist(result, input = {}, actor = null) {
  const pg = getPostgreSQL();
  if (!pg) return { persisted: false, ...result };
  const { rows } = await pg.query(
    `INSERT INTO ai_intelligence_runs
      (domain, entity_type, entity_id, objective, input_context, findings, recommendations, confidence, status, created_by)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,'completed',$9)
     RETURNING id, created_at`,
    [
      input.domain || 'erp', input.entityType || 'unknown', input.entityId || null,
      input.objective || 'operational intelligence', JSON.stringify(input.context || {}),
      JSON.stringify(result.findings), JSON.stringify(result.recommendations), result.confidence, actor,
    ],
  );
  return { ...result, runId: rows[0].id, persisted: true };
}

async function assess(input = {}, actor = null) {
  const result = analyze(input.context || input);
  return persist(result, input, actor);
}

module.exports = { analyze, assess, persist };
