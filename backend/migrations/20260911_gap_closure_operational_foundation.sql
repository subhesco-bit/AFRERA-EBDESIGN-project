-- Consolidated gap-closure foundation. All objects are idempotent.
CREATE TABLE IF NOT EXISTS village_households (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, household_code VARCHAR(60) NOT NULL,
 head_name TEXT, member_count INTEGER NOT NULL DEFAULT 0 CHECK(member_count>=0), livelihood_summary JSONB NOT NULL DEFAULT '{}',
 bank_access BOOLEAN, digital_access BOOLEAN, vulnerability JSONB NOT NULL DEFAULT '{}', is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(village_id,household_code)
);
CREATE TABLE IF NOT EXISTS village_governance_records (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, record_type VARCHAR(40) NOT NULL,
 title TEXT NOT NULL, owner_id VARCHAR(100), status VARCHAR(30) NOT NULL DEFAULT 'open',
 target_date DATE, evidence JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS village_assets (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, asset_type VARCHAR(60) NOT NULL, name TEXT NOT NULL,
 location JSONB NOT NULL DEFAULT '{}', capacity NUMERIC(20,4), condition VARCHAR(30), owner_entity VARCHAR(100),
 maintenance_due DATE, status VARCHAR(30) NOT NULL DEFAULT 'active', metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS village_service_coverage (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, service_type VARCHAR(60) NOT NULL,
 provider VARCHAR(120), target_population INTEGER, served_population INTEGER, access_distance_km NUMERIC(12,3),
 quality_score NUMERIC(6,3), observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS village_livelihoods (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, household_id UUID REFERENCES village_households(id) ON DELETE CASCADE,
 livelihood_type VARCHAR(80) NOT NULL, season VARCHAR(30), income_share NUMERIC(8,4), employment_status VARCHAR(30), metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS village_skills (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, skill_code VARCHAR(80) NOT NULL, skill_name TEXT NOT NULL,
 available_count INTEGER NOT NULL DEFAULT 0, required_count INTEGER NOT NULL DEFAULT 0, proficiency VARCHAR(30), training_needed INTEGER NOT NULL DEFAULT 0, metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS village_hazards (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, hazard_type VARCHAR(60) NOT NULL, severity VARCHAR(20) NOT NULL,
 probability NUMERIC(6,5), exposure JSONB NOT NULL DEFAULT '{}', mitigation JSONB NOT NULL DEFAULT '{}', observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS village_connectivity (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, technology VARCHAR(40) NOT NULL, provider VARCHAR(120),
 availability_score NUMERIC(6,3), quality_score NUMERIC(6,3), observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS village_natural_resources (
 id UUID PRIMARY KEY, village_id VARCHAR(100) NOT NULL, resource_type VARCHAR(60) NOT NULL, name TEXT,
 quantity NUMERIC(20,4), unit VARCHAR(30), condition VARCHAR(30), protection_status VARCHAR(30), metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS fpo_members (
 id UUID PRIMARY KEY, fpo_id VARCHAR(100) NOT NULL, farmer_id VARCHAR(100) NOT NULL, membership_number VARCHAR(60) NOT NULL,
 joined_on DATE, share_count NUMERIC(20,4) NOT NULL DEFAULT 0, contribution_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
 status VARCHAR(30) NOT NULL DEFAULT 'active', metadata JSONB NOT NULL DEFAULT '{}', UNIQUE(fpo_id,membership_number), UNIQUE(fpo_id,farmer_id)
);
CREATE TABLE IF NOT EXISTS fpo_procurement_contracts (
 id UUID PRIMARY KEY, fpo_id VARCHAR(100) NOT NULL, buyer_id VARCHAR(100), crop_code VARCHAR(80),
 contracted_quantity NUMERIC(20,4) NOT NULL DEFAULT 0, contracted_price NUMERIC(20,4), currency CHAR(3) NOT NULL DEFAULT 'INR',
 start_date DATE, end_date DATE, status VARCHAR(30) NOT NULL DEFAULT 'draft', terms JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS logistics_trips (
 id UUID PRIMARY KEY, shipment_id VARCHAR(100), vehicle_id VARCHAR(100), driver_id VARCHAR(100),
 route JSONB NOT NULL DEFAULT '{}', planned_start TIMESTAMPTZ, actual_start TIMESTAMPTZ, actual_end TIMESTAMPTZ,
 status VARCHAR(30) NOT NULL DEFAULT 'planned', freight_cost NUMERIC(20,4) NOT NULL DEFAULT 0, metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS cold_chain_events (
 id UUID PRIMARY KEY, shipment_id VARCHAR(100) NOT NULL, observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 temperature_c NUMERIC(8,3), humidity NUMERIC(8,3), excursion BOOLEAN NOT NULL DEFAULT FALSE, location JSONB NOT NULL DEFAULT '{}', metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS inventory_reconciliation_runs (
 id UUID PRIMARY KEY, correlation_id UUID NOT NULL, warehouse_id VARCHAR(100), started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 completed_at TIMESTAMPTZ, system_quantity NUMERIC(20,4) NOT NULL DEFAULT 0, counted_quantity NUMERIC(20,4) NOT NULL DEFAULT 0,
 variance_quantity NUMERIC(20,4) GENERATED ALWAYS AS (counted_quantity-system_quantity) STORED, status VARCHAR(30) NOT NULL DEFAULT 'started', evidence JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_vhh_village ON village_households(village_id);
CREATE INDEX IF NOT EXISTS idx_vga_village ON village_governance_records(village_id);
CREATE INDEX IF NOT EXISTS idx_va_village ON village_assets(village_id);
CREATE INDEX IF NOT EXISTS idx_vsc_village_time ON village_service_coverage(village_id,observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vh_village_time ON village_hazards(village_id,observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_fpom_fpo ON fpo_members(fpo_id);
CREATE INDEX IF NOT EXISTS idx_lt_status ON logistics_trips(status);
CREATE INDEX IF NOT EXISTS idx_cce_shipment_time ON cold_chain_events(shipment_id,observed_at DESC);
