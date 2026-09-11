-- 9998_village_erp_operating_system.sql
-- Runs after enterprise foundation (996/998) and before ERP foundation seed (9999).
-- Village ERP operating spine: households, members, enterprises, budgets,
-- finance dimensions, operational KPIs, workflow tasks and AI insight audit.

CREATE TABLE IF NOT EXISTS village_households (
    id BIGSERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    household_code VARCHAR(60) NOT NULL,
    head_name VARCHAR(200),
    phone VARCHAR(30),
    address TEXT,
    category VARCHAR(40),
    vulnerable BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (village_id, household_code)
);

CREATE TABLE IF NOT EXISTS village_household_members (
    id BIGSERIAL PRIMARY KEY,
    household_id BIGINT NOT NULL REFERENCES village_households(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    relationship VARCHAR(50),
    gender VARCHAR(30),
    date_of_birth DATE,
    phone VARCHAR(30),
    occupation VARCHAR(100),
    education VARCHAR(100),
    is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS village_enterprises (
    id BIGSERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    enterprise_code VARCHAR(60) NOT NULL,
    enterprise_name VARCHAR(200) NOT NULL,
    enterprise_type VARCHAR(80) NOT NULL,
    owner_household_id BIGINT REFERENCES village_households(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','inactive','closed')),
    annual_revenue NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (annual_revenue >= 0),
    employee_count INTEGER NOT NULL DEFAULT 0 CHECK (employee_count >= 0),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (village_id, enterprise_code)
);

CREATE TABLE IF NOT EXISTS village_budgets (
    id BIGSERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    fiscal_year_id INTEGER REFERENCES fiscal_years(id) ON DELETE RESTRICT,
    budget_code VARCHAR(60) NOT NULL,
    category VARCHAR(80) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    allocated_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    committed_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
    spent_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','active','closed','cancelled')),
    approved_by UUID,
    approved_at TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (village_id, budget_code),
    CHECK (period_end >= period_start),
    CHECK (spent_amount <= allocated_amount OR status IN ('closed','cancelled'))
);

CREATE TABLE IF NOT EXISTS village_finance_dimensions (
    village_id INTEGER PRIMARY KEY REFERENCES villages(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    profit_center_id INTEGER REFERENCES profit_centers(id) ON DELETE SET NULL,
    cash_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    revenue_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    expense_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    receivable_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    payable_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS village_operational_kpis (
    id BIGSERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    households INTEGER NOT NULL DEFAULT 0 CHECK (households >= 0),
    active_farmers INTEGER NOT NULL DEFAULT 0 CHECK (active_farmers >= 0),
    active_fishers INTEGER NOT NULL DEFAULT 0 CHECK (active_fishers >= 0),
    enterprises INTEGER NOT NULL DEFAULT 0 CHECK (enterprises >= 0),
    production_value NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (production_value >= 0),
    procurement_value NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (procurement_value >= 0),
    sales_value NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (sales_value >= 0),
    employment_count INTEGER NOT NULL DEFAULT 0 CHECK (employment_count >= 0),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (village_id, metric_date)
);

CREATE TABLE IF NOT EXISTS village_workflow_tasks (
    id BIGSERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    task_type VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','blocked','completed','cancelled')),
    assigned_user_id UUID,
    due_at TIMESTAMP,
    completed_at TIMESTAMP,
    source_type VARCHAR(60),
    source_id VARCHAR(100),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS village_ai_insights (
    id BIGSERIAL PRIMARY KEY,
    village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    insight_type VARCHAR(80) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info','low','medium','high','critical')),
    title VARCHAR(255) NOT NULL,
    insight TEXT NOT NULL,
    recommendation TEXT,
    confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
    model_provider VARCHAR(80),
    model_name VARCHAR(120),
    source_snapshot JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','accepted','dismissed','actioned')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_village_households_village ON village_households(village_id);
CREATE INDEX IF NOT EXISTS idx_village_members_household ON village_household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_village_enterprises_village ON village_enterprises(village_id);
CREATE INDEX IF NOT EXISTS idx_village_budgets_village_year ON village_budgets(village_id, fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_village_kpis_village_date ON village_operational_kpis(village_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_village_tasks_village_status ON village_workflow_tasks(village_id, status);
CREATE INDEX IF NOT EXISTS idx_village_ai_village_created ON village_ai_insights(village_id, created_at DESC);

CREATE OR REPLACE FUNCTION village_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_village_households_updated_at ON village_households;
CREATE TRIGGER trg_village_households_updated_at BEFORE UPDATE ON village_households FOR EACH ROW EXECUTE FUNCTION village_updated_at();
DROP TRIGGER IF EXISTS trg_village_enterprises_updated_at ON village_enterprises;
CREATE TRIGGER trg_village_enterprises_updated_at BEFORE UPDATE ON village_enterprises FOR EACH ROW EXECUTE FUNCTION village_updated_at();
DROP TRIGGER IF EXISTS trg_village_budgets_updated_at ON village_budgets;
CREATE TRIGGER trg_village_budgets_updated_at BEFORE UPDATE ON village_budgets FOR EACH ROW EXECUTE FUNCTION village_updated_at();
DROP TRIGGER IF EXISTS trg_village_finance_dimensions_updated_at ON village_finance_dimensions;
CREATE TRIGGER trg_village_finance_dimensions_updated_at BEFORE UPDATE ON village_finance_dimensions FOR EACH ROW EXECUTE FUNCTION village_updated_at();
DROP TRIGGER IF EXISTS trg_village_tasks_updated_at ON village_workflow_tasks;
CREATE TRIGGER trg_village_tasks_updated_at BEFORE UPDATE ON village_workflow_tasks FOR EACH ROW EXECUTE FUNCTION village_updated_at();
