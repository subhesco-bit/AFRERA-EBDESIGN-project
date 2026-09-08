-- Module-schema gap closure, batch 1.
--
-- Scope: closes the real (non-inert) portion of AUDIT_DB.md Finding 4 for
-- modules M006, M008, M009, M014, M021, M044, M045, M071, M073, M074, M075,
-- M144.
-- Every table/column here was reverse-engineered directly from the actual
-- INSERT/SELECT/UPDATE column lists in each module's service.js - nothing
-- speculative was added.
--
-- IMPORTANT CORRECTION TO THE AUDIT'S "58 modules" COUNT: a static re-check
-- of all 61 schema-less modules with real queries found that 40 of them
-- (the "40-line generic CRUD" template - tableName = '<prefix>_m0XX_items',
-- columns id/data/created_at/updated_at only) are NOT actually broken -
-- backend/src/database/migrations/3000_M0XX_generated.sql already exists
-- for ALL 150 modules and creates exactly that generic shape. Verified by
-- diff for M026-M028, M030, M033, M036, M040, M047, M048, M050, M069, M090,
-- M091-M094, M098-M100, M106, M110, M111, M114, M115, M117-M120, M132,
-- M137, M139, M141, M148, M149. Those needed no new migration.
-- The genuinely-still-broken modules (real custom column lists with no
-- matching CREATE TABLE anywhere) are the ones this file (and its planned
-- follow-up batches) actually fixes.
--
-- Positioned with a long run of z's (more than any other 9999_zzz... file
-- as of 2026-09-08, longest prior was 36 z's / org_tenant_management_columns.sql)
-- so it runs after every table it ALTERs, since several of those tables
-- were only created by other 9999_zzz...-numbered migrations.

-- ---------------------------------------------------------------------
-- audit_logs collision fix (M006, M008)
-- ---------------------------------------------------------------------
-- 2026-09-08: `audit_logs` collides across 5 migration files
-- (000_base_schema.sql, 001_skeleton_complete_schema.sql,
-- 014_audit_system.sql, 014_platform_foundation_modules.sql,
-- 1002_system_administration.sql). 000_base_schema.sql sorts first and
-- wins: id UUID, user_id UUID REFERENCES users(id), action VARCHAR(100),
-- entity_type VARCHAR(50), entity_id UUID, old_values/new_values JSONB,
-- ip_address INET, user_agent TEXT, "timestamp" TIMESTAMP (NOT created_at).
-- M006/service.js's own header comment claims this table was "created in
-- migrations/1002_system_administration.sql" - that file's version is a
-- silent no-op against the real, already-created table from 000. Both
-- M006 (ingestAuditLog/getSystemAnalytics/detectAnomalies/etc.) and M008
-- (createAuditLog/getAuditLogs/verifyAuditLogIntegrity - M008 additionally
-- needs blockchain-style block_hash/previous_hash columns) query columns
-- that don't exist on the winning table: entity, details, created_at,
-- block_hash, previous_hash. Added via ALTER, not a second CREATE TABLE,
-- per the established collision policy (see 9999_zzz...farms_crop_plantings
-- for the pattern this follows). entity_type/old_values/new_values/
-- "timestamp" are left untouched - other, unaudited callers may depend on
-- them.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS block_hash VARCHAR(64);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ---------------------------------------------------------------------
-- M008 - Audit & Compliance: compliance_rules (genuinely new table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50),
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  severity VARCHAR(20) DEFAULT 'medium', -- listComplianceRules ORDER BY severity DESC
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_active ON compliance_rules(is_active);

-- ---------------------------------------------------------------------
-- M009 - Security & Access Control (genuinely new tables)
-- ---------------------------------------------------------------------
-- security_events already exists (9999_zzzzzzzzzzzzzzz_m012_session_security_schema.sql,
-- id UUID/user_id/event_type/ip_address/details/created_at) but M009's
-- createSecurityEvent()/getSecurityEvents()/detectThreats()/
-- calculateSecurityScore() also need severity, user_agent and blocked -
-- none of which any other migration defines, and there is exactly one
-- CREATE TABLE for security_events in the whole tree (no collision), so
-- this ALTER is safe.
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

CREATE TABLE IF NOT EXISTS access_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resource VARCHAR(255),
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_access_policies_resource ON access_policies(resource);

CREATE TABLE IF NOT EXISTS ip_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_type VARCHAR(20) NOT NULL, -- 'whitelist' | 'blacklist'
  ip_address VARCHAR(64) NOT NULL,
  description TEXT,
  added_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (list_type, ip_address) -- addToIpList() ON CONFLICT (list_type, ip_address)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, created_at);

-- ---------------------------------------------------------------------
-- M014 - Single Sign-On
-- ---------------------------------------------------------------------
-- sso_providers already exists (9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_identity_management_schema.sql,
-- id UUID/provider_name/protocol/client_id/status/notes/created_at/updated_at,
-- no other CREATE TABLE for sso_providers exists so this is a plain ALTER,
-- not a collision fix) but is missing everything M014's
-- getProviderConfig()/createProviderConfig() actually needs: client_secret,
-- auth_url, token_url, user_info_url, saml_config, scopes, and is_active
-- (the real table has "status" text instead - added is_active separately
-- rather than repurposing status, since M014 explicitly filters
-- `WHERE is_active = true`).
ALTER TABLE sso_providers ADD COLUMN IF NOT EXISTS client_secret VARCHAR(500);
ALTER TABLE sso_providers ADD COLUMN IF NOT EXISTS auth_url VARCHAR(500);
ALTER TABLE sso_providers ADD COLUMN IF NOT EXISTS token_url VARCHAR(500);
ALTER TABLE sso_providers ADD COLUMN IF NOT EXISTS user_info_url VARCHAR(500);
ALTER TABLE sso_providers ADD COLUMN IF NOT EXISTS saml_config JSONB;
ALTER TABLE sso_providers ADD COLUMN IF NOT EXISTS scopes JSONB DEFAULT '[]';
ALTER TABLE sso_providers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(255) NOT NULL,
  provider VARCHAR(100),
  redirect_uri VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);

CREATE TABLE IF NOT EXISTS sso_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100),
  event_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sso_events_provider ON sso_events(provider);
CREATE INDEX IF NOT EXISTS idx_sso_events_created_at ON sso_events(created_at);

CREATE TABLE IF NOT EXISTS user_sso_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  provider_user_id VARCHAR(255),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, provider) -- findOrCreateUserFromSSO() ON CONFLICT (user_id, provider)
);

-- ---------------------------------------------------------------------
-- M044 - Crop Variety / M045 - Seed Planning
-- ---------------------------------------------------------------------
-- `crop_varieties` collides: 001_skeleton_complete_schema.sql (id SERIAL,
-- crop_id INTEGER REFERENCES crops(id), code, name, description,
-- average_yield_kg_per_acre, created_at) sorts before and wins over
-- 9999_zzzzzzzzzzzzzzzzzzzzzzzzz_crop_management_schema.sql's later,
-- incompatible version. M044 (createVariety/updateVariety/
-- recommendVarieties/getVarietyAnalytics) needs crop_name, variety_name,
-- characteristics, seed_source, maturity_days, yield_potential,
-- disease_resistance, drought_tolerance, notes, status, updated_at - none
-- of which the winning table has. Added via ALTER, matching the collision
-- policy. id stays SERIAL/INTEGER (unchanged) - variety_id FKs below are
-- typed INTEGER to match.
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS crop_name VARCHAR(150);
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS variety_name VARCHAR(150);
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS characteristics JSONB DEFAULT '{}';
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS seed_source VARCHAR(255);
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS maturity_days INTEGER;
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS yield_potential DECIMAL(10,2);
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS disease_resistance JSONB DEFAULT '[]';
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS drought_tolerance VARCHAR(20);
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE crop_varieties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_crop_varieties_crop_name ON crop_varieties(crop_name);

CREATE TABLE IF NOT EXISTS variety_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variety_id INTEGER REFERENCES crop_varieties(id), -- crop_varieties.id is SERIAL, see above
  farmer_id UUID REFERENCES farmers(id),
  actual_yield DECIMAL(10,2),
  planting_date DATE,
  harvest_date DATE,
  conditions JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_variety_performance_variety ON variety_performance(variety_id);

-- M045 - Seed Planning (crop_registrations.id is UUID - see
-- 9999_zzzzzzzzzzzzzzzzzzzzzzzzz_crop_management_schema.sql; farmers.id is
-- UUID - see 000_base_schema.sql)
CREATE TABLE IF NOT EXISTS seed_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact JSONB DEFAULT '{}',
  location VARCHAR(255),
  crops_available JSONB DEFAULT '[]', -- listSeedSuppliers() uses `crops_available @> $1` (jsonb containment)
  quality_rating DECIMAL(3,1),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seed_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  crop_id UUID REFERENCES crop_registrations(id),
  variety_id INTEGER REFERENCES crop_varieties(id),
  area DECIMAL(10,2),
  seed_rate DECIMAL(10,2),
  total_seed_required DECIMAL(10,2),
  planting_date DATE,
  supplier_id UUID REFERENCES seed_suppliers(id),
  estimated_cost DECIMAL(12,2),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_seed_plans_farmer ON seed_plans(farmer_id);
CREATE INDEX IF NOT EXISTS idx_seed_plans_crop ON seed_plans(crop_id);

-- ---------------------------------------------------------------------
-- M021 - Farmer Registration (collision fix)
-- ---------------------------------------------------------------------
-- 2026-09-08: `farmers` collides between 000_base_schema.sql (id UUID,
-- user_id/fpo_id/farmer_id/fdi_score/... - the FDI-scoring shape used
-- throughout the rest of the platform) and this module's own
-- 3021_m021_farmer_registration.sql, which declares a SECOND, wildly
-- incompatible `CREATE TABLE IF NOT EXISTS farmers` with `id SERIAL` and
-- an entirely different registration-profile column set (name/email/
-- phone/date_of_birth/gender/address/land_size/primary_crop/skills/
-- education/farming_experience/verified). 000 sorts first and wins, so
-- 3021's own farmers CREATE was always a silent no-op - every M021
-- registerFarmer()/getFarmer()/updateFarmer()/approveFarmerVerification()/
-- getFarmerAnalytics() call has been querying columns that don't exist on
-- the live table. (3021's OTHER two tables, farmer_verifications and
-- farmer_onboarding, are NOT no-ops - nothing else declares those names -
-- and both already correctly reference `farmers(id)` as UUID, matching
-- the real, UUID-keyed farmers table, so they were left alone.) Fixed via
-- ALTER, consistent with the collision policy used throughout this file;
-- `id` stays UUID (unchanged) rather than the losing SERIAL variant.
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS land_size DECIMAL(10,2);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS primary_crop VARCHAR(100);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS skills JSONB;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS education VARCHAR(100);
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS farming_experience INTEGER;
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
-- NOTE: `status` already exists on the winning table (VARCHAR(20) DEFAULT
-- 'active'), so it was not duplicated here.
-- NOTE: email uniqueness was deliberately NOT added (no UNIQUE constraint)
-- - the real farmers table already carries an unrelated unique
-- `farmer_id` (external ID) column, and adding a blind UNIQUE on a
-- newly-nullable `email` column risks breaking on existing NULL rows in a
-- way that wasn't verified here; getFarmerByEmail() only reads, it
-- doesn't rely on uniqueness being enforced.
CREATE INDEX IF NOT EXISTS idx_farmers_email_m021 ON farmers(email);
CREATE INDEX IF NOT EXISTS idx_farmers_primary_crop_m021 ON farmers(primary_crop);

-- ---------------------------------------------------------------------
-- M071/M073/M074/M075 - Dairy/Goat/Sheep/Pig herd management
-- ---------------------------------------------------------------------
-- farm_id is typed UUID to match `farms(id)` from
-- 9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_farms_crop_plantings_schema.sql
-- (the winning `farms` definition after that file's own 001_skeleton
-- collision fix). location is stored JSONB - all four services do
-- `JSON.stringify(location)` before insert.
CREATE TABLE IF NOT EXISTS dairy_herds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  herd_name VARCHAR(255),
  breed VARCHAR(100),
  cattle_count INTEGER,
  location JSONB,
  farm_id UUID REFERENCES farms(id),
  average_milk_production DECIMAL(10,2),
  breeding_status VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dairy_herds_farm ON dairy_herds(farm_id);

CREATE TABLE IF NOT EXISTS milk_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  herd_id UUID REFERENCES dairy_herds(id) ON DELETE CASCADE,
  sample_date DATE,
  fat_content DECIMAL(5,2),
  protein_content DECIMAL(5,2),
  snf DECIMAL(5,2),
  ph DECIMAL(4,2),
  bacterial_count INTEGER,
  grade VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_milk_quality_herd ON milk_quality(herd_id, sample_date);

CREATE TABLE IF NOT EXISTS goat_herds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  herd_name VARCHAR(255),
  breed VARCHAR(100),
  goat_count INTEGER,
  location JSONB,
  farm_id UUID REFERENCES farms(id),
  average_milk_production DECIMAL(10,2),
  meat_production_target DECIMAL(10,2),
  health_status VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_goat_herds_farm ON goat_herds(farm_id);

CREATE TABLE IF NOT EXISTS sheep_flocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_name VARCHAR(255),
  breed VARCHAR(100),
  sheep_count INTEGER,
  location JSONB,
  farm_id UUID REFERENCES farms(id),
  average_wool_production DECIMAL(10,2),
  meat_production_target DECIMAL(10,2),
  health_status VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sheep_flocks_farm ON sheep_flocks(farm_id);

CREATE TABLE IF NOT EXISTS pig_herds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  herd_name VARCHAR(255),
  breed VARCHAR(100),
  pig_count INTEGER,
  location JSONB,
  farm_id UUID REFERENCES farms(id),
  average_weight_gain DECIMAL(10,2),
  meat_production_target DECIMAL(10,2),
  health_status VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pig_herds_farm ON pig_herds(farm_id);

-- ---------------------------------------------------------------------
-- M144 - Greenhouse Management
-- ---------------------------------------------------------------------
-- `greenhouses` already exists (014_horticulture_module.sql, id SERIAL,
-- farmer_id/name/location/area/greenhouse_type/construction_date/
-- temperature_control/humidity_control/irrigation_system/lighting_system/
-- current_usage/metadata/created_at/updated_at - no collision, it's the
-- only CREATE TABLE for greenhouses that predates 3017_phase4_greenhouse.sql's
-- later duplicate). Missing only `status` and `automation_config`, which
-- updateGreenhouse()/createGreenhouse() need.
ALTER TABLE greenhouses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE greenhouses ADD COLUMN IF NOT EXISTS automation_config JSONB DEFAULT '{}';

-- greenhouse_sensors/_readings/_automation_rules are genuinely new -
-- greenhouse_id is INTEGER to match greenhouses.id (SERIAL).
CREATE TABLE IF NOT EXISTS greenhouse_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
  sensor_type VARCHAR(50),
  device_id VARCHAR(255),
  sensor_id VARCHAR(255),
  location VARCHAR(255),
  calibration JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_greenhouse_sensors_gh ON greenhouse_sensors(greenhouse_id, status);
CREATE INDEX IF NOT EXISTS idx_greenhouse_sensors_device ON greenhouse_sensors(device_id);

-- fetchGreenhouseSensorData() already handles this table not existing / no
-- rows honestly (returns configured:false with a reason - see the comment
-- in M144/service.js dated 2026-08-29), but the migration exists now so
-- real IoT gateways have somewhere to write.
CREATE TABLE IF NOT EXISTS greenhouse_sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) NOT NULL,
  temperature DECIMAL(6,2),
  humidity DECIMAL(6,2),
  co2 DECIMAL(8,2),
  light_level DECIMAL(10,2),
  soil_moisture DECIMAL(6,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_greenhouse_sensor_readings_device ON greenhouse_sensor_readings(device_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS greenhouse_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
  rule_name VARCHAR(255),
  rule_type VARCHAR(50),
  trigger_condition JSONB DEFAULT '{}',
  action VARCHAR(255),
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_greenhouse_automation_rules_gh ON greenhouse_automation_rules(greenhouse_id, status);
