-- ============================================================================
-- 9996_project_systems_schema.sql   (2026-08-08)
--
-- AF-PS (Project Systems, SAP equivalent: PS).
--
-- WHY THIS EXISTS
-- docs/registry/12_ERP_COVERAGE.md and AFRERA_CLAUDE_BUILD_DIRECTIVE.md §8.6
-- name AF-PS as one of three ERP domains with zero modules and zero
-- endpoints. Unlike AF-AA and AF-CO (built earlier this session), AF-PS had
-- no schema at all anywhere in this codebase — this migration is the first
-- one to create it, not a service layer over something already there.
--
-- WHY NUMBERED 9996, NOT IN THE 060s/070s SEQUENCE
-- Migrations run in filename-sort order (see database/migrate.js:
-- `readdirSync(...).sort()`). A project needs a company to belong to, a cost
-- centre to (optionally) attribute spend to, and a ledger to post actuals
-- against — `companies`, `cost_centers`, `journal_entries`, `journal_lines`
-- and `chart_of_accounts` are all defined in 996_enterprise_foundation.sql.
-- A migration numbered in the 060s would run BEFORE 996 (numeric prefixes
-- sort as strings: "064_..." < "996_...") and fail at migrate time with
-- "relation companies does not exist" — exactly the ordering problem
-- 999_schema_reconciliation.sql's own header describes solving for FKs added
-- after the fact. Numbering this 9996 places it after 996-998 and after
-- 9995, and before 999 (which only ALTERs pre-existing tables in other
-- domains and has no dependency on this file either way).
--
-- SCOPE, HONESTLY STATED
-- This is project costing for the domain this platform actually has:
-- infrastructure builds — packhouse construction, cold-storage installation,
-- FPO facility setup (see sharedInfraService.js's shared-infrastructure asset
-- registration, and 041_rural_life_os_schema.sql's `rural_economic_units`,
-- which is who commissions this kind of build). It is NOT a general-purpose
-- PS module: no resource/capacity planning, no network/Gantt scheduling, no
-- claims/change-order workflow, no multi-project resource levelling. Those
-- need data (labour calendars, equipment pools, contractual change logs)
-- this codebase has nowhere else, and fabricating tables for them would be
-- exactly the "speculative over-engineered model" this task was told not to
-- build. Three tables cover what is asked for: a project, its work breakdown
-- structure (hierarchical, self-referencing), and its milestones.
--
-- ACTUALS ARE LEDGER-DERIVED, NEVER STORED (same discipline as AF-CO)
-- `project_wbs` and `projects` carry PLANNED cost/budget only. There is no
-- `actual_cost` column anywhere in this file. A project's or WBS element's
-- actual cost is computed live by projectSystemsService from posted
-- `journal_lines` tagged with the new `project_id` / `wbs_id` columns added
-- below — the same "derived from the ledger, not stored, to avoid drift"
-- rule 996 documents on `budget_lines`, applied here to project costing.
--
-- ADDITIVE-ONLY CHANGE TO journal_lines
-- Two nullable FK columns are added: `project_id` and `wbs_id`. No existing
-- column is touched. A journal line that is not project-related simply
-- leaves both NULL, exactly like it already does for `cost_center_id` etc.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROJECTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    project_code VARCHAR(40) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    -- The rural economic unit (FPO, cooperative, SHG, ...) the project is
    -- being built for/by, when it is REU-commissioned. Nullable: a
    -- company-internal build (e.g. the platform's own depot) has no REU.
    reu_id UUID REFERENCES rural_economic_units(id) ON DELETE SET NULL,
    -- Kept to a small, honest vocabulary matching what this platform's own
    -- domain actually builds (see sharedInfraService.js registrations).
    project_type VARCHAR(30) NOT NULL DEFAULT 'infrastructure'
        CHECK (project_type IN ('infrastructure','equipment','capacity_building','other')),
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned','active','on_hold','completed','cancelled')),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    -- Total sanctioned budget. NUMERIC(20,4) matches every money column in
    -- 996 — never float, for the same reason.
    budget_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (budget_amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, project_code),
    CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date),
    CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

-- ---------------------------------------------------------------------------
-- 2. WORK BREAKDOWN STRUCTURE
-- Self-referencing hierarchy: phases contain tasks contain sub-tasks. Planned
-- cost is stored per element; actual cost is never stored here — see the
-- header note and projectSystemsService.getWbsCostRollup.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_wbs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES project_wbs(id) ON DELETE CASCADE,
    wbs_code VARCHAR(40) NOT NULL,
    wbs_name VARCHAR(255) NOT NULL,
    sequence_number INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned','active','on_hold','completed','cancelled')),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    planned_cost NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (planned_cost >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, wbs_code),
    -- A row can reference an ancestor but never itself. (Deeper cycles, e.g.
    -- A -> B -> A, are not something a CHECK constraint can catch; the
    -- service layer walks the tree defensively — see buildWbsRollup.)
    CHECK (parent_id IS NULL OR parent_id <> id),
    CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date)
);

-- ---------------------------------------------------------------------------
-- 3. MILESTONES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    -- Optional: a milestone can mark the completion of a specific WBS
    -- element ("packhouse shell complete") or stand at the project level
    -- ("FPO facility handover").
    wbs_id INTEGER REFERENCES project_wbs(id) ON DELETE SET NULL,
    milestone_name VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    actual_completion_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','completed','missed','cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, milestone_name)
);

-- ---------------------------------------------------------------------------
-- 4. LEDGER INTEGRATION (additive only)
-- Tags a posted journal line to the project/WBS element it belongs to, so
-- actual cost is a live SUM over real postings rather than a duplicated,
-- driftable number. Mirrors how journal_lines already carries
-- cost_center_id / profit_center_id / business_unit_id for the same reason.
-- ---------------------------------------------------------------------------

ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS wbs_id INTEGER REFERENCES project_wbs(id) ON DELETE SET NULL;

-- A line tagged with a WBS element must also carry the project it belongs
-- to — a WBS-only tag with no project is an orphaned reference that no
-- report could group correctly.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_journal_lines_wbs_requires_project'
    ) THEN
        ALTER TABLE journal_lines
            ADD CONSTRAINT chk_journal_lines_wbs_requires_project
            CHECK (wbs_id IS NULL OR project_id IS NOT NULL);
    END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 5. INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_projects_company ON projects (company_id);
CREATE INDEX IF NOT EXISTS idx_projects_reu ON projects (reu_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_project_wbs_project ON project_wbs (project_id);
CREATE INDEX IF NOT EXISTS idx_project_wbs_parent ON project_wbs (parent_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_wbs ON project_milestones (wbs_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_target_date ON project_milestones (target_date);
CREATE INDEX IF NOT EXISTS idx_journal_lines_project ON journal_lines (project_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_wbs ON journal_lines (wbs_id);
