-- FK TYPE FIX 2026-08-04: 7 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Offline Sync Service Tables Migration
-- for AFRERA Platform Offline Sync Service

-- Sync queue table
CREATE TABLE IF NOT EXISTS sync_queue (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_data JSONB NOT NULL,
  operation VARCHAR(20) NOT NULL,
  sync_token VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 3,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  error_message TEXT,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sync_queue_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue (status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue (priority);
CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue (entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_queue_retry ON sync_queue (next_retry_at);

-- Sync conflicts table
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  client_data JSONB NOT NULL,
  client_sync_token VARCHAR(255) NOT NULL,
  server_data JSONB NOT NULL,
  server_sync_token VARCHAR(255) NOT NULL,
  operation VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'unresolved',
  resolution VARCHAR(20),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sync_conflicts_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user ON sync_conflicts (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON sync_conflicts (status);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_entity ON sync_conflicts (entity_type, entity_id);

-- User sync preferences table
CREATE TABLE IF NOT EXISTS user_sync_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency INTEGER DEFAULT 5,
  sync_on_wifi_only BOOLEAN DEFAULT FALSE,
  sync_on_charging_only BOOLEAN DEFAULT FALSE,
  auto_sync BOOLEAN DEFAULT TRUE,
  sync_conflicts_resolution VARCHAR(20) DEFAULT 'last_write_wins',
  data_retention_days INTEGER DEFAULT 30,
  max_offline_storage_mb INTEGER DEFAULT 100,
  sync_entities JSONB DEFAULT '["orders", "products", "user_profile"]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sync_prefs_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_sync_prefs_user ON user_sync_preferences (user_id);

-- Generic entities table for unsupported entity types
CREATE TABLE IF NOT EXISTS generic_entities (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  entity_data JSONB NOT NULL,
  operation VARCHAR(20) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id)
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_generic_entities_type" does not exist.
CREATE INDEX IF NOT EXISTS idx_generic_entities_type ON generic_entities (entity_type);
CREATE INDEX IF NOT EXISTS idx_generic_entities_status ON generic_entities (sync_status);

-- Sync audit log table
CREATE TABLE IF NOT EXISTS sync_audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  sync_session_id VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  data_size_bytes INTEGER,
  processing_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sync_audit_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_sync_audit_user ON sync_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_session ON sync_audit_log (sync_session_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_action ON sync_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_sync_audit_created ON sync_audit_log (created_at);

-- Data snapshot table for offline storage
CREATE TABLE IF NOT EXISTS offline_data_snapshots (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  snapshot_data JSONB NOT NULL,
  snapshot_version VARCHAR(20),
  data_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_snapshot_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_snapshot_user ON offline_data_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_type ON offline_data_snapshots (entity_type);
CREATE INDEX IF NOT EXISTS idx_snapshot_expires ON offline_data_snapshots (expires_at);

-- Network status tracking table
CREATE TABLE IF NOT EXISTS network_status_tracking (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  connection_type VARCHAR(20),
  network_quality VARCHAR(20),
  latency_ms INTEGER,
  bandwidth_mbps DECIMAL(8,2),
  online BOOLEAN DEFAULT TRUE,
  last_online_at TIMESTAMP,
  last_offline_at TIMESTAMP,
  offline_duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_network_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_network_user ON network_status_tracking (user_id);
CREATE INDEX IF NOT EXISTS idx_network_status ON network_status_tracking (online);

-- Sync statistics table
CREATE TABLE IF NOT EXISTS sync_statistics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  total_sync_attempts INTEGER DEFAULT 0,
  successful_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  total_data_synced_bytes BIGINT DEFAULT 0,
  average_sync_time_ms INTEGER,
  conflicts_resolved INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sync_stats_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_sync_stats_user ON sync_statistics (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_stats_date ON sync_statistics (date);

-- Add offline capabilities to user profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS offline_mode_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_sync_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS offline_data_version VARCHAR(20);

-- Create function to update sync statistics
CREATE OR REPLACE FUNCTION update_sync_statistics(user_id_param INTEGER, status_param VARCHAR, data_size_param INTEGER, processing_time_param INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO sync_statistics (user_id, date, total_sync_attempts, total_data_synced_bytes, average_sync_time_ms)
  VALUES (user_id_param, CURRENT_DATE, 1, data_size_param, processing_time_param)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    total_sync_attempts = sync_statistics.total_sync_attempts + 1,
    total_data_synced_bytes = sync_statistics.total_data_synced_bytes + data_size_param,
    average_sync_time_ms = (sync_statistics.average_sync_time_ms * sync_statistics.total_sync_attempts + processing_time_param) / (sync_statistics.total_sync_attempts + 1),
    successful_syncs = CASE WHEN status_param = 'success' THEN sync_statistics.successful_syncs + 1 ELSE sync_statistics.successful_syncs END,
    failed_syncs = CASE WHEN status_param = 'failed' THEN sync_statistics.failed_syncs + 1 ELSE sync_statistics.failed_syncs END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update sync statistics
--
-- FIXED 2026-08-04: this previously read
--   EXECUTE FUNCTION update_sync_statistics(NEW.user_id, NEW.status, 0, 0);
-- which is not valid PostgreSQL. A trigger's EXECUTE FUNCTION may only pass
-- static string literals (readable via TG_ARGV) — NEW is not in scope there,
-- and the trigger function must take no arguments and RETURN TRIGGER.
-- The fix is a thin trigger wrapper that reads NEW itself and delegates to the
-- existing helper, so update_sync_statistics() stays callable directly too.
CREATE OR REPLACE FUNCTION trg_update_sync_statistics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_sync_statistics(NEW.user_id, NEW.status, 0, 0);
  RETURN NULL;   -- AFTER trigger: return value is ignored
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER has no IF NOT EXISTS, so drop first to keep this re-runnable.
DROP TRIGGER IF EXISTS trigger_update_sync_statistics ON sync_queue;
DROP TRIGGER IF EXISTS trigger_update_sync_statistics ON sync_queue;
CREATE TRIGGER trigger_update_sync_statistics AFTER INSERT OR UPDATE ON sync_queue
FOR EACH ROW
WHEN (NEW.status IN ('completed', 'failed'))
EXECUTE FUNCTION trg_update_sync_statistics();

-- Create function to clean up old offline data
CREATE OR REPLACE FUNCTION cleanup_old_offline_data()
RETURNS VOID AS $$
BEGIN
  DELETE FROM offline_data_snapshots WHERE expires_at < NOW();
  DELETE FROM sync_queue WHERE created_at < NOW() - INTERVAL '30 days' AND status = 'completed';
  DELETE FROM sync_audit_log WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- CREATE INDEX IF NOT EXISTS for periodic cleanup
CREATE INDEX IF NOT EXISTS idx_sync_queue_cleanup ON sync_queue(created_at) WHERE status = 'completed';

-- Add user preferences for offline storage management
ALTER TABLE user_sync_preferences
ADD COLUMN IF NOT EXISTS storage_optimization_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS compress_offline_data BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS background_sync_enabled BOOLEAN DEFAULT TRUE;