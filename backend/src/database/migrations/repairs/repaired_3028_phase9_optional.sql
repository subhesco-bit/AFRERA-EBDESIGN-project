-- Phase 9: Optional Services
CREATE TABLE IF NOT EXISTS specialization_services (id UUID PRIMARY KEY, service_type VARCHAR(100), created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS advanced_integrations (id UUID PRIMARY KEY, integration_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS custom_analytics (id UUID PRIMARY KEY, analytics_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS third_party_integration (id UUID PRIMARY KEY, provider_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS mobile_services (id UUID PRIMARY KEY, mobile_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS offline_first (id UUID PRIMARY KEY, offline_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS reporting_services (id UUID PRIMARY KEY, report_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY, notification_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS recommendations (id UUID PRIMARY KEY, recommendation_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS advanced_security (id UUID PRIMARY KEY, security_id UUID, created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS performance_optimization (id UUID PRIMARY KEY, performance_id UUID, created_at TIMESTAMP);
CREATE INDEX idx_specialization ON specialization_services(service_type);
