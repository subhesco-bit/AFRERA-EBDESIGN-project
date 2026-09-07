-- 9997_erp_cost_center_budgets_schema.sql
--
-- costControlRoutes.js needs somewhere to record a budgeted figure per cost
-- center per period so it can compute a real variance against
-- erp_journal_lines actuals (4000_comprehensive_erp_schema.sql). Neither the
-- 996_enterprise_foundation `budgets`/`budget_lines` tables nor the erp_*
-- schema in 4000 carry a budget figure keyed to erp_cost_centers, so this is
-- a genuine gap, not a duplicate of either.
--
-- Runs after 4000_comprehensive_erp_schema.sql (has erp_cost_centers) and
-- 053_v42_recovered_finance (unrelated, sorts earlier).

CREATE TABLE IF NOT EXISTS erp_cost_center_budgets (
  id SERIAL PRIMARY KEY,
  cost_center_code VARCHAR(20) NOT NULL REFERENCES erp_cost_centers(cost_center_code) ON DELETE CASCADE,
  fiscal_period VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  budgeted_amount NUMERIC(15,2) NOT NULL CHECK (budgeted_amount >= 0),
  -- Threshold above which a variance is flagged for review, as a fraction of
  -- budget (0.10 = 10% over budget triggers a flag). Configurable per line
  -- because discretionary spend (e.g. travel) tolerates less variance than
  -- pass-through cost centers (e.g. utilities).
  variance_alert_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (variance_alert_threshold_pct >= 0),
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cost_center_code, fiscal_period)
);

CREATE INDEX IF NOT EXISTS idx_erp_cost_center_budgets_period ON erp_cost_center_budgets(fiscal_period);
