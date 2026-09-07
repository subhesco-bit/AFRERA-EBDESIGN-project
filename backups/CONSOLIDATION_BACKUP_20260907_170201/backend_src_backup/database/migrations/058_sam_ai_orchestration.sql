-- ============================================================================
-- 058_sam_ai_orchestration.sql   (2026-08-05)
--
-- SAM — the multi-model AI orchestration layer specified in the newest section
-- of "No project chats (1).docx" (the 421,656 characters that were not in the
-- previous export).
--
-- The spec describes a router that dispatches a request to the model best
-- suited to it — architecture reasoning to one, coding to another, crop
-- imagery to a vision model, retrieval to a RAG index — and 15 named business
-- agents sitting above it.
--
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO
--
-- It does not hard-code which provider's model wins which category. The source
-- lists specific products with star ratings; those rankings will be stale
-- within months, and a routing table baked into a migration cannot be
-- corrected without a deploy. Capability requirements are recorded instead,
-- and which model meets them is a row somebody can change.
--
-- Everything routed through here is scored by the existing calibration gate
-- (990). An orchestrator that picks models on reputation rather than measured
-- outcomes is a preference, not an optimisation.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. MODEL REGISTRY
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_model_registry (
    id SERIAL PRIMARY KEY,
    model_key VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    -- NAMED 'provider', NOT 'vendor'. In this platform "vendor" already means
    -- a supplier of shared equipment and infrastructure — there is a vendors
    -- table, a vendorRoutes.js, and a vendor_selection intent for exactly that.
    -- Reusing the word for "whoever hosts the model" would make a query about
    -- vendor risk return two unrelated kinds of thing.
    provider VARCHAR(60) NOT NULL,
    model_identifier VARCHAR(120),

    -- What it can do, not how good somebody thinks it is.
    capabilities TEXT[] NOT NULL DEFAULT '{}',
    context_window_tokens INTEGER CHECK (context_window_tokens IS NULL OR context_window_tokens > 0),
    supports_vision BOOLEAN NOT NULL DEFAULT FALSE,
    supports_tools BOOLEAN NOT NULL DEFAULT FALSE,
    supports_streaming BOOLEAN NOT NULL DEFAULT FALSE,

    cost_per_1k_input_inr NUMERIC(10,4) CHECK (cost_per_1k_input_inr IS NULL OR cost_per_1k_input_inr >= 0),
    cost_per_1k_output_inr NUMERIC(10,4) CHECK (cost_per_1k_output_inr IS NULL OR cost_per_1k_output_inr >= 0),
    typical_latency_ms INTEGER CHECK (typical_latency_ms IS NULL OR typical_latency_ms >= 0),

    -- Data-residency matters here. Farmer PII and land records routed to a
    -- model hosted outside India is a DPDP Act question before it is an
    -- engineering one, so it is a column rather than a footnote.
    data_residency VARCHAR(20) NOT NULL DEFAULT 'unknown'
        CHECK (data_residency IN ('in_country','offshore','on_premise','unknown')),
    approved_for_pii BOOLEAN NOT NULL DEFAULT FALSE,

    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    added_on DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,

    -- PII cannot be sent to a model whose hosting location is unknown.
    CONSTRAINT pii_needs_known_residency CHECK (
      approved_for_pii = FALSE OR data_residency <> 'unknown'
    )
);

-- ---------------------------------------------------------------------------
-- 2. ROUTING RULES
--
-- The router in the spec is a decision tree: "Crop? -> Vision. Code? ->
-- Coding. Law? -> Legal. Finance? -> Finance." Held as rows so the tree can be
-- retuned without a deploy, and so a routing decision can be explained after
-- the fact.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_routing_rules (
    id SERIAL PRIMARY KEY,
    intent VARCHAR(60) NOT NULL,
    description VARCHAR(200),

    required_capabilities TEXT[] NOT NULL DEFAULT '{}',
    requires_vision BOOLEAN NOT NULL DEFAULT FALSE,
    handles_pii BOOLEAN NOT NULL DEFAULT FALSE,

    preferred_model_key VARCHAR(60) REFERENCES ai_model_registry (model_key),
    fallback_model_key VARCHAR(60) REFERENCES ai_model_registry (model_key),

    max_cost_inr_per_call NUMERIC(10,4) CHECK (max_cost_inr_per_call IS NULL OR max_cost_inr_per_call >= 0),
    max_latency_ms INTEGER CHECK (max_latency_ms IS NULL OR max_latency_ms > 0),

    -- Some intents must never run unattended regardless of which model handles
    -- them. Advising a farmer to commit a harvest forward, or releasing a QC
    -- hold, are decisions with a person's season attached.
    requires_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    priority INTEGER NOT NULL DEFAULT 100,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    UNIQUE (intent),
    CONSTRAINT fallback_differs_from_preferred CHECK (
      fallback_model_key IS NULL OR preferred_model_key IS NULL
      OR fallback_model_key <> preferred_model_key
    )
);

INSERT INTO ai_routing_rules
 (intent, description, required_capabilities, requires_vision, handles_pii, requires_human_review, priority)
VALUES
 ('crop_disease_detection','Identify disease or pest from a photograph of a plant','{vision,classification}',TRUE,FALSE,FALSE,10),
 ('quality_grading','Grade produce from an image against a standard','{vision,classification}',TRUE,FALSE,FALSE,10),
 ('document_ocr','Extract text from lab reports, invoices, land records','{vision,ocr}',TRUE,TRUE,FALSE,20),
 ('farmer_advisory','Answer a farmer question in their own language','{reasoning,multilingual}',FALSE,TRUE,FALSE,20),
 ('scheme_eligibility','Match a farmer or project to government schemes','{reasoning,retrieval}',FALSE,TRUE,TRUE,20),
 ('price_forecast','Forward price and downside band','{reasoning,quantitative}',FALSE,FALSE,TRUE,30),
 ('route_planning','Choose a lane and transport class','{reasoning,optimisation}',FALSE,FALSE,FALSE,30),
 ('contract_review','Read a buyer contract and flag terms','{reasoning,long_context}',FALSE,TRUE,TRUE,30),
 ('knowledge_search','Retrieve from platform documentation and SOPs','{retrieval,reasoning}',FALSE,FALSE,FALSE,40),
 ('fraud_screening','Screen a transaction or counterparty','{reasoning,classification}',FALSE,TRUE,TRUE,10),
 ('code_generation','Generate or modify platform code','{coding,long_context}',FALSE,FALSE,TRUE,50),
 ('report_writing','Draft an operational or investor report','{writing,reasoning}',FALSE,FALSE,FALSE,50),
 -- Added after the first run: sam_agents below references these two by FK, and
 -- seeding an agent whose primary_intent has no matching rule aborts the whole
 -- migration. A foreign key is the right constraint here — an agent routed to
 -- an intent that does not exist would silently fall through to no model at all.
 ('vendor_selection','Rank and select suppliers against requirement and risk','{reasoning,ranking}',FALSE,TRUE,TRUE,30),
 ('credit_assessment','Assess creditworthiness and repayment capacity','{reasoning,quantitative}',FALSE,TRUE,TRUE,20)
ON CONFLICT (intent) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. THE 15 BUSINESS AGENTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sam_agents (
    id SERIAL PRIMARY KEY,
    agent_key VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    purpose VARCHAR(300) NOT NULL,
    primary_intent VARCHAR(60) REFERENCES ai_routing_rules (intent),
    domain VARCHAR(60),

    -- Every agent in this platform PROPOSES. The existing ai_proposals CHECK
    -- constraint makes approval impossible without a named human, and the
    -- calibration gate decides how much its proposal is worth. An agent marked
    -- autonomous here still passes through both.
    autonomy VARCHAR(20) NOT NULL DEFAULT 'propose_only'
        CHECK (autonomy IN ('propose_only','act_with_gate','observe_only')),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sam_agents (agent_key, display_name, purpose, primary_intent, domain, autonomy) VALUES
 ('chief_architect','Chief Architect','Architecture and cross-domain reasoning','code_generation','platform','propose_only'),
 ('coding_agent','Coding Agent','Backend and frontend implementation','code_generation','platform','propose_only'),
 ('vision_agent','Vision Agent','Crop disease, OCR, quality grading from images','crop_disease_detection','quality','act_with_gate'),
 ('procurement_agent','Procurement Agent','Vendor selection and purchase recommendation','vendor_selection','procurement','propose_only'),
 ('marketplace_agent','Marketplace Agent','Buying and selling recommendations','price_forecast','commerce','propose_only'),
 ('farmer_agent','Farmer Agent','Farmer-facing advisory in local language','farmer_advisory','farmer','act_with_gate'),
 ('government_agent','Government Agent','Schemes, eligibility and compliance','scheme_eligibility','govt','propose_only'),
 ('logistics_agent','Logistics Agent','Route and lane optimisation','route_planning','logistics','act_with_gate'),
 ('finance_agent','Finance Agent','Credit assessment and ROI','credit_assessment','finance','propose_only'),
 ('insurance_agent','Insurance Agent','Risk assessment and claims','fraud_screening','insurance','propose_only'),
 ('lab_agent','Lab Agent','Test report interpretation','document_ocr','quality','propose_only'),
 ('export_agent','Export Agent','Export documentation and compliance','contract_review','export','propose_only'),
 ('analytics_agent','Analytics Agent','BI and forecasting','price_forecast','analytics','observe_only'),
 ('fraud_agent','Fraud Agent','Risk detection across transactions','fraud_screening','risk','propose_only'),
 ('knowledge_agent','Knowledge Agent','RAG search over platform knowledge','knowledge_search','platform','observe_only')
ON CONFLICT (agent_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. INVOCATION LOG
--
-- Every call, what it cost, how long it took, and what happened. This is what
-- makes routing decisions reviewable rather than folklore, and it is the feed
-- the calibration gate scores agents from.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_invocations (
    id BIGSERIAL PRIMARY KEY,
    agent_key VARCHAR(60),
    intent VARCHAR(60),
    model_key VARCHAR(60),
    -- Set when the preferred model was unavailable and the fallback ran, so a
    -- quality drop can be traced to a failover rather than to the model.
    used_fallback BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_reason VARCHAR(120),

    input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
    output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
    cost_inr NUMERIC(12,4) CHECK (cost_inr IS NULL OR cost_inr >= 0),
    latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms >= 0),

    contained_pii BOOLEAN NOT NULL DEFAULT FALSE,
    outcome VARCHAR(20) NOT NULL DEFAULT 'success'
        CHECK (outcome IN ('success','error','timeout','refused','rate_limited','filtered')),
    error_message TEXT,

    -- Links to the learning loop so this call can be scored later.
    prediction_log_id BIGINT,
    subject_type VARCHAR(60),
    subject_id VARCHAR(100),

    invoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fallback_states_reason CHECK (used_fallback = FALSE OR fallback_reason IS NOT NULL),
    CONSTRAINT failed_call_has_message CHECK (
      outcome IN ('success','refused') OR error_message IS NOT NULL
    )
);

-- What each model actually costs and how reliable it is, measured.
CREATE OR REPLACE VIEW v_model_performance AS
SELECT
    model_key,
    COUNT(*)                                                   AS calls,
    COUNT(*) FILTER (WHERE outcome = 'success')                AS successes,
    ROUND(COUNT(*) FILTER (WHERE outcome = 'success')::numeric
          / NULLIF(COUNT(*), 0) * 100, 2)                      AS success_pct,
    COUNT(*) FILTER (WHERE used_fallback)                      AS fallback_calls,
    ROUND(AVG(latency_ms)::numeric, 0)                         AS mean_latency_ms,
    ROUND(SUM(cost_inr)::numeric, 2)                           AS total_cost_inr,
    ROUND(AVG(cost_inr)::numeric, 4)                           AS mean_cost_per_call_inr
FROM ai_invocations
GROUP BY model_key;

-- Calls that carried personal data to a model not approved for it. This should
-- always be empty; it is a compliance breach detector, not a metric.
CREATE OR REPLACE VIEW v_pii_routing_violations AS
SELECT
    i.id, i.invoked_at, i.agent_key, i.intent, i.model_key,
    m.data_residency, m.approved_for_pii,
    'PII sent to a model not approved for it' AS finding
FROM ai_invocations i
JOIN ai_model_registry m ON m.model_key = i.model_key
WHERE i.contained_pii = TRUE AND m.approved_for_pii = FALSE;

CREATE INDEX IF NOT EXISTS idx_invocations_agent ON ai_invocations (agent_key, invoked_at DESC);
CREATE INDEX IF NOT EXISTS idx_invocations_model ON ai_invocations (model_key, invoked_at DESC);
CREATE INDEX IF NOT EXISTS idx_invocations_errors ON ai_invocations (invoked_at DESC) WHERE outcome <> 'success';
CREATE INDEX IF NOT EXISTS idx_routing_enabled ON ai_routing_rules (priority) WHERE enabled;

-- ---------------------------------------------------------------------------
-- MODEL REGISTRY SEED  (added 2026-08-05, second pass)
--
-- Seeded DISABLED and WITHOUT vendor names or rankings.
--
-- The source document ranks specific products with star ratings. Those
-- rankings are stale within months, and a migration that hard-codes "GPT-5.5
-- wins architecture" cannot be corrected without a deploy. Worse, it would let
-- the platform pick a model on reputation rather than on the measured outcomes
-- the calibration gate (990) already collects.
--
-- What is seeded instead is the SHAPE of a model slot: what a model must be
-- able to do to serve each intent, with cost and residency left null because
-- nobody has filled them in yet. Enabling a slot is a deliberate act that
-- requires answering the data-residency question first — the CHECK constraint
-- on this table refuses PII approval while residency is 'unknown'.
-- ---------------------------------------------------------------------------

INSERT INTO ai_model_registry
 (model_key, display_name, provider, capabilities, supports_vision, supports_tools,
  data_residency, approved_for_pii, enabled, notes)
VALUES
 ('slot_reasoning_primary','Primary reasoning slot','UNASSIGNED',
  '{reasoning,long_context,quantitative}',FALSE,TRUE,'unknown',FALSE,FALSE,
  'Serves scheme_eligibility, price_forecast, contract_review, credit_assessment. '
  'Assign a model, set data_residency, then enable. Handles PII — residency must '
  'be answered before approved_for_pii can be set.'),

 ('slot_vision','Vision slot','UNASSIGNED',
  '{vision,classification,ocr}',TRUE,FALSE,'unknown',FALSE,FALSE,
  'Serves crop_disease_detection, quality_grading, document_ocr. Note that OCR of '
  'land records and lab reports carries PII even though the image itself looks '
  'anonymous.'),

 ('slot_multilingual','Multilingual advisory slot','UNASSIGNED',
  '{reasoning,multilingual}',FALSE,FALSE,'unknown',FALSE,FALSE,
  'Serves farmer_advisory. Must handle Assamese, Meitei, Khasi, Mizo, Nagamese and '
  'Bengali — an advisory in a language the farmer cannot read is not an advisory.'),

 ('slot_coding','Code generation slot','UNASSIGNED',
  '{coding,long_context}',FALSE,TRUE,'unknown',FALSE,FALSE,
  'Serves code_generation. No PII by design — platform code should never carry it.'),

 ('slot_retrieval','Retrieval slot','UNASSIGNED',
  '{retrieval,reasoning}',FALSE,FALSE,'unknown',FALSE,FALSE,
  'Serves knowledge_search. Backed by the platform SOP and documentation index.'),

 ('slot_local_fallback','On-premise fallback slot','UNASSIGNED',
  '{reasoning,multilingual}',FALSE,FALSE,'on_premise',FALSE,FALSE,
  'Deliberately on_premise. NE connectivity is intermittent, and an advisory layer '
  'that only works with a good uplink is unavailable exactly when a farmer is '
  'furthest from help. Also the only slot that can serve PII without an offshore '
  'transfer question.')
ON CONFLICT (model_key) DO NOTHING;

-- Which intents currently have no model that can serve them.
CREATE OR REPLACE VIEW v_ai_unserved_intents AS
SELECT
    r.intent,
    r.description,
    r.required_capabilities,
    r.requires_vision,
    r.handles_pii,
    r.requires_human_review,
    'No enabled model satisfies this intent' AS finding
FROM ai_routing_rules r
WHERE r.enabled
  AND NOT EXISTS (
    SELECT 1 FROM ai_model_registry m
     WHERE m.enabled
       AND m.capabilities @> r.required_capabilities
       AND (r.requires_vision = FALSE OR m.supports_vision)
       AND (r.handles_pii = FALSE OR m.approved_for_pii)
  );

-- ---------------------------------------------------------------------------
-- SLOT ASSIGNMENT GUIDANCE  (added 2026-08-05, third pass)
--
-- Assigning a model to a slot means answering three questions that engineering
-- cannot answer alone. Filling `provider` and `data_residency` in is a
-- deliberate act by somebody who can answer them.
--
-- NOTE ON THE WORD. This column is `provider`, not `vendor`. "Vendor" in this
-- platform means a supplier of shared equipment and infrastructure — the
-- vendors table, vendorRoutes.js and the vendor_selection intent all mean that.
-- An AI model host is a different kind of counterparty and must not share the
-- noun, or a vendor-risk query returns two unrelated things.
--
-- The three questions, in the order they bind:
--
--   1. WHERE IS IT HOSTED? The DPDP Act 2023 governs personal data of people
--      in India. Farmer names, phone numbers, land records and Aadhaar-linked
--      identifiers are all personal data. A model endpoint outside India is a
--      cross-border transfer, and the answer changes what the platform may
--      send it — not merely how it logs the call. This is why
--      approved_for_pii cannot be set while residency is 'unknown'.
--
--   2. WHAT DOES IT COST PER CALL? An advisory that costs Rs 12 per question
--      cannot serve a farmer asking five questions about a crop worth Rs 8,000.
--      max_cost_inr_per_call on the routing rule is the guard; it only works
--      once cost_per_1k_* are filled in.
--
--   3. WHAT HAPPENS WHEN IT IS DOWN? NE connectivity is intermittent. The
--      on-premise fallback slot exists because an advisory layer that requires
--      a good uplink is unavailable exactly when a farmer is furthest from
--      help. Leaving it unassigned means the whole layer has a single point of
--      failure that fails in the worst conditions.
--
-- WHY NO VENDOR IS NAMED HERE
--
-- Model capability and price move faster than this migration can. More
-- importantly, the calibration gate (990) already measures which model
-- actually produces good outcomes on this platform's own work. Seeding a
-- preference would let reputation override that measurement, which is the
-- thing the gate exists to prevent.
-- ---------------------------------------------------------------------------

COMMENT ON TABLE ai_model_registry IS
  'Model slots. A slot is assigned by setting provider, model_identifier, '
  'data_residency and cost, then enabling it. approved_for_pii requires a known '
  'residency — see the DPDP note in migration 058. Nothing routes to a slot '
  'until it is enabled, and v_ai_unserved_intents lists what is unreachable '
  'while slots remain empty.';

COMMENT ON COLUMN ai_model_registry.data_residency IS
  'Where the model endpoint runs. Personal data of people in India sent to an '
  'offshore endpoint is a cross-border transfer under the DPDP Act 2023. '
  'Answer this before setting approved_for_pii.';
