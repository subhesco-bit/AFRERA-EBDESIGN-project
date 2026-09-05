-- Phase 8: Rural Services
CREATE TABLE village_records (id UUID PRIMARY KEY, village_id UUID, created_at TIMESTAMP);
CREATE TABLE rural_finance (id UUID PRIMARY KEY, farmer_id UUID, amount NUMERIC, created_at TIMESTAMP);
CREATE TABLE extension_services (id UUID PRIMARY KEY, extension_id UUID, created_at TIMESTAMP);
CREATE TABLE community_records (id UUID PRIMARY KEY, community_id UUID, created_at TIMESTAMP);
CREATE TABLE rural_infrastructure (id UUID PRIMARY KEY, infrastructure_id UUID, created_at TIMESTAMP);
CREATE TABLE rural_supply_chain (id UUID PRIMARY KEY, supplier_id UUID, created_at TIMESTAMP);
CREATE TABLE rural_energy (id UUID PRIMARY KEY, energy_id UUID, created_at TIMESTAMP);
CREATE TABLE rural_health (id UUID PRIMARY KEY, health_id UUID, created_at TIMESTAMP);
CREATE INDEX idx_village ON village_records(village_id);
CREATE INDEX idx_rural_finance_farmer ON rural_finance(farmer_id);
CREATE INDEX idx_extension ON extension_services(extension_id);
