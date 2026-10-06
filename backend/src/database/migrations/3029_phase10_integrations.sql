-- Phase 10: Integration Services
CREATE TABLE IF NOT EXISTS erp_integrations (id UUID PRIMARY KEY, erp_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS crm_integrations (id UUID PRIMARY KEY, crm_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS payment_gateways (id UUID PRIMARY KEY, provider_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS logistics_partners (id UUID PRIMARY KEY, logistics_id UUID, created_at TIMESTAMP);
-- 2026-10-05 merge-collision:logistics_partners - `logistics_partners` is already created by 042_rural_procurement_logistics_mobility_schema.sql
-- (sorts first), so the CREATE above is a no-op. Additive merge so this
-- file's indexes/FKs and its service's columns exist (nullable: rows
-- written through the other shape never populate them).
ALTER TABLE logistics_partners ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE logistics_partners ADD COLUMN IF NOT EXISTS logistics_id UUID;
ALTER TABLE logistics_partners ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_logistics_partners_id_merge ON logistics_partners(id);
CREATE TABLE IF NOT EXISTS accounting_integrations (id UUID PRIMARY KEY, accounting_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS email_services (id UUID PRIMARY KEY, email_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS sms_services (id UUID PRIMARY KEY, sms_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS whatsapp_services (id UUID PRIMARY KEY, whatsapp_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS maps_integrations (id UUID PRIMARY KEY, maps_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS webhook_endpoints (id UUID PRIMARY KEY, webhook_id UUID, created_at TIMESTAMP);
