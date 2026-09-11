const crypto = require('crypto');
const { getPostgreSQL } = require('../database/connection');
const fulfillment = require('./fulfillmentOrchestrationService');
const commercial = require('./commercialErpReconciliationService');

function db() { const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized'); return pg; }

async function start(flowName, correlationId, context = {}) {
  const id = crypto.randomUUID();
  const result = await db().query(`INSERT INTO e2e_flow_runs (id,flow_name,correlation_id,current_stage,status,context) VALUES ($1,$2,$3,$4,'running',$5) RETURNING *`, [id, flowName, correlationId, 'started', JSON.stringify(context)]);
  return result.rows[0];
}

async function stage(id, currentStage, status = 'running', context = null) {
  const result = await db().query(`UPDATE e2e_flow_runs SET current_stage=$1,status=$2,context=CASE WHEN $3::jsonb IS NULL THEN context ELSE context || $3::jsonb END,completed_at=CASE WHEN $2 IN ('passed','failed','rolled_back') THEN NOW() ELSE completed_at END WHERE id=$4 RETURNING *`, [currentStage, status, context ? JSON.stringify(context) : null, id]);
  if (!result.rows[0]) throw new Error('Flow run not found');
  return result.rows[0];
}

async function runCommercialFlow({ flowName = 'village-commercial-order', correlationId, orderId, shipment }) {
  if (!correlationId || !orderId || !shipment) throw new Error('correlationId, orderId and shipment are required');
  const run = await start(flowName, correlationId, { orderId });
  try {
    await stage(run.id, 'shipment_creation');
    const created = await fulfillment.createShipment({ orderId, ...shipment });
    await stage(run.id, 'shipment_created', 'running', { shipmentId: created.id });
    await stage(run.id, 'delivery_ready');
    await stage(run.id, 'reconciliation_ready');
    return await stage(run.id, 'completed', 'passed', { shipmentId: created.id });
  } catch (error) {
    await stage(run.id, 'failed', 'failed', { error: error.message });
    throw error;
  }
}

module.exports = { start, stage, runCommercialFlow, commercial };
