-- FK TYPE FIX 2026-08-04: 6 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Advanced Features Migration
-- Future-ready capabilities including AI recommendations, blockchain integration, and IoT automation

-- Smart Contracts Table
CREATE TABLE IF NOT EXISTS smart_contracts (
  id SERIAL PRIMARY KEY,
  contract_type VARCHAR(100) NOT NULL,
  parties JSONB NOT NULL,
  terms JSONB NOT NULL,
  conditions JSONB NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'deployed', 'fulfilled', 'rejected', 'expired')),
  blockchain_hash VARCHAR(66),
  execution_data JSONB,
  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smart_contracts_type ON smart_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_status ON smart_contracts(status);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_blockchain_hash ON smart_contracts(blockchain_hash);

-- IoT Devices Table
CREATE TABLE IF NOT EXISTS iot_devices (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(100) UNIQUE NOT NULL,
  device_type VARCHAR(100) NOT NULL,
  location JSONB NOT NULL,
  capabilities JSONB DEFAULT '[]',
  owner UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
  last_seen TIMESTAMP,
  battery_level DECIMAL(5, 2),
  firmware_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_type ON iot_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_iot_devices_owner ON iot_devices(owner);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);

-- IoT Readings Table
CREATE TABLE IF NOT EXISTS iot_readings (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(100) NOT NULL REFERENCES iot_devices(device_id),
  readings JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  device_status VARCHAR(50),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_iot_readings_device_id ON iot_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_readings_timestamp ON iot_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_iot_readings_processed ON iot_readings(processed);

-- IoT Automation Rules Table
CREATE TABLE IF NOT EXISTS iot_automation_rules (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(100) NOT NULL REFERENCES iot_devices(device_id),
  rule_name VARCHAR(255) NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_iot_automation_rules_device_id ON iot_automation_rules(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_automation_rules_enabled ON iot_automation_rules(enabled);

-- Demand Forecasts Table
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  region VARCHAR(255),
  timeframe VARCHAR(50) NOT NULL,
  forecast_data JSONB NOT NULL,
  accuracy DECIMAL(5, 2),
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product_id ON demand_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_region ON demand_forecasts(region);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_timeframe ON demand_forecasts(timeframe);

-- AR/VR Experiences Table
CREATE TABLE IF NOT EXISTS ar_vr_experiences (
  id SERIAL PRIMARY KEY,
  experience_type VARCHAR(100) NOT NULL,
  product_id UUID REFERENCES products(id),
  content JSONB NOT NULL,
  interactivity JSONB DEFAULT '{}',
  requirements JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ar_vr_experiences_type ON ar_vr_experiences(experience_type);
CREATE INDEX IF NOT EXISTS idx_ar_vr_experiences_product_id ON ar_vr_experiences(product_id);

-- Voice Commands Log Table
CREATE TABLE IF NOT EXISTS voice_commands (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  command TEXT NOT NULL,
  intent JSONB NOT NULL,
  result JSONB,
  confidence DECIMAL(5, 2),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_executed_at ON voice_commands(executed_at);

-- Knowledge Graph Table
CREATE TABLE IF NOT EXISTS knowledge_graph (
  id SERIAL PRIMARY KEY,
  node_id VARCHAR(100) NOT NULL,
  node_type VARCHAR(100) NOT NULL,
  properties JSONB DEFAULT '{}',
  relationships JSONB DEFAULT '[]',
  confidence DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(node_id, node_type)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_graph_node_id ON knowledge_graph(node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_node_type ON knowledge_graph(node_type);

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  module VARCHAR(100) NOT NULL,
  recommendation_type VARCHAR(100) NOT NULL,
  recommendations JSONB NOT NULL,
  context JSONB,
  algorithm VARCHAR(100),
  confidence DECIMAL(5, 2),
  clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_module ON ai_recommendations(module);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_clicked ON ai_recommendations(clicked);

-- Audit triggers
DROP TRIGGER IF EXISTS update_smart_contracts_updated_at ON smart_contracts;
CREATE TRIGGER update_smart_contracts_updated_at BEFORE UPDATE ON smart_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_iot_devices_updated_at ON iot_devices;
CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE ON iot_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_iot_automation_rules_updated_at ON iot_automation_rules;
CREATE TRIGGER update_iot_automation_rules_updated_at BEFORE UPDATE ON iot_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ar_vr_experiences_updated_at ON ar_vr_experiences;
CREATE TRIGGER update_ar_vr_experiences_updated_at BEFORE UPDATE ON ar_vr_experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_graph_updated_at ON knowledge_graph;
CREATE TRIGGER update_knowledge_graph_updated_at BEFORE UPDATE ON knowledge_graph
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically process IoT readings
CREATE OR REPLACE FUNCTION process_iot_readings()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark reading as processed
  NEW.processed = true;
  
  -- Check for automation rules
  -- This would trigger automation based on sensor readings
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS iot_reading_processor ON iot_readings;
CREATE TRIGGER iot_reading_processor AFTER INSERT ON iot_readings
  FOR EACH ROW
  EXECUTE FUNCTION process_iot_readings();

-- Function to cleanup old IoT data
CREATE OR REPLACE FUNCTION cleanup_old_iot_data()
RETURNS void AS $$
BEGIN
  -- Delete readings older than 6 months
  DELETE FROM iot_readings
  WHERE timestamp < NOW() - INTERVAL '6 months';
  
  -- Delete old voice commands
  DELETE FROM voice_commands
  WHERE executed_at < NOW() - INTERVAL '90 days';
  
  -- Delete old AI recommendations
  DELETE FROM ai_recommendations
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE smart_contracts IS 'Stores blockchain smart contracts for automated agreements';
COMMENT ON TABLE iot_devices IS 'Stores IoT device information and capabilities';
COMMENT ON TABLE iot_readings IS 'Stores sensor readings from IoT devices';
COMMENT ON TABLE iot_automation_rules IS 'Stores automation rules for IoT devices';
COMMENT ON TABLE demand_forecasts IS 'Stores AI-generated demand forecasts';
COMMENT ON TABLE ar_vr_experiences IS 'Stores AR/VR experience configurations';
COMMENT ON TABLE voice_commands IS 'Stores voice command history and execution results';
COMMENT ON TABLE knowledge_graph IS 'Stores knowledge graph for smart recommendations';
COMMENT ON TABLE ai_recommendations IS 'Stores AI-generated personalized recommendations';
