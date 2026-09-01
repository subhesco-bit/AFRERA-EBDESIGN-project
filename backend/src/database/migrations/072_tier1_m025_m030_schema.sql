-- 072_tier1_m025_m030_schema.sql
-- Schema for Devin's 30 Aug 2026 Tier 1 modules (M025-M030: Advanced Analytics,
-- Predictive Intelligence, IoT Integration, Blockchain Verification, Digital Twin,
-- Enterprise Integration). Column shapes verified against what the service code actually
-- queries (backend/src/services/{advancedAnalytics,predictiveIntelligence,iotIntegration,
-- blockchainVerification,digitalTwin,enterpriseIntegration}Service.js), not against the
-- speculative sketch in .ai/enhancements/TIER_1_COMPLETION_REPORT.md, which did not match
-- the real code. See .claude/audits/AUDIT_DB.md for the full findings this migration
-- resolves, and .ai/tasks/ACTIVE.md for what is deliberately NOT resolved here (farms,
-- harvests, and the orders/order_items/crops per-farmer-planting model referenced by
-- advancedAnalyticsService.js and predictiveIntelligenceService.js do not exist and need a
-- product decision before those two services can run - not attempted here).

-- iot_devices: iotIntegrationService.registerDevice() inserts farmer_id/specifications/
-- registered_at/last_active, none of which exist on any of this table's 3 existing
-- declarations (015_advanced_features.sql wins the CREATE; 031_iot_integration_schema.sql
-- and 3030_m030_farmer_advisory.sql are no-op'd but 031's own ALTERs still land). Adding as
-- real columns rather than renaming, since the service hardcodes these literal names in raw
-- SQL. farmer_id is UUID to match farmers.id (3030's INTEGER FK is a known-bad type, already
-- flagged deferred in schema-decisions.json - not copied here).
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES farmers(id);
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_iot_devices_farmer_id ON iot_devices(farmer_id);

-- product_custody_transactions: blockchainVerificationService.js was writing to
-- `blockchain_transactions`, which already exists (019_blockchain_traceability_schema.sql)
-- under a completely different, Ethereum-style shape (transaction_hash/block_number/
-- from_address/gas_used). The two are genuinely different concepts - one real on-chain tx
-- metadata, one an internal custody-transfer audit log - so this is a new, distinctly-named
-- table rather than a blind ALTER onto 019's table. blockchainVerificationService.js has
-- been repointed at this table (see backend/src/services/blockchainVerificationService.js).
CREATE TABLE IF NOT EXISTS product_custody_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'product_creation' | 'custody_transfer'
  transaction_data JSONB NOT NULL,
  block_height INTEGER NOT NULL,
  block_hash VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pct_transaction_type ON product_custody_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_pct_data_product_id ON product_custody_transactions ((transaction_data->>'productId'));
CREATE INDEX IF NOT EXISTS idx_pct_timestamp ON product_custody_transactions(timestamp);

-- analytics_data: generic event/metric store queried dynamically by
-- advancedAnalyticsService.buildCustomQuery(). Column/value access is whitelisted in code
-- (ANALYTICS_QUERYABLE_COLUMNS) to prevent SQL injection via caller-supplied metric names.
CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  dimensions JSONB DEFAULT '{}',
  value DECIMAL(20, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_data_metric ON analytics_data(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_data_created_at ON analytics_data(created_at);

-- iot_sensor_data: matches iotIntegrationService.js's actual INSERT/SELECT column list.
-- device_id is the business string id (e.g. 'sensor-001'), not iot_devices.id - the service
-- never looks up the surrogate integer id first. This is intentionally a separate table from
-- 031_iot_integration_schema.sql's `sensor_data` (INTEGER FK to iot_devices.id, different
-- quality semantics: 0-100 score vs this table's good/out_of_range/invalid enum) - reconciling
-- the two is flagged deferred in schema-decisions.json, not attempted here.
CREATE TABLE IF NOT EXISTS iot_sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(100) NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,
  value DECIMAL(15, 4) NOT NULL,
  unit VARCHAR(20),
  quality VARCHAR(20), -- 'good' | 'out_of_range' | 'invalid'
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_data_device_id ON iot_sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_data_timestamp ON iot_sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_data_device_type ON iot_sensor_data(device_id, sensor_type);

-- digital_twins: matches digitalTwinService.js's createFarmDigitalTwin/createCropDigitalTwin/
-- getTwinById column list. `current_state` was added (beyond the original completion-report
-- sketch) because storeTwinState() was writing computed simulation state nowhere - it only
-- bumped last_synced - silently discarding every twin sync (see AUDIT_BUGS.md finding #9).
-- digitalTwinService.js has been updated to persist into and read from this column.
-- NOTE: entity_id has no companion validated against a real `farms` table (which does not
-- exist - see AUDIT_DB.md finding #1) or a real per-entity `entity_type` link resolution for
-- IoT devices (AUDIT_DB.md finding #3, digitalTwinService.getIoTDataForEntity() still queries
-- a nonexistent iot_devices.entity_id column) - both flagged deferred, not resolved here.
CREATE TABLE IF NOT EXISTS digital_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id VARCHAR(100) UNIQUE NOT NULL,
  entity_type VARCHAR(20) NOT NULL, -- 'farm' | 'crop'
  entity_id UUID NOT NULL,
  owner_id UUID REFERENCES farmers(id),
  name VARCHAR(255),
  location JSONB,
  specifications JSONB DEFAULT '{}',
  current_state JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_digital_twins_entity ON digital_twins(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_digital_twins_owner ON digital_twins(owner_id);
CREATE INDEX IF NOT EXISTS idx_digital_twins_status ON digital_twins(status);

-- twin_simulations: matches storeSimulationResults() exactly.
CREATE TABLE IF NOT EXISTS twin_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id VARCHAR(100) NOT NULL REFERENCES digital_twins(twin_id) ON DELETE CASCADE,
  simulation_id VARCHAR(100) UNIQUE NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_twin_simulations_twin_id ON twin_simulations(twin_id);

-- enterprise_integrations: matches registerIntegration()/getIntegration() exactly.
-- api_key is base64-obfuscated by the service, NOT real encryption - flagged for the
-- security auditor, not fixed here (out of this migration's scope).
CREATE TABLE IF NOT EXISTS enterprise_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(100) UNIQUE NOT NULL,
  integration_type VARCHAR(50) NOT NULL, -- 'erp'|'payment_gateway'|'logistics'|'analytics'|'communication'
  integration_name VARCHAR(255) NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  organization_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_tested TIMESTAMP,
  deactivated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_org ON enterprise_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_type ON enterprise_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_status ON enterprise_integrations(status);

-- integration_sync_logs: matches logSyncActivity()/getRecentSyncActivity() exactly.
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(100) NOT NULL REFERENCES enterprise_integrations(integration_id) ON DELETE CASCADE,
  sync_type VARCHAR(50),
  data_type VARCHAR(100),
  sync_direction VARCHAR(20), -- 'push'|'pull'|'bidirectional'
  records_processed INTEGER DEFAULT 0,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration_id ON integration_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_created_at ON integration_sync_logs(created_at);

-- payment_records: matches storePaymentRecord() exactly. Intentionally NOT merged into the
-- existing marketplace `payments` table (000_base_schema.sql) - different owner concept,
-- these payments are not necessarily tied to a marketplace order.
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  integration_id VARCHAR(100) NOT NULL REFERENCES enterprise_integrations(integration_id),
  order_id VARCHAR(100),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_records_integration_id ON payment_records(integration_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON payment_records(order_id);
