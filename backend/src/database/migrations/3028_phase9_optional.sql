-- Phase 9: Optional Services
CREATE TABLE specialization_services (id UUID PRIMARY KEY, service_type VARCHAR(100), created_at TIMESTAMP);
CREATE TABLE advanced_integrations (id UUID PRIMARY KEY, integration_id UUID, created_at TIMESTAMP);
CREATE TABLE custom_analytics (id UUID PRIMARY KEY, analytics_id UUID, created_at TIMESTAMP);
CREATE TABLE third_party_integration (id UUID PRIMARY KEY, provider_id UUID, created_at TIMESTAMP);
CREATE TABLE mobile_services (id UUID PRIMARY KEY, mobile_id UUID, created_at TIMESTAMP);
CREATE TABLE offline_first (id UUID PRIMARY KEY, offline_id UUID, created_at TIMESTAMP);
CREATE TABLE reporting_services (id UUID PRIMARY KEY, report_id UUID, created_at TIMESTAMP);
CREATE TABLE notifications (id UUID PRIMARY KEY, notification_id UUID, created_at TIMESTAMP);
CREATE TABLE recommendations (id UUID PRIMARY KEY, recommendation_id UUID, created_at TIMESTAMP);
CREATE TABLE advanced_security (id UUID PRIMARY KEY, security_id UUID, created_at TIMESTAMP);
CREATE TABLE performance_optimization (id UUID PRIMARY KEY, performance_id UUID, created_at TIMESTAMP);
CREATE INDEX idx_specialization ON specialization_services(service_type);
