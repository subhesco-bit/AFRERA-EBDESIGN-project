-- FK TYPE FIX 2026-08-04: 4 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Audit System Migration
-- Comprehensive audit trail and reporting system

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: audit_logs is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- Audit Reports Table
CREATE TABLE IF NOT EXISTS audit_reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  report_name VARCHAR(255) NOT NULL,
  parameters JSONB,
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_type ON audit_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_audit_reports_generated_by ON audit_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_audit_reports_generated_at ON audit_reports(generated_at);

-- Audit Alerts Table
CREATE TABLE IF NOT EXISTS audit_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  condition JSONB NOT NULL,
  notification_channels JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_alerts_type ON audit_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_severity ON audit_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_enabled ON audit_alerts(enabled);

-- Audit Alert Log Table
CREATE TABLE IF NOT EXISTS audit_alert_log (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER REFERENCES audit_alerts(id),
  audit_log_id UUID REFERENCES audit_logs(id),
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_alert_log_alert_id ON audit_alert_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_audit_alert_log_audit_log_id ON audit_alert_log(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_audit_alert_log_triggered_at ON audit_alert_log(triggered_at);

-- Function to automatically trigger audit alerts
CREATE OR REPLACE FUNCTION trigger_audit_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_record RECORD;
BEGIN
  -- Check for matching alerts
  FOR alert_record IN 
    SELECT id FROM audit_alerts 
    WHERE enabled = true 
      AND condition::jsonb @> jsonb_build_object(
        'action', NEW.action,
        'entity_type', NEW.entity_type
      )
  LOOP
    INSERT INTO audit_alert_log (alert_id, audit_log_id, triggered_at)
    VALUES (alert_record.id, NEW.id, NOW());
    
    UPDATE audit_alerts 
    SET last_triggered_at = NOW(),
        trigger_count = trigger_count + 1
    WHERE id = alert_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit alerts
DROP TRIGGER IF EXISTS audit_alert_trigger ON audit_logs;
CREATE TRIGGER audit_alert_trigger AFTER INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_alerts();

-- Function to cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 1 year, except for critical events
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
    AND action NOT IN ('login', 'password_change', 'permission_denied');
  
  -- Delete expired reports
  DELETE FROM audit_reports
  WHERE expires_at < NOW();
  
  -- Delete old alert logs
  DELETE FROM audit_alert_log
  WHERE triggered_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Stores comprehensive audit trail of all system events';
COMMENT ON TABLE audit_reports IS 'Stores generated audit reports and their metadata';
COMMENT ON TABLE audit_alerts IS 'Stores alert configurations for automatic audit monitoring';
COMMENT ON TABLE audit_alert_log IS 'Stores triggered audit alerts and their acknowledgments';
