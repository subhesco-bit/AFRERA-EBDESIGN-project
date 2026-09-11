CREATE TABLE IF NOT EXISTS m001_m050_workflow_instances (
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
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m001_m050_workflow_module_state ON m001_m050_workflow_instances(module_id,state,updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_m001_m050_workflow_entity_active ON m001_m050_workflow_instances(module_id,entity_type,entity_id);

CREATE TABLE IF NOT EXISTS m001_m050_workflow_transitions (
 id UUID PRIMARY KEY,
 workflow_id UUID NOT NULL REFERENCES m001_m050_workflow_instances(id) ON DELETE CASCADE,
 from_state TEXT,
 to_state TEXT NOT NULL,
 actor_id TEXT,
 actor_role TEXT,
 reason TEXT,
 evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
 correlation_id TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m001_m050_transition_workflow ON m001_m050_workflow_transitions(workflow_id,created_at DESC);

CREATE TABLE IF NOT EXISTS m001_m050_decision_queue (
 id UUID PRIMARY KEY,
 module_id VARCHAR(4) NOT NULL,
 workflow_id UUID REFERENCES m001_m050_workflow_instances(id) ON DELETE CASCADE,
 decision_type TEXT NOT NULL,
 proposed_action JSONB NOT NULL,
 recommendation JSONB,
 risk_level TEXT NOT NULL DEFAULT 'normal' CHECK(risk_level IN('normal','elevated','high','critical')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','modified','deferred','cancelled')),
 maker_id TEXT,
 checker_id TEXT,
 decision_reason TEXT,
 decided_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m001_m050_decision_pending ON m001_m050_decision_queue(module_id,status,created_at DESC);

COMMENT ON TABLE m001_m050_workflow_instances IS 'Operational ERP state-machine instances for M001-M050; domain services remain authoritative for domain records.';
COMMENT ON TABLE m001_m050_decision_queue IS 'Maker-checker decision queue. AI recommendations never constitute approval.';
