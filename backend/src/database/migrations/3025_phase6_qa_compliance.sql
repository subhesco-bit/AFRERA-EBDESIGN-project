-- Phase 6: Quality Assurance & Compliance
CREATE TABLE IF NOT EXISTS qa_inspections (id UUID PRIMARY KEY, product_id UUID, quality_score INT, result VARCHAR(50), created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS compliance_records (id UUID PRIMARY KEY, entity_id UUID, regulation_id UUID, status VARCHAR(50), created_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_trails (id UUID PRIMARY KEY, user_id UUID, action VARCHAR(255), resource_id UUID, timestamp TIMESTAMP);
CREATE TABLE IF NOT EXISTS certificates (id UUID PRIMARY KEY, entity_id UUID, certificate_type VARCHAR(100), expiry_date DATE, issued_at TIMESTAMP);
CREATE TABLE IF NOT EXISTS risk_assessments (id UUID PRIMARY KEY, entity_id UUID, risk_score INT, risk_level VARCHAR(50), created_at TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_qa_product ON qa_inspections(product_id);
CREATE INDEX IF NOT EXISTS idx_compliance_entity ON compliance_records(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_entity ON certificates(entity_id);
CREATE INDEX IF NOT EXISTS idx_risk_entity ON risk_assessments(entity_id);
