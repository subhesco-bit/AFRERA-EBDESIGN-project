-- Phase 7: Advanced P3 Services
CREATE TABLE IF NOT EXISTS blockchain_records (id UUID PRIMARY KEY, product_id UUID, from_address VARCHAR(255), to_address VARCHAR(255), created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS iot_readings (id UUID PRIMARY KEY, sensor_id UUID, reading_value NUMERIC, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS automation_logs (id UUID PRIMARY KEY, workflow_id UUID, params JSONB, status VARCHAR(50), created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS biometric_logs (id UUID PRIMARY KEY, user_id UUID, biometric_type VARCHAR(50), verified BOOLEAN, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS video_analyses (id UUID PRIMARY KEY, video_id UUID, analysis_type VARCHAR(100), result JSONB, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS ar_experiences (id UUID PRIMARY KEY, product_id UUID, model_data JSONB, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS vr_spaces (id UUID PRIMARY KEY, space_name VARCHAR(255), space_data JSONB, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS ml_models (id UUID PRIMARY KEY, model_id UUID, training_data JSONB, accuracy NUMERIC, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS nlp_analyses (id UUID PRIMARY KEY, text TEXT, sentiment VARCHAR(50), created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS charts (id UUID PRIMARY KEY, data_id UUID, chart_type VARCHAR(100), created_at TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_blockchain_product ON blockchain_records(product_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflow ON automation_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_biometric_user ON biometric_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analysis ON video_analyses(video_id);
CREATE INDEX IF NOT EXISTS idx_ar_product ON ar_experiences(product_id);
CREATE INDEX IF NOT EXISTS idx_chart_data ON charts(data_id);

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'iot_readings' AND column_name = 'sensor_id') THEN
		CREATE INDEX IF NOT EXISTS idx_iot_sensor ON iot_readings(sensor_id);
	ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'iot_readings' AND column_name = 'device_id') THEN
		CREATE INDEX IF NOT EXISTS idx_iot_device ON iot_readings(device_id);
	END IF;
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ml_models' AND column_name = 'model_id') THEN
		CREATE INDEX IF NOT EXISTS idx_ml_model ON ml_models(model_id);
	END IF;
END $$;
