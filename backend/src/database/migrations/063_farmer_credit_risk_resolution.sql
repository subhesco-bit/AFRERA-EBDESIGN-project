-- ============================================================================
-- 063_farmer_credit_risk_resolution.sql (2026-08-08)
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
-- ---------------------------------------------------------------------------
-- ORDERING (2026-09-23): the INSERT that used to sit here has MOVED to
-- 9990_farmer_credit_risk_resolution_seed.sql.
--
-- It seeds ai_resolution_rules, a table created by 990_ai_outcomes.sql. The
-- runner orders migrations by filename, so 063 runs long BEFORE 990 and the
-- INSERT failed with `relation "ai_resolution_rules" does not exist`, taking
-- the view above down with it. Verified on a clean PostgreSQL 16 run.
--
-- The view stays here, where it belongs; only the seed moved, to a filename
-- that sorts after the table it writes to. Nothing was dropped or rewritten.
-- ---------------------------------------------------------------------------
