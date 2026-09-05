/**
 * Enterprise Control Service — the modules that govern other modules.
 *
 * Backs migration 993 (workflow, CRM, clients, legal, risk, emergency).
 *
 * WHY THESE SIX LIVE IN ONE SERVICE
 * They are not six unrelated features; they are one governance layer with a
 * shared contract. Every one of them answers "who decides, by when, and what
 * happens if nobody does". Splitting them into six services would duplicate
 * that escalation logic six times and let it drift — the exact failure the
 * workflow engine exists to prevent.
 *
 * WHAT THIS SERVICE WILL NOT DO
 * It does not approve, escalate or close anything on its own authority. It
 * records, computes and surfaces. The AI agents in core/erpAgents.js propose;
 * a named human disposes. Emergency is the one place where the standing
 * instruction is returned immediately without deliberation — but even there,
 * the ACTION is taken by a person and merely logged here.
 */

const express = require('express');
const { getPostgreSQL } = require('../../database/connection');
const { authMiddleware } = require('../../middleware/auth');
const { adminMiddleware } = require('../../middleware/admin');
const { logger } = require('../../utils/logger');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

const router = express.Router();

/** Severity ordering used for triage. Higher means sooner. */
const SEVERITY_RANK = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });

/** Generate a human-readable, sortable code. */
function makeCode(prefix) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function fail(res, error, context) {
  logger.error(`enterpriseControl:${context}`, { message: error.message });
  return res.status(500).json({ success: false, error: error.message });
}

// ===========================================================================
// WORKFLOW ENGINE
// ===========================================================================

/**
 * Start a workflow instance for any entity in the system.
 *
 * The step chosen is the FIRST step whose threshold the amount clears. This is
 * how approval limits work in practice: a ₹5,000 purchase and a ₹5,00,000
 * purchase follow the same definition but enter at different points.
 */
async function startWorkflow({ workflowCode, entityType, entityId, amount, initiatedBy, context }) {
  const db = getPostgreSQL();
  const { rows: defs } = await db.query(
    `SELECT id, entity_type FROM workflow_definitions
      WHERE workflow_code = $1 AND is_active = TRUE
      ORDER BY version DESC LIMIT 1`,
    [workflowCode]
  );
  if (defs.length === 0) throw new Error(`No active workflow definition "${workflowCode}"`);
  const def = defs[0];

  const { rows: steps } = await db.query(
    `SELECT id, step_number, name, threshold_amount
       FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_number ASC`,
    [def.id]
  );
  if (steps.length === 0) throw new Error(`Workflow "${workflowCode}" has no steps defined`);

  const amt = Number(amount) || 0;
  const firstStep =
    steps.find((s) => s.threshold_amount == null || amt >= Number(s.threshold_amount)) || steps[0];

  const { rows } = await db.query(
    `INSERT INTO workflow_instances
       (instance_code, workflow_id, entity_type, entity_id, current_step_id, status, initiated_by, context)
     VALUES ($1,$2,$3,$4,$5,'running',$6,$7) RETURNING *`,
    [makeCode('WF'), def.id, entityType, String(entityId), firstStep.id, initiatedBy ?? null,
      JSON.stringify(context ?? {})]
  );
  const instance = rows[0];

  await db.query(
    `INSERT INTO workflow_actions (instance_id, step_id, action, actor_id)
     VALUES ($1,$2,'submitted',$3)`,
    [instance.id, firstStep.id, initiatedBy ?? null]
  );

  return { ...instance, currentStep: firstStep.name };
}

/**
 * Act on the current step. Approval advances to the next step or completes;
 * rejection ends the instance and REQUIRES a reason (the DB enforces this too).
 */
async function actOnWorkflow({ instanceCode, action, actorId, comment, delegatedFrom }) {
  let db = getPostgreSQL();
  const { rows: found } = await db.query(
    `SELECT wi.*, ws.step_number, ws.workflow_id
       FROM workflow_instances wi
       LEFT JOIN workflow_steps ws ON ws.id = wi.current_step_id
      WHERE wi.instance_code = $1`,
    [instanceCode]
  );
  if (found.length === 0) throw new Error(`Workflow instance ${instanceCode} not found`);
  const inst = found[0];

  if (!['running', 'waiting'].includes(inst.status)) {
    throw new Error(`Instance ${instanceCode} is already ${inst.status} and cannot be acted on`);
  }
  if (action === 'rejected' && (!comment || !comment.trim())) {
    throw new Error('A rejection must carry a reason');
  }

  await db.query(
    `INSERT INTO workflow_actions (instance_id, step_id, action, actor_id, delegated_from, comment)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [inst.id, inst.current_step_id, action, actorId ?? null, delegatedFrom ?? null, comment ?? null]
  );

  if (action === 'rejected') {
    await db.query(
      `UPDATE workflow_instances
          SET status='rejected', completed_at=CURRENT_TIMESTAMP, outcome_reason=$2
        WHERE id=$1`,
      [inst.id, comment]
    );
    return { instanceCode, status: 'rejected' };
  }

  if (action !== 'approved') return { instanceCode, status: inst.status, recorded: action };

  const { rows: next } = await db.query(
    `SELECT id, name FROM workflow_steps
      WHERE workflow_id=$1 AND step_number > $2
      ORDER BY step_number ASC LIMIT 1`,
    [inst.workflow_id, inst.step_number ?? 0]
  );

  if (next.length === 0) {
    await db.query(
      `UPDATE workflow_instances
          SET status='approved', completed_at=CURRENT_TIMESTAMP, current_step_id=NULL
        WHERE id=$1`,
      [inst.id]
    );
    return { instanceCode, status: 'approved', complete: true };
  }

  await db.query('UPDATE workflow_instances SET current_step_id=$2 WHERE id=$1', [inst.id, next[0].id]);
  return { instanceCode, status: 'running', currentStep: next[0].name };
}

async function listPendingApprovals({ role } = {}) {
  let db = getPostgreSQL();
  const params = [];
  let where = '';
  if (role) { params.push(role); where = 'WHERE required_role = $1'; }
  const { rows } = await db.query(
    `SELECT * FROM v_pending_approvals ${where} ORDER BY hours_open DESC`, params
  );
  return rows;
}

// ===========================================================================
// CRM
// ===========================================================================

async function createLead(payload) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `INSERT INTO crm_leads
      (lead_code, source, organisation_name, contact_name, email, phone, segment, estimated_value, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [makeCode('LEAD'), payload.source ?? null, payload.organisationName ?? null,
      payload.contactName ?? null, payload.email ?? null, payload.phone ?? null,
      payload.segment ?? null, payload.estimatedValue ?? null, payload.ownerId ?? null]
  );
  return rows[0];
}

/**
 * Convert a qualified lead into an opportunity, and optionally a client.
 * Runs in a transaction: a lead marked converted with no opportunity to show
 * for it is a data lie that quietly inflates conversion metrics.
 */
async function convertLead({ leadCode, name, amount, probabilityPct, expectedCloseDate, createClient }) {
  let db = getPostgreSQL();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: leads } = await client.query(
      'SELECT * FROM crm_leads WHERE lead_code=$1 FOR UPDATE', [leadCode]
    );
    if (leads.length === 0) throw new Error(`Lead ${leadCode} not found`);
    const lead = leads[0];
    if (lead.status === 'converted') throw new Error(`Lead ${leadCode} is already converted`);

    let clientId = null;
    if (createClient && lead.organisation_name) {
      const { rows: c } = await client.query(
        `INSERT INTO clients (client_code, legal_name, segment, status, onboarded_at)
         VALUES ($1,$2,$3,'active',CURRENT_DATE) RETURNING id`,
        [makeCode('CL'), lead.organisation_name, lead.segment ?? null]
      );
      clientId = c[0].id;
    }

    const { rows: opp } = await client.query(
      `INSERT INTO crm_opportunities
        (opportunity_code, lead_id, client_id, name, stage, amount, probability_pct, expected_close_date, owner_id)
       VALUES ($1,$2,$3,$4,'qualification',$5,$6,$7,$8) RETURNING *`,
      [makeCode('OPP'), lead.id, clientId, name ?? lead.organisation_name ?? 'Untitled',
        amount ?? lead.estimated_value ?? 0, probabilityPct ?? 25,
        expectedCloseDate ?? null, lead.owner_id]
    );

    await client.query("UPDATE crm_leads SET status='converted' WHERE id=$1", [lead.id]);
    await client.query('COMMIT');
    return { opportunity: opp[0], clientId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getPipeline() {
  let db = getPostgreSQL();
  const { rows } = await db.query('SELECT * FROM v_sales_pipeline');
  const weighted = rows.reduce((s, r) => s + Number(r.weighted_value || 0), 0);
  const gross = rows.reduce((s, r) => s + Number(r.gross_value || 0), 0);
  return {
    byStage: rows,
    totals: { gross, weighted },
    // Stated plainly, because a weighted figure quoted alone reads as certainty.
    note: 'Weighted value applies each deal\'s own probability; it is a planning figure, not committed revenue.'
  };
}

// ===========================================================================
// CLIENT MANAGEMENT
// ===========================================================================

/**
 * Account health, computed from behaviour rather than opinion.
 * Returns the breakdown alongside the score so a low score can be argued with.
 */
async function computeClientHealth(clientId) {
  let db = getPostgreSQL();
  const { rows } = await db.query('SELECT * FROM clients WHERE id=$1', [clientId]);
  if (rows.length === 0) throw new Error(`Client ${clientId} not found`);
  const c = rows[0];

  const { rows: act } = await db.query(
    `SELECT COUNT(*)::int AS n, MAX(occurred_at) AS last_touch
       FROM crm_activities WHERE subject_type='client' AND subject_id=$1`,
    [clientId]
  );
  const activityCount = act[0]?.n ?? 0;
  const lastTouch = act[0]?.last_touch ? new Date(act[0].last_touch) : null;
  const daysSinceTouch = lastTouch
    ? Math.floor((Date.now() - lastTouch.getTime()) / 86400000)
    : null;

  const factors = [
    { name: 'Engagement recency', weight: 0.35,
      score: daysSinceTouch == null ? 30 : Math.max(0, 100 - daysSinceTouch * 2),
      dataQuality: daysSinceTouch == null ? 'assumed' : 'real' },
    { name: 'Interaction volume', weight: 0.25,
      score: Math.min(100, activityCount * 10), dataQuality: 'real' },
    { name: 'Account standing', weight: 0.40,
      score: c.status === 'active' ? 100 : c.status === 'on_hold' ? 30 : c.status === 'prospect' ? 50 : 0,
      dataQuality: 'real' }
  ];

  const score = Number(factors.reduce((s, f) => s + f.weight * f.score, 0).toFixed(2));
  const breakdown = { factors, daysSinceTouch, activityCount };

  await db.query('UPDATE clients SET health_score=$2, health_breakdown=$3 WHERE id=$1',
    [clientId, score, JSON.stringify(breakdown)]);

  return { clientId, score, breakdown };
}

// ===========================================================================
// LEGAL
// ===========================================================================

async function listLegalCalendar({ withinDays = 60 } = {}) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `SELECT * FROM v_legal_calendar
      WHERE due_date <= CURRENT_DATE + ($1 || ' days')::interval
      ORDER BY due_date ASC`,
    [String(withinDays)]
  );
  return rows.map((r) => ({
    ...r,
    daysUntilDue: Math.ceil((new Date(r.due_date) - Date.now()) / 86400000),
    overdue: new Date(r.due_date) < new Date()
  }));
}

// ===========================================================================
// RISK
// ===========================================================================

/**
 * Risk scoring is likelihood × impact on a 1-5 scale each, giving 1-25.
 * Both inherent (before controls) and residual (after) are stored, because a
 * register holding only residual scores cannot show whether controls work.
 */
async function assessRisk({ riskCode, residualLikelihood, residualImpact, reviewedBy }) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `UPDATE risk_register
        SET residual_likelihood=$2, residual_impact=$3,
            last_reviewed=CURRENT_DATE,
            next_review = CURRENT_DATE + CASE review_frequency
                            WHEN 'monthly' THEN INTERVAL '1 month'
                            WHEN 'annual'  THEN INTERVAL '1 year'
                            ELSE INTERVAL '3 months' END
      WHERE risk_code=$1 RETURNING *`,
    [riskCode, residualLikelihood, residualImpact]
  );
  if (rows.length === 0) throw new Error(`Risk ${riskCode} not found`);
  const risk = rows[0];

  if (Number(risk.residual_score) >= 15) {
    signalBus.emitSignal(
      SIGNAL.RISK_CRITICAL,
      { riskCode, residualScore: risk.residual_score, title: risk.title, reviewedBy },
      { severity: SEVERITY.CRITICAL, source: 'enterpriseControlService.assessRisk' }
    );
  }
  return risk;
}

async function getRiskHeatmap() {
  let db = getPostgreSQL();
  const { rows } = await db.query('SELECT * FROM v_risk_heatmap ORDER BY critical DESC, total DESC');
  return rows;
}

// ===========================================================================
// EMERGENCY — the reflex arc
// ===========================================================================

/**
 * Raise an incident. Returns the standing instruction IMMEDIATELY in the same
 * response, before any deliberation: under pressure nobody opens a policy PDF.
 *
 * Life safety overrides severity as declared. If people are at risk the
 * incident is critical regardless of what the caller typed, because a
 * mis-typed severity must never be the reason help arrived slowly.
 */
async function raiseIncident({ typeCode, severity, title, description, affectedEntityType,
  affectedEntityIds, peopleAtRisk, detectedBy }) {
  let db = getPostgreSQL();

  let type = null;
  if (typeCode) {
    const { rows } = await db.query('SELECT * FROM emergency_types WHERE type_code=$1 AND is_active=TRUE', [typeCode]);
    type = rows[0] ?? null;
  }

  let finalSeverity = severity ?? type?.default_severity ?? 'high';
  let severityNote = null;
  if (peopleAtRisk && finalSeverity !== 'critical') {
    severityNote = `Severity raised from "${finalSeverity}" to "critical": people are at risk.`;
    finalSeverity = 'critical';
  }

  const { rows } = await db.query(
    `INSERT INTO emergency_incidents
      (incident_code, type_id, severity, title, description, affected_entity_type,
       affected_entity_ids, people_at_risk, detected_by, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open') RETURNING *`,
    [makeCode('INC'), type?.id ?? null, finalSeverity, title, description,
      affectedEntityType ?? null, affectedEntityIds ?? null,
      Boolean(peopleAtRisk), detectedBy ?? 'human']
  );
  const incident = rows[0];

  // Who to wake, in order, filtered to this category.
  const { rows: contacts } = await db.query(
    `SELECT contact_role, name, phone, alternate_phone, escalation_level
       FROM emergency_contacts
      WHERE is_active = TRUE
        AND (covers_category IS NULL OR covers_category = $1)
      ORDER BY escalation_level ASC NULLS LAST`,
    [type?.category ?? null]
  );

  signalBus.emitSignal(
    SIGNAL.EMERGENCY_RAISED,
    { incidentCode: incident.incident_code, severity: finalSeverity, peopleAtRisk: Boolean(peopleAtRisk) },
    { severity: finalSeverity === 'critical' ? SEVERITY.EMERGENCY : SEVERITY.CRITICAL, source: 'enterpriseControlService.raiseIncident' }
  );

  logger.warn('EMERGENCY INCIDENT RAISED', {
    code: incident.incident_code, severity: finalSeverity, peopleAtRisk: Boolean(peopleAtRisk)
  });

  return {
    incident,
    severityNote,
    // The three things a responder needs in the first sixty seconds.
    immediateActions: type?.immediate_actions
      ?? 'No standing instruction is on file for this incident type. Contain first, then notify the escalation chain below.',
    acknowledgeWithinMinutes: type?.target_acknowledge_minutes ?? 15,
    regulatorNotification: type?.requires_regulator_notification
      ? { required: true, withinHours: type.regulator_notify_within_hours }
      : { required: false },
    escalationChain: contacts
  };
}

async function acknowledgeIncident({ incidentCode, userId }) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `UPDATE emergency_incidents
        SET acknowledged_at=CURRENT_TIMESTAMP, acknowledged_by=$2,
            incident_commander = COALESCE(incident_commander, $2),
            status = CASE WHEN status='open' THEN 'acknowledged' ELSE status END
      WHERE incident_code=$1 RETURNING *`,
    [incidentCode, userId ?? null]
  );
  if (rows.length === 0) throw new Error(`Incident ${incidentCode} not found`);
  return rows[0];
}

async function listActiveIncidents() {
  let db = getPostgreSQL();
  const { rows } = await db.query('SELECT * FROM v_active_incidents');
  // Triage order: life safety, then severity, then age.
  return rows.sort((a, b) =>
    (b.people_at_risk === true) - (a.people_at_risk === true)
    || (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0)
    || Number(b.minutes_open) - Number(a.minutes_open));
}

// ===========================================================================
// ROUTES
// ===========================================================================

// --- Workflow ---
router.post('/workflow/start', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await startWorkflow({ ...req.body, initiatedBy: req.user?.id }) });
  } catch (e) { return fail(res, e, 'startWorkflow'); }
});

router.post('/workflow/:instanceCode/act', authMiddleware, async (req, res) => {
  try {
    const data = await actOnWorkflow({
      instanceCode: req.params.instanceCode, ...req.body, actorId: req.user?.id
    });
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'actOnWorkflow'); }
});

router.get('/workflow/pending', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await listPendingApprovals({ role: req.query.role }) });
  } catch (e) { return fail(res, e, 'listPendingApprovals'); }
});

// --- CRM ---
router.post('/crm/leads', authMiddleware, async (req, res) => {
  try {
    res.status(201).json({ success: true, data: await createLead({ ...req.body, ownerId: req.user?.id }) });
  } catch (e) { return fail(res, e, 'createLead'); }
});

router.post('/crm/leads/:leadCode/convert', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await convertLead({ leadCode: req.params.leadCode, ...req.body }) });
  } catch (e) { return fail(res, e, 'convertLead'); }
});

router.get('/crm/pipeline', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await getPipeline() });
  } catch (e) { return fail(res, e, 'getPipeline'); }
});

// --- Clients ---
router.get('/clients/:id/health', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await computeClientHealth(Number(req.params.id)) });
  } catch (e) { return fail(res, e, 'computeClientHealth'); }
});

// --- Legal (privileged: admin only) ---
router.get('/legal/calendar', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await listLegalCalendar({ withinDays: Number(req.query.days) || 60 }) });
  } catch (e) { return fail(res, e, 'listLegalCalendar'); }
});

// --- Risk ---
router.post('/risk/:riskCode/assess', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let data = await assessRisk({
      riskCode: req.params.riskCode, ...req.body, reviewedBy: req.user?.id
    });
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'assessRisk'); }
});

router.get('/risk/heatmap', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await getRiskHeatmap() });
  } catch (e) { return fail(res, e, 'getRiskHeatmap'); }
});

// --- Emergency ---
// Raising an incident is authenticated but NOT admin-gated: the person who
// sees the problem first is rarely the person with the highest privilege.
router.post('/emergency/incidents', authMiddleware, async (req, res) => {
  try {
    let data = await raiseIncident({ ...req.body, detectedBy: req.user?.id ? 'human' : 'system' });
    res.status(201).json({ success: true, data });
  } catch (e) { return fail(res, e, 'raiseIncident'); }
});

router.post('/emergency/incidents/:incidentCode/acknowledge', authMiddleware, async (req, res) => {
  try {
    let data = await acknowledgeIncident({ incidentCode: req.params.incidentCode, userId: req.user?.id });
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'acknowledgeIncident'); }
});

router.get('/emergency/active', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await listActiveIncidents() });
  } catch (e) { return fail(res, e, 'listActiveIncidents'); }
});

module.exports = {
  router,
  startWorkflow,
  actOnWorkflow,
  listPendingApprovals,
  createLead,
  convertLead,
  getPipeline,
  computeClientHealth,
  listLegalCalendar,
  assessRisk,
  getRiskHeatmap,
  raiseIncident,
  acknowledgeIncident,
  listActiveIncidents,
  SEVERITY_RANK
};
