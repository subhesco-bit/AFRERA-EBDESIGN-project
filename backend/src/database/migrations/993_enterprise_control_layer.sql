-- ============================================================================
-- 993_enterprise_control_layer.sql   (2026-08-04)
--
-- THE ENTERPRISE CONTROL LAYER — the modules that govern other modules.
--
-- WHY THIS LAYER EXISTS (the body analogy, carried through honestly)
-- The platform now has organs (62 services), a nervous system (signalBus), a
-- brain (decisionEngine + erpAgents), a skeleton (996 accounting) and muscles
-- (995 ERP processes). What it lacked is everything that governs the organism
-- as a whole rather than one organ:
--
--   WORKFLOW    the autonomic system — how any process advances, waits for an
--               approval, escalates, or times out. Every module needs this and
--               none should implement it privately.
--   CRM         the sensory memory of who the business is dealing with.
--   CLIENTS     account-level truth: one customer, many orders and contracts.
--   LEGAL       the immune memory — disputes, notices, obligations.
--   RISK        anticipation: what could go wrong, how likely, how bad.
--   EMERGENCY   the reflex arc under threat — incident command, escalation,
--               and the standing instruction that survives a bad day.
--
-- Verified absent 2026-08-04: workflow, CRM, clients, legal, risk and
-- emergency each had ZERO tables in a 468-table schema.
--
-- Numbered 993 so it runs before the recovered capabilities (994), the ERP
-- process layer (995) and the accounting foundation (996). Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. WORKFLOW ENGINE — one process spine for every module
--
-- Deliberately generic. A per-module workflow implementation is how approval
-- logic drifts: five modules end up with five different definitions of
-- "approved", and none of them can be audited together.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflow_definitions (
    id SERIAL PRIMARY KEY,
    workflow_code VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,        -- 'purchase_order' | 'claim' | 'listing' ...
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workflow_code, version)
);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    step_number SMALLINT NOT NULL,
    step_code VARCHAR(60) NOT NULL,
    name VARCHAR(255) NOT NULL,
    step_type VARCHAR(20) NOT NULL DEFAULT 'approval'
        CHECK (step_type IN ('approval','task','notification','automated','decision','wait')),
    -- Who may act. A role, not a person: people leave, roles persist.
    required_role VARCHAR(60),
    -- Value above which this step becomes mandatory (approval thresholds).
    threshold_amount NUMERIC(20,4),
    sla_hours INTEGER,
    -- What happens when the SLA lapses. Silence is not an option: a request
    -- that stalls forever is indistinguishable from one that was refused.
    on_timeout VARCHAR(20) NOT NULL DEFAULT 'escalate'
        CHECK (on_timeout IN ('escalate','auto_approve','auto_reject','notify_only')),
    escalate_to_role VARCHAR(60),
    is_skippable BOOLEAN DEFAULT FALSE,
    UNIQUE (workflow_id, step_number),
    UNIQUE (workflow_id, step_code),
    -- auto_approve on timeout is dangerous; it must be a deliberate, explicit
    -- choice with someone named to escalate to as the safer default.
    CONSTRAINT wf_timeout_escalation CHECK (
        on_timeout <> 'escalate' OR escalate_to_role IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS workflow_instances (
    id SERIAL PRIMARY KEY,
    instance_code VARCHAR(60) UNIQUE NOT NULL,
    workflow_id INTEGER NOT NULL REFERENCES workflow_definitions(id) ON DELETE RESTRICT,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    current_step_id INTEGER REFERENCES workflow_steps(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'running'
        CHECK (status IN ('running','waiting','approved','rejected','cancelled','expired')),
    initiated_by UUID,
    context JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    outcome_reason TEXT,
    CONSTRAINT wf_rejection_needs_reason CHECK (
        status <> 'rejected' OR (outcome_reason IS NOT NULL AND length(trim(outcome_reason)) > 0)
    )
);

CREATE TABLE IF NOT EXISTS workflow_actions (
    id SERIAL PRIMARY KEY,
    instance_id INTEGER NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES workflow_steps(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL
        CHECK (action IN ('submitted','approved','rejected','delegated','escalated','commented','timed_out','cancelled')),
    actor_id UUID,
    -- Delegation is recorded, not hidden: knowing an approval was delegated is
    -- part of the audit trail.
    delegated_from UUID,
    comment TEXT,
    acted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wf_action_rejection_reason CHECK (
        action <> 'rejected' OR (comment IS NOT NULL AND length(trim(comment)) > 0)
    )
);

-- ---------------------------------------------------------------------------
-- 2. CRM — leads, opportunities, activity
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS crm_leads (
    id SERIAL PRIMARY KEY,
    lead_code VARCHAR(40) UNIQUE NOT NULL,
    source VARCHAR(60),                       -- 'inbound' | 'referral' | 'campaign' ...
    organisation_name VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(30),
    segment VARCHAR(40),                      -- 'horeca' | 'rwa' | 'corporate' | 'export'
    estimated_value NUMERIC(20,4),
    -- 0-100, produced by MCDA scoring (see erpAgents). Stored WITH its
    -- reasoning so a low score can be challenged rather than just obeyed.
    qualification_score NUMERIC(5,2),
    qualification_breakdown JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new','contacted','qualified','disqualified','converted')),
    disqualified_reason TEXT,
    owner_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lead_disqualify_needs_reason CHECK (
        status <> 'disqualified' OR (disqualified_reason IS NOT NULL AND length(trim(disqualified_reason)) > 0)
    )
);

CREATE TABLE IF NOT EXISTS crm_opportunities (
    id SERIAL PRIMARY KEY,
    opportunity_code VARCHAR(40) UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES crm_leads(id) ON DELETE SET NULL,
    client_id INTEGER,
    name VARCHAR(255) NOT NULL,
    stage VARCHAR(30) NOT NULL DEFAULT 'prospecting'
        CHECK (stage IN ('prospecting','qualification','proposal','negotiation','won','lost')),
    amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    probability_pct NUMERIC(5,2) CHECK (probability_pct BETWEEN 0 AND 100),
    -- Weighted pipeline value, derived so it cannot drift from its inputs.
    weighted_value NUMERIC(20,4)
        GENERATED ALWAYS AS (amount * COALESCE(probability_pct, 0) / 100) STORED,
    expected_close_date DATE,
    owner_id UUID,
    lost_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- A lost deal without a reason teaches the business nothing.
    CONSTRAINT opp_lost_needs_reason CHECK (
        stage <> 'lost' OR (lost_reason IS NOT NULL AND length(trim(lost_reason)) > 0)
    )
);

CREATE TABLE IF NOT EXISTS crm_activities (
    id SERIAL PRIMARY KEY,
    activity_type VARCHAR(20) NOT NULL
        CHECK (activity_type IN ('call','email','meeting','visit','note','task')),
    subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('lead','opportunity','client')),
    subject_id INTEGER NOT NULL,
    summary TEXT NOT NULL,
    outcome VARCHAR(30),
    actor_id UUID,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    follow_up_date DATE
);

-- ---------------------------------------------------------------------------
-- 3. CLIENT / ACCOUNT MANAGEMENT
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_code VARCHAR(40) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    client_type VARCHAR(30) NOT NULL DEFAULT 'business'
        CHECK (client_type IN ('individual','business','institution','government','export')),
    segment VARCHAR(40),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    credit_limit NUMERIC(20,4) DEFAULT 0 CHECK (credit_limit >= 0),
    payment_terms_days INTEGER DEFAULT 30 CHECK (payment_terms_days >= 0),
    -- Account health, recomputed from behaviour rather than typed by hand.
    health_score NUMERIC(5,2) CHECK (health_score BETWEEN 0 AND 100),
    health_breakdown JSONB,
    account_manager_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('prospect','active','on_hold','churned','blacklisted')),
    hold_reason TEXT,
    onboarded_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Putting a client on hold or blacklisting them has commercial and legal
    -- consequences; it must carry a stated reason.
    CONSTRAINT client_hold_needs_reason CHECK (
        status NOT IN ('on_hold','blacklisted')
        OR (hold_reason IS NOT NULL AND length(trim(hold_reason)) > 0)
    )
);

CREATE TABLE IF NOT EXISTS client_contacts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role_title VARCHAR(120),
    email VARCHAR(255),
    phone VARCHAR(30),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- 4. LEGAL MANAGEMENT
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS legal_matters (
    id SERIAL PRIMARY KEY,
    matter_code VARCHAR(40) UNIQUE NOT NULL,
    matter_type VARCHAR(30) NOT NULL
        CHECK (matter_type IN ('litigation','notice','arbitration','regulatory','advisory','ip','labour')),
    title VARCHAR(255) NOT NULL,
    counterparty VARCHAR(255),
    court_or_forum VARCHAR(255),
    case_number VARCHAR(100),
    jurisdiction VARCHAR(120),
    -- Financial exposure drives provisioning; it belongs in the ledger's view.
    claim_amount NUMERIC(20,4),
    provision_amount NUMERIC(20,4),
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','pending','stayed','settled','closed','appealed')),
    filed_date DATE,
    next_hearing_date DATE,
    internal_owner_id UUID,
    external_counsel VARCHAR(255),
    -- Privileged material must be flagged so ordinary access paths exclude it.
    is_privileged BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legal_events (
    id SERIAL PRIMARY KEY,
    matter_id INTEGER NOT NULL REFERENCES legal_matters(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL
        CHECK (event_type IN ('hearing','filing','order','notice_sent','notice_received','settlement_offer','judgment')),
    event_date DATE NOT NULL,
    summary TEXT NOT NULL,
    outcome TEXT,
    recorded_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legal_obligations (
    id SERIAL PRIMARY KEY,
    obligation_code VARCHAR(40) UNIQUE NOT NULL,
    source_type VARCHAR(30) NOT NULL
        CHECK (source_type IN ('contract','statute','licence','order','undertaking')),
    source_reference VARCHAR(255),
    description TEXT NOT NULL,
    responsible_role VARCHAR(60),
    due_date DATE,
    recurrence VARCHAR(20)
        CHECK (recurrence IN ('once','monthly','quarterly','annual')),
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','met','breached','waived','superseded')),
    breach_consequence TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 5. RISK MANAGEMENT
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS risk_register (
    id SERIAL PRIMARY KEY,
    risk_code VARCHAR(40) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(40) NOT NULL
        CHECK (category IN ('operational','financial','compliance','reputational','strategic','climate','supply_chain','cyber','legal')),
    description TEXT NOT NULL,
    -- 1-5 each; inherent = before controls, residual = after.
    inherent_likelihood SMALLINT CHECK (inherent_likelihood BETWEEN 1 AND 5),
    inherent_impact SMALLINT CHECK (inherent_impact BETWEEN 1 AND 5),
    inherent_score SMALLINT
        GENERATED ALWAYS AS (COALESCE(inherent_likelihood,0) * COALESCE(inherent_impact,0)) STORED,
    residual_likelihood SMALLINT CHECK (residual_likelihood BETWEEN 1 AND 5),
    residual_impact SMALLINT CHECK (residual_impact BETWEEN 1 AND 5),
    residual_score SMALLINT
        GENERATED ALWAYS AS (COALESCE(residual_likelihood,0) * COALESCE(residual_impact,0)) STORED,
    treatment VARCHAR(20) NOT NULL DEFAULT 'mitigate'
        CHECK (treatment IN ('accept','mitigate','transfer','avoid')),
    -- Accepting a risk is a decision someone must own by name.
    accepted_by UUID,
    owner_role VARCHAR(60),
    review_frequency VARCHAR(20) DEFAULT 'quarterly'
        CHECK (review_frequency IN ('monthly','quarterly','annual')),
    last_reviewed DATE,
    next_review DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','monitored','closed','escalated','materialised')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT risk_acceptance_needs_owner CHECK (
        treatment <> 'accept' OR accepted_by IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS risk_controls (
    id SERIAL PRIMARY KEY,
    risk_id INTEGER NOT NULL REFERENCES risk_register(id) ON DELETE CASCADE,
    control_code VARCHAR(40) NOT NULL,
    description TEXT NOT NULL,
    control_type VARCHAR(20) NOT NULL DEFAULT 'preventive'
        CHECK (control_type IN ('preventive','detective','corrective','directive')),
    is_automated BOOLEAN DEFAULT FALSE,
    -- Where the control actually lives, so a claimed control can be verified.
    implemented_in VARCHAR(255),
    last_tested DATE,
    test_result VARCHAR(20) CHECK (test_result IN ('effective','partially_effective','ineffective','not_tested')),
    UNIQUE (risk_id, control_code)
);

CREATE TABLE IF NOT EXISTS risk_indicators (
    id SERIAL PRIMARY KEY,
    risk_id INTEGER NOT NULL REFERENCES risk_register(id) ON DELETE CASCADE,
    indicator_name VARCHAR(120) NOT NULL,
    metric_source VARCHAR(255),
    threshold_amber NUMERIC(20,4),
    threshold_red NUMERIC(20,4),
    current_value NUMERIC(20,4),
    breached BOOLEAN DEFAULT FALSE,
    last_measured TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 6. EMERGENCY / INCIDENT MANAGEMENT — the reflex arc
--
-- Separate from risk: risk is what MIGHT happen, an incident is what IS
-- happening. Under pressure people do not read policy documents, so the
-- response plan and the escalation chain must be queryable in seconds.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS emergency_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(40) NOT NULL
        CHECK (category IN ('food_safety','cold_chain','natural_disaster','accident','cyber','financial','reputational','supply_failure','legal')),
    default_severity VARCHAR(20) NOT NULL DEFAULT 'high'
        CHECK (default_severity IN ('low','medium','high','critical')),
    -- Time targets, because an emergency response measured in days is not one.
    target_acknowledge_minutes INTEGER NOT NULL DEFAULT 15,
    target_contain_minutes INTEGER NOT NULL DEFAULT 120,
    -- Standing instruction: what to do first, before anyone deliberates.
    immediate_actions TEXT NOT NULL,
    requires_regulator_notification BOOLEAN DEFAULT FALSE,
    regulator_notify_within_hours INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS emergency_incidents (
    id SERIAL PRIMARY KEY,
    incident_code VARCHAR(40) UNIQUE NOT NULL,
    type_id INTEGER REFERENCES emergency_types(id) ON DELETE SET NULL,
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('low','medium','high','critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    -- What is affected, so blast radius is explicit from the first minute.
    affected_entity_type VARCHAR(50),
    affected_entity_ids TEXT[],
    people_at_risk BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detected_by VARCHAR(60),                  -- 'human' | 'sensor' | 'agent:<id>'
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID,
    contained_at TIMESTAMP,
    resolved_at TIMESTAMP,
    incident_commander UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','acknowledged','containing','contained','resolved','post_review','closed')),
    -- A critical incident cannot be closed without a review. Closing one
    -- quietly is how the same failure recurs.
    root_cause TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT incident_closure_needs_review CHECK (
        status <> 'closed'
        OR severity NOT IN ('high','critical')
        OR (root_cause IS NOT NULL AND length(trim(root_cause)) > 0)
    )
);

CREATE TABLE IF NOT EXISTS emergency_escalations (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL REFERENCES emergency_incidents(id) ON DELETE CASCADE,
    level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
    escalated_to_role VARCHAR(60) NOT NULL,
    escalated_to_user UUID,
    reason TEXT NOT NULL,
    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    UNIQUE (incident_id, level)
);

CREATE TABLE IF NOT EXISTS emergency_actions (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL REFERENCES emergency_incidents(id) ON DELETE CASCADE,
    action_taken TEXT NOT NULL,
    action_type VARCHAR(30)
        CHECK (action_type IN ('containment','communication','recall','shutdown','evacuation','notification','remediation')),
    taken_by UUID,
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outcome TEXT
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    contact_role VARCHAR(60) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    alternate_phone VARCHAR(30),
    email VARCHAR(255),
    -- Escalation order and coverage window.
    escalation_level SMALLINT CHECK (escalation_level BETWEEN 1 AND 5),
    available_from TIME,
    available_to TIME,
    covers_category VARCHAR(40),
    is_active BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- 7. REPORTING VIEWS
-- ---------------------------------------------------------------------------

-- Anything waiting on a human, across every module, in one place.
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
    wi.instance_code,
    wd.name              AS workflow,
    wi.entity_type,
    wi.entity_id,
    ws.name              AS current_step,
    ws.required_role,
    ws.sla_hours,
    wi.started_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - wi.started_at)) / 3600 AS hours_open,
    CASE
        WHEN ws.sla_hours IS NULL THEN 'no_sla'
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - wi.started_at)) / 3600 > ws.sla_hours THEN 'breached'
        ELSE 'within_sla'
    END AS sla_status
FROM workflow_instances wi
JOIN workflow_definitions wd ON wd.id = wi.workflow_id
LEFT JOIN workflow_steps ws ON ws.id = wi.current_step_id
WHERE wi.status IN ('running','waiting');

CREATE OR REPLACE VIEW v_sales_pipeline AS
SELECT
    stage,
    COUNT(*)                     AS deal_count,
    SUM(amount)                  AS gross_value,
    SUM(weighted_value)          AS weighted_value,
    AVG(probability_pct)         AS avg_probability
FROM crm_opportunities
WHERE stage NOT IN ('won','lost')
GROUP BY stage;

CREATE OR REPLACE VIEW v_risk_heatmap AS
SELECT
    category,
    COUNT(*) FILTER (WHERE residual_score >= 15) AS critical,
    COUNT(*) FILTER (WHERE residual_score BETWEEN 8 AND 14) AS high,
    COUNT(*) FILTER (WHERE residual_score BETWEEN 4 AND 7) AS medium,
    COUNT(*) FILTER (WHERE residual_score < 4) AS low,
    COUNT(*) AS total,
    -- Risks past their review date are the ones most likely to be wrong.
    COUNT(*) FILTER (WHERE next_review < CURRENT_DATE) AS overdue_review
FROM risk_register
WHERE status <> 'closed'
GROUP BY category;

CREATE OR REPLACE VIEW v_active_incidents AS
SELECT
    ei.incident_code,
    et.name              AS incident_type,
    et.category,
    ei.severity,
    ei.title,
    ei.people_at_risk,
    ei.status,
    ei.detected_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ei.detected_at)) / 60 AS minutes_open,
    et.target_acknowledge_minutes,
    ei.acknowledged_at IS NOT NULL AS acknowledged,
    CASE
        WHEN ei.acknowledged_at IS NULL
             AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ei.detected_at)) / 60 > et.target_acknowledge_minutes
        THEN TRUE ELSE FALSE
    END AS acknowledgement_overdue,
    et.immediate_actions
FROM emergency_incidents ei
LEFT JOIN emergency_types et ON et.id = ei.type_id
WHERE ei.status NOT IN ('resolved','closed');

CREATE OR REPLACE VIEW v_legal_calendar AS
SELECT matter_code, matter_type, title, counterparty,
       next_hearing_date AS due_date, 'hearing' AS due_type, status
FROM legal_matters
WHERE next_hearing_date IS NOT NULL AND status NOT IN ('closed','settled')
UNION ALL
SELECT obligation_code, source_type, description, source_reference,
       due_date, 'obligation' AS due_type, status
FROM legal_obligations
WHERE due_date IS NOT NULL AND status = 'open';

-- ---------------------------------------------------------------------------
-- 8. INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_wf_steps_workflow ON workflow_steps (workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_instances_entity ON workflow_instances (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_wf_instances_status ON workflow_instances (status);
CREATE INDEX IF NOT EXISTS idx_wf_actions_instance ON workflow_actions (instance_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON crm_leads (status, segment);
CREATE INDEX IF NOT EXISTS idx_opps_stage ON crm_opportunities (stage, expected_close_date);
CREATE INDEX IF NOT EXISTS idx_opps_lead ON crm_opportunities (lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_subject ON crm_activities (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients (status, segment);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts (client_id);
CREATE INDEX IF NOT EXISTS idx_legal_status ON legal_matters (status, matter_type);
CREATE INDEX IF NOT EXISTS idx_legal_hearing ON legal_matters (next_hearing_date);
CREATE INDEX IF NOT EXISTS idx_legal_events_matter ON legal_events (matter_id);
CREATE INDEX IF NOT EXISTS idx_obligations_due ON legal_obligations (due_date, status);
CREATE INDEX IF NOT EXISTS idx_risk_category ON risk_register (category, status);
CREATE INDEX IF NOT EXISTS idx_risk_review ON risk_register (next_review);
CREATE INDEX IF NOT EXISTS idx_risk_controls_risk ON risk_controls (risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_indicators_risk ON risk_indicators (risk_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON emergency_incidents (status, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_detected ON emergency_incidents (detected_at);
CREATE INDEX IF NOT EXISTS idx_escalations_incident ON emergency_escalations (incident_id);
CREATE INDEX IF NOT EXISTS idx_emergency_actions_incident ON emergency_actions (incident_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_level ON emergency_contacts (escalation_level, covers_category);
