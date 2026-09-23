-- ---------------------------------------------------------------------------
-- 9990_farmer_credit_risk_resolution_seed.sql  (moved here 2026-09-23)
--
-- This INSERT was the tail of 063_farmer_credit_risk_resolution.sql. It seeds
-- ai_resolution_rules, which 990_ai_outcomes.sql creates -- and the runner
-- orders migrations by filename, so 063 ran long before 990 and this failed
-- with `relation "ai_resolution_rules" does not exist`, aborting 063 and
-- losing the v_farmer_repayment_signal view with it.
--
-- The view is still defined in 063, where it belongs. Only the seed moved, to
-- a filename that sorts after the table it writes to. The statement itself is
-- unchanged, including its ON CONFLICT guard.
--
-- It depends on: 990_ai_outcomes.sql (ai_resolution_rules)
--                063_farmer_credit_risk_resolution.sql (v_farmer_repayment_signal)
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
