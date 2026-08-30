-- ============================================================================
-- 999_farmer_credit_risk_resolution.sql (2026-08-08, renumbered 2026-08-30)
--
-- Renumbered from 063_farmer_credit_risk_resolution.sql: its own INSERT
-- INTO ai_resolution_rules needs that table, which 990_ai_outcomes.sql
-- creates - but 063 < 990 alphabetically, so it always ran first and failed
-- "relation ai_resolution_rules does not exist" the first time this repo's
-- CI actually ran npm run migrate for real. Content otherwise unchanged.
--
-- Ground truth for the new farmer-side credit-risk SCORE
-- (financialService.js:farmerCreditRiskScore), so its accuracy becomes
-- measurable over time via core/outcomeResolver.js instead of being a number
-- nobody ever checks against reality.
--
-- WHY A VIEW, NOT A DIRECT TABLE/COLUMN REFERENCE
-- ai_resolution_rules.truth_column must be a single column the generic
-- resolver (core/outcomeResolver.js resolveDue()) can aggregate directly with
-- SUM/AVG/MAX/MIN/COUNT/first/last. "Was this farmer's EMI paid on time" is
-- not a stored column anywhere — it is derived from emi_schedule.status +
-- emi_schedule.paid_date vs emi_schedule.due_date, joined to loans for
-- farmer_id (emi_schedule itself has no farmer_id column). A view expresses
-- that derivation once; the resolver just queries it like any other table
-- (Postgres does not distinguish views from tables in information_schema, so
-- tools/validate-resolution-rules.js's schema check also passes it).
--
-- Only EMI instalments already past their due_date are included, so an
-- instalment that simply has not come due yet is absent from the view rather
-- than misread as "unpaid" (0). Paid strictly by due_date scores 100; paid
-- late scores 55 (partial credit — the debt was honoured, just not on time);
-- anything else past due and still unpaid scores 0.
-- ============================================================================

CREATE OR REPLACE VIEW v_farmer_repayment_signal AS
SELECT
  l.farmer_id,
  e.due_date,
  CASE
    WHEN e.status = 'paid' AND e.paid_date IS NOT NULL AND e.paid_date::date <= e.due_date THEN 100
    WHEN e.status = 'paid' THEN 55
    ELSE 0
  END AS on_time_score
FROM emi_schedule e
JOIN loans l ON l.id = e.loan_id
WHERE e.due_date <= CURRENT_DATE;

COMMENT ON VIEW v_farmer_repayment_signal IS
  'Per-instalment on-time-repayment signal (0/55/100), EMIs already due only. '
  'Ground truth for ai_resolution_rules.farmer_credit_risk — AVG(on_time_score) '
  'over the resolution window is compared to the credit-risk score predicted '
  'at farmerCreditRiskScore() time.';

-- ---------------------------------------------------------------------------
-- Resolution rule. Declared 'proxy', not 'observed': the predicted number is
-- a composite creditworthiness score (FDI + repayment history + payment
-- history + order track record), not literally a repayment percentage, so a
-- match is directional evidence of a good score, not proof of one. Proxy
-- weight (< 1.00, enforced by the DB's proxy_cannot_claim_full_weight check)
-- keeps that honest rather than reporting the eventual accuracy as if it were
-- a real observed measurement.
-- ---------------------------------------------------------------------------
INSERT INTO ai_resolution_rules
 (prediction_type, truth_table, truth_column, subject_column, truth_aggregate,
  window_days, date_column, resolution_mode, verdict_weight, tolerance_pct, rationale)
VALUES
 ('farmer_credit_risk','v_farmer_repayment_signal','on_time_score','farmer_id','avg',
  180,'due_date','proxy',0.65,25.00,
  'farmerCreditRiskScore() (financialService.js) predicts a 0-100 creditworthiness '
  'score built from FDI, past repayment, farmer_revenue payment history and order '
  'track record. Resolved against AVG(on_time_score) over EMIs actually due in the '
  '180 days after the prediction — real repayment behaviour, not a self-report. '
  'Proxy because the predicted number is a composite score, not literally a '
  'repayment percentage, so a close match is directional evidence, not identity. '
  'A farmer with no EMIs due in the window yields no_truth_yet, same as any other '
  'rule here — it does not resolve as a false pass.')
ON CONFLICT (prediction_type) DO NOTHING;
