-- Clone-only gap closure foundation: Village, FPO, finance, logistics, data quality and deployment evidence.
CREATE TABLE IF NOT EXISTS village_operational_assets (
 id UUID PRIMARY KEY, village_id UUID NOT NULL, asset_type TEXT NOT NULL, name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active', capacity NUMERIC, location JSONB DEFAULT '{}'::jsonb,
 metadata JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_assets_village ON village_operational_assets(village_id);
CREATE TABLE IF NOT EXISTS village_service_coverage (
 id UUID PRIMARY KEY, village_id UUID NOT NULL, service_type TEXT NOT NULL, provider TEXT,
 target_population INTEGER, served_population INTEGER DEFAULT 0, accessibility_score NUMERIC(8,4), quality_score NUMERIC(8,4), metadata JSONB DEFAULT '{}'::jsonb, observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_service_village ON village_service_coverage(village_id, service_type);
CREATE TABLE IF NOT EXISTS village_resilience_profiles (
 village_id UUID PRIMARY KEY, hazards JSONB DEFAULT '[]'::jsonb, vulnerabilities JSONB DEFAULT '[]'::jsonb,
 resources JSONB DEFAULT '[]'::jsonb, response_capacity JSONB DEFAULT '{}'::jsonb, resilience_score NUMERIC(8,4), assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS fpo_member_operations (
 id UUID PRIMARY KEY, fpo_id UUID NOT NULL, farmer_id UUID NOT NULL, membership_status TEXT NOT NULL DEFAULT 'active', equity_amount NUMERIC(18,2) DEFAULT 0, procurement_value NUMERIC(18,2) DEFAULT 0, sales_value NUMERIC(18,2) DEFAULT 0, settlement_due NUMERIC(18,2) DEFAULT 0, metadata JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(fpo_id, farmer_id)
);
CREATE TABLE IF NOT EXISTS fpo_procurement_operations (
 id UUID PRIMARY KEY, fpo_id UUID NOT NULL, farmer_id UUID, supply_lot_id UUID, quantity NUMERIC(18,3) NOT NULL, unit TEXT NOT NULL, unit_price NUMERIC(18,4) NOT NULL, gross_value NUMERIC(18,2) NOT NULL, status TEXT NOT NULL DEFAULT 'received', quality JSONB DEFAULT '{}'::jsonb, received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS finance_journals (
 id UUID PRIMARY KEY, journal_date DATE NOT NULL, source_type TEXT NOT NULL, source_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'posted', description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS finance_journal_lines (
 id UUID PRIMARY KEY, journal_id UUID NOT NULL, account_code TEXT NOT NULL, direction TEXT NOT NULL CHECK(direction IN ('debit','credit')), amount NUMERIC(18,2) NOT NULL CHECK(amount >= 0), entity_type TEXT, entity_id TEXT, metadata JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_finance_lines_journal ON finance_journal_lines(journal_id);
CREATE TABLE IF NOT EXISTS logistics_trips (
 id UUID PRIMARY KEY, shipment_id UUID, vehicle_id TEXT, driver_id TEXT, carrier_id TEXT, route JSONB DEFAULT '{}'::jsonb, planned_distance_km NUMERIC(12,3), actual_distance_km NUMERIC(12,3), freight_cost NUMERIC(18,2) DEFAULT 0, status TEXT NOT NULL DEFAULT 'planned', started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, metadata JSONB DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS logistics_delivery_events (
 id UUID PRIMARY KEY, shipment_id UUID NOT NULL, event_type TEXT NOT NULL, status TEXT NOT NULL, latitude NUMERIC(10,7), longitude NUMERIC(10,7), temperature_c NUMERIC(8,3), proof JSONB DEFAULT '{}'::jsonb, occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS master_entity_canonical_records (
 id UUID PRIMARY KEY, entity_type TEXT NOT NULL, canonical_key TEXT NOT NULL, source_count INTEGER DEFAULT 0, confidence NUMERIC(6,5), attributes JSONB NOT NULL DEFAULT '{}'::jsonb, provenance JSONB NOT NULL DEFAULT '[]'::jsonb, status TEXT NOT NULL DEFAULT 'active', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(entity_type, canonical_key)
);
CREATE TABLE IF NOT EXISTS integration_outbox_events (
 id UUID PRIMARY KEY, event_type TEXT NOT NULL, aggregate_type TEXT NOT NULL, aggregate_id TEXT NOT NULL, correlation_id UUID NOT NULL, payload JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','published','failed','dead_letter')), attempts INTEGER NOT NULL DEFAULT 0, available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON integration_outbox_events(status, available_at);
CREATE TABLE IF NOT EXISTS production_verification_evidence (
 id UUID PRIMARY KEY, verification_run_id UUID NOT NULL, domain TEXT NOT NULL, check_code TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('passed','failed','skipped')), evidence JSONB DEFAULT '{}'::jsonb, observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verification_run ON production_verification_evidence(verification_run_id);
