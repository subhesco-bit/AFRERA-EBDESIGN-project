CREATE TABLE IF NOT EXISTS enterprise_module_tasks (
 id UUID PRIMARY KEY,
 module_id VARCHAR(4) NOT NULL,
 entity_type TEXT,
 entity_id TEXT,
 title TEXT NOT NULL,
 description TEXT,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open','in_progress','blocked','completed','cancelled')),
 priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN('low','normal','high','critical')),
 assigned_role TEXT,
 assigned_user TEXT,
 due_at TIMESTAMPTZ,
 payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_by TEXT,
 updated_by TEXT,
 completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enterprise_module_tasks_queue ON enterprise_module_tasks(module_id,status,priority,due_at);

CREATE TABLE IF NOT EXISTS enterprise_module_workflows (
 id UUID PRIMARY KEY,
 module_id VARCHAR(4) NOT NULL,
 entity_type TEXT NOT NULL,
 entity_id TEXT NOT NULL,
 state TEXT NOT NULL,
 priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN('low','normal','high','critical')),
 assigned_role TEXT,
 assigned_user TEXT,
 sla_due_at TIMESTAMPTZ,
 context JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_by TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(module_id,entity_type,entity_id)
);
CREATE INDEX IF NOT EXISTS idx_enterprise_module_workflow_state ON enterprise_module_workflows(module_id,state,updated_at DESC);

CREATE TABLE IF NOT EXISTS enterprise_module_workflow_history (
 id UUID PRIMARY KEY,
 workflow_id UUID NOT NULL REFERENCES enterprise_module_workflows(id) ON DELETE CASCADE,
 from_state TEXT,
 to_state TEXT NOT NULL,
 actor_id TEXT,
 actor_role TEXT,
 reason TEXT,
 evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
 correlation_id TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enterprise_module_workflow_history ON enterprise_module_workflow_history(workflow_id,created_at DESC);

CREATE TABLE IF NOT EXISTS enterprise_module_decisions (
 id UUID PRIMARY KEY,
 module_id VARCHAR(4) NOT NULL,
 workflow_id UUID REFERENCES enterprise_module_workflows(id) ON DELETE CASCADE,
 decision_type TEXT NOT NULL,
 proposed_action JSONB NOT NULL DEFAULT '{}'::jsonb,
 recommendation JSONB,
 evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
 risk_level TEXT NOT NULL DEFAULT 'normal' CHECK(risk_level IN('normal','elevated','high','critical')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','modified','deferred','cancelled')),
 maker_id TEXT,
 checker_id TEXT,
 decision_reason TEXT,
 decided_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enterprise_module_decisions_queue ON enterprise_module_decisions(module_id,status,risk_level,created_at DESC);

CREATE TABLE IF NOT EXISTS enterprise_module_kpi_snapshots (
 id UUID PRIMARY KEY,
 module_id VARCHAR(4) NOT NULL,
 metric_key TEXT NOT NULL,
 metric_value NUMERIC NOT NULL,
 unit TEXT,
 dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
 source_reference TEXT NOT NULL,
 measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 recorded_by TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enterprise_module_kpi_latest ON enterprise_module_kpi_snapshots(module_id,metric_key,measured_at DESC);

COMMENT ON TABLE enterprise_module_decisions IS 'M001-M550 governed maker-checker decision queue; AI output is advisory and never constitutes approval.';
COMMENT ON TABLE enterprise_module_kpi_snapshots IS 'KPI observations require source_reference; unsourced fabricated metrics are prohibited.';
