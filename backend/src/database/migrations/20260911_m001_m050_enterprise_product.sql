CREATE TABLE IF NOT EXISTS m001_m050_operational_tasks (
 id UUID PRIMARY KEY,module_id VARCHAR(4) NOT NULL,entity_type TEXT,entity_id TEXT,title TEXT NOT NULL,description TEXT,
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open','in_progress','blocked','completed','cancelled')),
 priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN('low','normal','high','critical')),assigned_role TEXT,assigned_user TEXT,due_at TIMESTAMPTZ,
 payload JSONB NOT NULL DEFAULT '{}'::jsonb,created_by TEXT,updated_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_m001_m050_tasks_module_status ON m001_m050_operational_tasks(module_id,status,priority,due_at);
CREATE INDEX IF NOT EXISTS idx_m001_m050_tasks_entity ON m001_m050_operational_tasks(module_id,entity_type,entity_id) WHERE entity_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS m001_m050_kpi_snapshots (
 id UUID PRIMARY KEY,module_id VARCHAR(4) NOT NULL,metric_key TEXT NOT NULL,metric_value NUMERIC NOT NULL,unit TEXT,dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
 source_reference TEXT NOT NULL,measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),recorded_by TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m001_m050_kpi_latest ON m001_m050_kpi_snapshots(module_id,metric_key,measured_at DESC);
COMMENT ON TABLE m001_m050_operational_tasks IS 'Operational work/SLA layer for M001-M050. Domain records remain in authoritative module schemas.';
COMMENT ON TABLE m001_m050_kpi_snapshots IS 'Provenance-required KPI snapshots. UI must not fabricate missing values.';