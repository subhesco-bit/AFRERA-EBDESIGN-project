-- Phase 8: Rural Services
CREATE TABLE IF NOT EXISTS village_records (id UUID PRIMARY KEY, village_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS rural_finance (id UUID PRIMARY KEY, farmer_id UUID, amount NUMERIC, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS extension_services (id UUID PRIMARY KEY, extension_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS community_records (id UUID PRIMARY KEY, community_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS rural_infrastructure (id UUID PRIMARY KEY, infrastructure_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS rural_supply_chain (id UUID PRIMARY KEY, supplier_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS rural_energy (id UUID PRIMARY KEY, energy_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS rural_health (id UUID PRIMARY KEY, health_id UUID, created_at TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_village ON village_records(village_id);
CREATE INDEX IF NOT EXISTS idx_extension ON extension_services(extension_id);

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rural_finance' AND column_name = 'farmer_id') THEN
		CREATE INDEX IF NOT EXISTS idx_rural_finance_farmer ON rural_finance(farmer_id);
	ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rural_finance' AND column_name = 'reu_id') THEN
		CREATE INDEX IF NOT EXISTS idx_rural_finance_reu ON rural_finance(reu_id);
	END IF;
END $$;
