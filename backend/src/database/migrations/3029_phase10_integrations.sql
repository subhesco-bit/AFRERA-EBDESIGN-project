-- Phase 10: Integration Services
CREATE TABLE erp_integrations (id UUID PRIMARY KEY, erp_id UUID, created_at TIMESTAMP);
CREATE TABLE crm_integrations (id UUID PRIMARY KEY, crm_id UUID, created_at TIMESTAMP);
CREATE TABLE payment_gateways (id UUID PRIMARY KEY, provider_id UUID, created_at TIMESTAMP);
CREATE TABLE logistics_partners (id UUID PRIMARY KEY, logistics_id UUID, created_at TIMESTAMP);
CREATE TABLE accounting_integrations (id UUID PRIMARY KEY, accounting_id UUID, created_at TIMESTAMP);
CREATE TABLE email_services (id UUID PRIMARY KEY, email_id UUID, created_at TIMESTAMP);
CREATE TABLE sms_services (id UUID PRIMARY KEY, sms_id UUID, created_at TIMESTAMP);
CREATE TABLE whatsapp_services (id UUID PRIMARY KEY, whatsapp_id UUID, created_at TIMESTAMP);
CREATE TABLE maps_integrations (id UUID PRIMARY KEY, maps_id UUID, created_at TIMESTAMP);
CREATE TABLE webhook_endpoints (id UUID PRIMARY KEY, webhook_id UUID, created_at TIMESTAMP);
