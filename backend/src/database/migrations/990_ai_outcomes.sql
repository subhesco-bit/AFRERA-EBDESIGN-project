-- ============================================================================
-- 990_ai_outcomes.sql   (2026-08-04)
--
-- THE LEARNING LOOP. Measured at 0% in every audit of this platform.
--
-- The system has 15 ERP agents that propose, 9 effectors that react, and an
-- MCDA layer that scores. None of them has ever been told whether it was
-- right. An agent that cannot see its own outcomes cannot improve, and a
-- confidence figure that never gets checked against reality is an opinion
-- wearing a percentage sign.
--
-- Three tables:
--   ai_outcomes        what a reaction or proposal actually led to
--   ai_prediction_log     what was forecast, so it can be scored later
--   ai_agent_scorecard rolling accuracy per agent, derived not typed
--
-- Numbered 990 so it runs before 991 (AEOS) — the value engine records
-- predictions, so the target must exist first.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. OUTCOMES — what happened after the system reacted
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_outcomes (
    id BIGSERIAL PRIMARY KEY,

    -- Which effector or agent produced this. Free text rather than an FK
    -- because agents are code, not rows — an agent can be removed and its
    -- history must survive that.
    actor_id VARCHAR(80) NOT NULL,
    actor_kind VARCHAR(20) NOT NULL DEFAULT 'effector'
        CHECK (actor_kind IN ('effector','agent','decision_rule','value_engine')),

    signal_type VARCHAR(80),
    severity VARCHAR(20),
    source VARCHAR(120),

    -- The action that was taken or proposed, as the effector described it.
    action VARCHAR(80) NOT NULL,
    subject_type VARCHAR(60),
    subject_id VARCHAR(100),
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    rationale TEXT NOT NULL,
    payload JSONB,

    -- THE POINT OF THE TABLE. Everything above is what the system did;
    -- everything below is whether it helped. Nullable because the answer
    -- usually arrives days later, from a human.
    outcome_status VARCHAR(20)
        CHECK (outcome_status IS NULL OR outcome_status IN
               ('pending','helped','no_effect','harmed','wrong_call','not_actioned','superseded')),
    outcome_value NUMERIC(20,4),
    outcome_notes TEXT,
    outcome_recorded_by UUID,
    outcome_recorded_at TIMESTAMP,

    -- How long the system took to react, and how long a human took to judge.
    -- Both are operational facts worth knowing.
    reacted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolution_hours NUMERIC(10,2)
        GENERATED ALWAYS AS (
          CASE WHEN outcome_recorded_at IS NOT NULL
               THEN EXTRACT(EPOCH FROM (outcome_recorded_at - reacted_at)) / 3600 END
        ) STORED,

    -- A judgement of 'harmed' or 'wrong_call' must say why. Recording that the
    -- system got something wrong without recording HOW is the one case where
    -- the data is worse than useless — it tells you to distrust the agent
    -- without telling you what to fix.
    CONSTRAINT negative_outcome_needs_notes CHECK (
      outcome_status NOT IN ('harmed','wrong_call')
      OR (outcome_notes IS NOT NULL AND length(trim(outcome_notes)) > 0)
    ),
    CONSTRAINT judged_outcome_needs_timestamp CHECK (
      outcome_status IS NULL OR outcome_status = 'pending'
      OR outcome_recorded_at IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- 2. PREDICTIONS — forecasts recorded so they can be scored against reality
--
-- The forecasting agent projects demand; the value engine projects cash flow.
-- Neither is currently checked afterwards. Storing the prediction WITH its
-- stated confidence is what makes calibration possible: an agent that says
-- "90% confident" and is right 60% of the time is not accurate, it is
-- overconfident, and those are different faults with different fixes.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_prediction_log (
    id BIGSERIAL PRIMARY KEY,
    actor_id VARCHAR(80) NOT NULL,
    prediction_type VARCHAR(60) NOT NULL,
    subject_type VARCHAR(60),
    subject_id VARCHAR(100),

    predicted_value NUMERIC(20,4),
    predicted_label VARCHAR(80),
    -- Stated at prediction time. Comparing this to realised accuracy is the
    -- whole of calibration.
    stated_confidence NUMERIC(5,2) CHECK (stated_confidence BETWEEN 0 AND 100),
    -- Provenance of the INPUTS, using the same vocabulary as core/mcda.js.
    input_quality VARCHAR(20) CHECK (input_quality IN ('real','estimated','assumed')),
    horizon_days INTEGER CHECK (horizon_days IS NULL OR horizon_days > 0),
    predicted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolves_on DATE,

    actual_value NUMERIC(20,4),
    actual_label VARCHAR(80),
    resolved_at TIMESTAMP,

    -- Absolute percentage error, derived. Guarded against divide-by-zero,
    -- which is the standard way a MAPE calculation silently produces Infinity.
    ape_pct NUMERIC(12,4)
        GENERATED ALWAYS AS (
          CASE WHEN actual_value IS NOT NULL AND actual_value <> 0
               THEN ABS(predicted_value - actual_value) / ABS(actual_value) * 100 END
        ) STORED,
    was_correct BOOLEAN
        GENERATED ALWAYS AS (
          CASE WHEN actual_label IS NOT NULL AND predicted_label IS NOT NULL
               THEN actual_label = predicted_label END
        ) STORED
);

-- ---------------------------------------------------------------------------
-- 3. SCORECARD — rolling accuracy, one row per agent per period
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_agent_scorecard (
    id SERIAL PRIMARY KEY,
    actor_id VARCHAR(80) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    proposals_made INTEGER DEFAULT 0 CHECK (proposals_made >= 0),
    proposals_actioned INTEGER DEFAULT 0 CHECK (proposals_actioned >= 0),
    outcomes_helped INTEGER DEFAULT 0 CHECK (outcomes_helped >= 0),
    outcomes_harmed INTEGER DEFAULT 0 CHECK (outcomes_harmed >= 0),
    outcomes_no_effect INTEGER DEFAULT 0 CHECK (outcomes_no_effect >= 0),

    -- Share of JUDGED outcomes that helped. Deliberately excludes unjudged
    -- ones rather than counting them as neutral — an agent should not be
    -- rewarded for proposals nobody bothered to evaluate.
    helpfulness_pct NUMERIC(5,2)
        GENERATED ALWAYS AS (
          CASE WHEN (outcomes_helped + outcomes_harmed + outcomes_no_effect) > 0
               THEN outcomes_helped::numeric
                    / (outcomes_helped + outcomes_harmed + outcomes_no_effect) * 100 END
        ) STORED,

    -- Ignored proposals are a signal about the AGENT, not the human. An agent
    -- whose advice is routinely skipped is producing noise.
    ignore_rate_pct NUMERIC(5,2)
        GENERATED ALWAYS AS (
          CASE WHEN proposals_made > 0
               THEN (proposals_made - proposals_actioned)::numeric / proposals_made * 100 END
        ) STORED,

    mean_ape_pct NUMERIC(12,4),
    mean_stated_confidence NUMERIC(5,2),
    -- Positive = overconfident. This is the number that should gate whether an
    -- agent's output is shown as a recommendation or merely as information.
    calibration_gap NUMERIC(8,2),

    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (actor_id, period_start, period_end),
    CONSTRAINT period_valid CHECK (period_end >= period_start)
);

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------

-- Everything the system did that nobody has judged. This queue IS the learning
-- loop — while it is empty of judgements, accuracy is unknown, not good.
CREATE OR REPLACE VIEW v_ai_outcomes_pending AS
SELECT
    id, actor_id, actor_kind, signal_type, action,
    subject_type, subject_id, escalated, rationale, reacted_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - reacted_at)) / 3600 AS hours_unjudged
FROM ai_outcomes
WHERE outcome_status IS NULL OR outcome_status = 'pending'
ORDER BY escalated DESC, reacted_at ASC;

-- Live accuracy per actor, computed from outcomes rather than from the
-- scorecard table, so it cannot drift from the underlying facts.
CREATE OR REPLACE VIEW v_ai_actor_accuracy AS
SELECT
    actor_id,
    actor_kind,
    COUNT(*)                                                       AS total,
    COUNT(*) FILTER (WHERE outcome_status IS NULL
                        OR outcome_status = 'pending')             AS unjudged,
    COUNT(*) FILTER (WHERE outcome_status = 'helped')              AS helped,
    COUNT(*) FILTER (WHERE outcome_status = 'harmed')              AS harmed,
    COUNT(*) FILTER (WHERE outcome_status = 'wrong_call')          AS wrong_call,
    COUNT(*) FILTER (WHERE outcome_status = 'not_actioned')        AS ignored,
    ROUND(
      CASE WHEN COUNT(*) FILTER (WHERE outcome_status IN
                 ('helped','harmed','no_effect','wrong_call')) > 0
           THEN COUNT(*) FILTER (WHERE outcome_status = 'helped')::numeric
                / COUNT(*) FILTER (WHERE outcome_status IN
                    ('helped','harmed','no_effect','wrong_call')) * 100
      END, 2)                                                      AS helpfulness_pct,
    ROUND(AVG(resolution_hours)::numeric, 2)                       AS avg_hours_to_judge
FROM ai_outcomes
GROUP BY actor_id, actor_kind;

-- Calibration: stated confidence against realised accuracy.
CREATE OR REPLACE VIEW v_ai_calibration AS
SELECT
    actor_id,
    prediction_type,
    COUNT(*) FILTER (WHERE resolved_at IS NOT NULL)  AS resolved,
    ROUND(AVG(stated_confidence)::numeric, 2)        AS mean_stated_confidence,
    ROUND(AVG(ape_pct)::numeric, 2)                  AS mean_ape_pct,
    ROUND((100 - AVG(ape_pct))::numeric, 2)          AS realised_accuracy_pct,
    -- Positive means the agent claims more certainty than it earns.
    ROUND((AVG(stated_confidence) - (100 - AVG(ape_pct)))::numeric, 2) AS calibration_gap,
    input_quality
FROM ai_prediction_log
WHERE resolved_at IS NOT NULL
GROUP BY actor_id, prediction_type, input_quality;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ai_outcomes_actor ON ai_outcomes (actor_id, reacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_outcomes_status ON ai_outcomes (outcome_status);
CREATE INDEX IF NOT EXISTS idx_ai_outcomes_subject ON ai_outcomes (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_ai_outcomes_escalated ON ai_outcomes (escalated, reacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prediction_log_actor ON ai_prediction_log (actor_id, prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_prediction_log_resolve ON ai_prediction_log (resolves_on) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_scorecard_actor ON ai_agent_scorecard (actor_id, period_end DESC);

-- ============================================================================
-- AUTONOMOUS RESOLUTION  (added 2026-08-04, second pass)
--
-- The first pass required a named human to set outcome_status. That was too
-- strict and it was holding the loop shut. Most predictions this platform
-- makes are OBJECTIVELY resolvable from data the platform already stores: a
-- demand forecast against actual sales, an ETA against the delivery
-- timestamp, a quarantine against the lab result that arrives three days
-- later. Waiting for a human to confirm arithmetic the database can do is not
-- caution, it is a stalled feedback loop.
--
-- So resolution is now automatic wherever ground truth exists, and human
-- judgement is reserved for the one class where it is genuinely irreducible:
-- COUNTERFACTUALS. When the system blocks a shipment, the shipment does not
-- happen, so nobody ever observes what the loss would have been. No amount of
-- data closes that gap — it is not a limitation of the AI, it is a limitation
-- of a universe with one timeline. Those are scored on a declared proxy at
-- reduced weight, and the reduced weight is recorded rather than hidden.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- RESOLUTION RULES — how each prediction type finds its own ground truth
--
-- Declarative on purpose. A new prediction type becomes self-resolving by
-- inserting a row, not by editing a resolver function, so the set of things
-- the system can grade itself on grows without a deploy.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_resolution_rules (
    id SERIAL PRIMARY KEY,
    prediction_type VARCHAR(60) NOT NULL UNIQUE,

    -- Where the truth lives, and how to reach it from the prediction's subject.
    truth_table VARCHAR(63) NOT NULL,
    truth_column VARCHAR(63) NOT NULL,
    subject_column VARCHAR(63) NOT NULL,
    truth_aggregate VARCHAR(10) NOT NULL DEFAULT 'sum'
        CHECK (truth_aggregate IN ('sum','avg','max','min','count','first','last')),
    -- Optional time window, relative to the prediction, in days.
    window_days INTEGER CHECK (window_days IS NULL OR window_days > 0),
    date_column VARCHAR(63),

    -- How the outcome is established.
    --   observed      ground truth is directly measurable. Fully autonomous.
    --   proxy         the intervention prevented the thing we wanted to
    --                 measure; score a stand-in instead, at reduced weight.
    --   human_only    genuinely irreducible; needs a person.
    resolution_mode VARCHAR(12) NOT NULL DEFAULT 'observed'
        CHECK (resolution_mode IN ('observed','proxy','human_only')),
    -- Confidence weight of this rule's verdict. Proxies must be < 1.0:
    -- a stand-in measurement should not carry the authority of a real one.
    verdict_weight NUMERIC(3,2) NOT NULL DEFAULT 1.00
        CHECK (verdict_weight > 0 AND verdict_weight <= 1),
    -- Within this relative error, the prediction counts as correct.
    tolerance_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (tolerance_pct >= 0),

    rationale TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A proxy that claims full authority is the failure this table exists to
    -- prevent: it would let the system mark counterfactual guesses as verified
    -- fact and then report high accuracy on them.
    CONSTRAINT proxy_cannot_claim_full_weight CHECK (
      resolution_mode <> 'proxy' OR verdict_weight < 1.00
    )
);

-- ---------------------------------------------------------------------------
-- SEED — the rules the current platform can actually satisfy today.
-- Each names a table that exists in this chain.
-- ---------------------------------------------------------------------------

INSERT INTO ai_resolution_rules
 (prediction_type, truth_table, truth_column, subject_column, truth_aggregate,
  window_days, date_column, resolution_mode, verdict_weight, tolerance_pct, rationale)
VALUES
 -- Column names below were checked against the applied schema, not assumed.
 -- The first draft of this seed named gross_revenue, checked_at, batch_id and
 -- actual_delivery_hours; none of them exist. A rule pointing at a phantom
 -- column fails at resolution time and looks like "no ground truth yet", so
 -- the loop would have appeared to run while silently learning nothing.
 -- tools/validate-resolution-rules.js now blocks that in CI.

 ('yield_qtl','yield_actuals','quantity_harvested_kg','farmer_id','sum',
  180,'harvested_on','observed',1.00,15.00,
  'Harvest is weighed and recorded in yield_actuals. The scale is the judge; '
  'no human needed.'),

 ('farmer_revenue','farmer_revenue','gross_amount','farmer_id','sum',
  90,'received_on','observed',1.00,10.00,
  'Money received is money received. Fully autonomous.'),

 ('order_value','orders','total_amount','id','first',
  NULL,NULL,'observed',1.00,5.00,
  'The order settles at a number. Direct comparison, fully autonomous.'),

 ('delivery_days','orders','actual_delivery_date','id','first',
  NULL,NULL,'observed',1.00,20.00,
  'Resolved against orders.actual_delivery_date. Wide tolerance because NE road '
  'conditions add variance no forecaster can own. Note this resolves on the '
  'ORDER, not shipments — shipments has no realised-duration column.'),

 ('quality_pass','quality_checks','check_status','project_id','last',
  30,'check_date','observed',1.00,0.00,
  'A check either passed or it did not. Categorical, zero tolerance. Keyed on '
  'project_id because quality_checks has no batch/lot column — see the '
  'disabled rules below for what that costs us.'),

 ('transaction_settled','transactions','status','id','last',
  60,'created_at','observed',1.00,0.00,
  'Terminal transaction status is directly observable.')
ON CONFLICT (prediction_type) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RULES THAT CANNOT RUN YET, RECORDED RATHER THAN QUIETLY DROPPED
--
-- These are seeded DISABLED. Each needs a link the schema does not yet carry.
-- Writing them down as disabled rows keeps the requirement visible; deleting
-- them would make the gap invisible and it would be rediscovered later as a
-- surprise.
-- ---------------------------------------------------------------------------

INSERT INTO ai_resolution_rules
 (prediction_type, truth_table, truth_column, subject_column, truth_aggregate,
  window_days, date_column, resolution_mode, verdict_weight, tolerance_pct,
  enabled, rationale)
VALUES
 ('coldchain_spoilage_prevented','quality_checks','check_status','project_id','last',
  14,'check_date','proxy',0.60,0.00,FALSE,
  'BLOCKED: quality_checks cannot be keyed to a batch, so a quarantined batch '
  'cannot be followed to its later result. Also COUNTERFACTUAL — the batch was '
  'quarantined, so the spoilage it would have suffered never happened and is '
  'not measurable even in principle. Proxy weight 0.60 once a batch link exists.'),

 ('fraud_flag','transactions','status','id','last',
  60,'created_at','proxy',0.50,0.00,FALSE,
  'DISABLED DELIBERATELY, not blocked. A held transaction cannot complete, so '
  'the fraud it would have caused is unobservable. Scoring a fraud model on the '
  'transactions it blocked is a self-confirming loop: it reports excellent '
  'accuracy forever while learning nothing. Enable only alongside an external '
  'chargeback or confirmed-bad-account feed.'),

 ('conflict_route_risk','shipments','status','id','first',
  30,'created_at','human_only',1.00,25.00,FALSE,
  'Road-blockage risk during NE community tensions. If the route was changed '
  'the original road was never driven; if it was not changed, a safe arrival '
  'does not prove the risk was absent. Being wrong in the unsafe direction can '
  'put a driver in danger, so the standard of evidence is a person, not a proxy.')
ON CONFLICT (prediction_type) DO NOTHING;

-- ---------------------------------------------------------------------------
-- CALIBRATION GATES — where the scorecard finally changes behaviour
--
-- Until now the loop recorded and nothing read it. A measurement that never
-- reaches a decision is a diary, not a control system. This is the read side.
--
-- The gate is derived, never typed, so nobody can promote an agent by editing
-- a row. An agent's own record decides how much authority it gets.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_ai_agent_gate AS
WITH scored AS (
  SELECT
      p.actor_id,
      COUNT(*) FILTER (WHERE p.resolved_at IS NOT NULL)          AS resolved,
      AVG(p.stated_confidence) FILTER (WHERE p.resolved_at IS NOT NULL) AS stated,
      AVG(p.ape_pct)                                             AS mean_ape,
      -- weight each verdict by the trust its resolution rule earns
      AVG(COALESCE(r.verdict_weight, 1.0))                       AS mean_weight,
      BOOL_OR(COALESCE(r.resolution_mode, 'observed') = 'human_only') AS needs_human
  FROM ai_prediction_log p
  LEFT JOIN ai_resolution_rules r ON r.prediction_type = p.prediction_type
  GROUP BY p.actor_id
)
SELECT
    actor_id,
    resolved,
    ROUND(stated::numeric, 2)                        AS stated_confidence,
    ROUND((100 - mean_ape)::numeric, 2)              AS realised_accuracy,
    ROUND((stated - (100 - mean_ape))::numeric, 2)   AS calibration_gap,
    ROUND(mean_weight::numeric, 2)                   AS evidence_weight,
    needs_human,
    CASE
      -- Too little evidence to judge. NOT the same as trusted: a new agent
      -- has an unknown record, and unknown is not good.
      WHEN resolved IS NULL OR resolved < 10 THEN 'unproven'
      -- Claims far more certainty than it earns. Its output may inform a human
      -- but must not drive an action on its own.
      WHEN (stated - (100 - mean_ape)) > 25 THEN 'advisory_only'
      WHEN (stated - (100 - mean_ape)) > 10 THEN 'discounted'
      -- Understating confidence is a smaller sin than overstating it, but it
      -- still means the number cannot be taken at face value.
      WHEN (stated - (100 - mean_ape)) < -20 THEN 'underconfident'
      ELSE 'trusted'
    END                                              AS gate,
    CASE
      WHEN resolved IS NULL OR resolved < 10 THEN 0.50
      WHEN (stated - (100 - mean_ape)) > 25 THEN 0.25
      WHEN (stated - (100 - mean_ape)) > 10 THEN 0.70
      ELSE 1.00
    END                                              AS authority_multiplier
FROM scored;

CREATE INDEX IF NOT EXISTS idx_ai_resolution_rules_type ON ai_resolution_rules (prediction_type) WHERE enabled;
