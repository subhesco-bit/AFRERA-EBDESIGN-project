-- Repair template for 3025_phase6_qa_compliance.sql
-- Original migration archived at: migrations/failed/3025_phase6_qa_compliance.sql.failed
-- Please inspect the archived SQL and write a corrected, idempotent migration here.

-- Original SQL (commented)
-- ==================================
-- -- Phase 6: Quality Assurance & Compliance
-- CREATE TABLE qa_inspections (id UUID PRIMARY KEY, product_id UUID, quality_score INT, result VARCHAR(50), created_at TIMESTAMP);
-- CREATE TABLE compliance_records (id UUID PRIMARY KEY, entity_id UUID, regulation_id UUID, status VARCHAR(50), created_at TIMESTAMP);
-- CREATE TABLE audit_trails (id UUID PRIMARY KEY, user_id UUID, action VARCHAR(255), resource_id UUID, timestamp TIMESTAMP);
-- CREATE TABLE certificates (id UUID PRIMARY KEY, entity_id UUID, certificate_type VARCHAR(100), expiry_date DATE, issued_at TIMESTAMP);
-- CREATE TABLE risk_assessments (id UUID PRIMARY KEY, entity_id UUID, risk_score INT, risk_level VARCHAR(50), created_at TIMESTAMP);
-- CREATE INDEX idx_qa_product ON qa_inspections(product_id);
-- CREATE INDEX idx_compliance_entity ON compliance_records(entity_id);
-- CREATE INDEX idx_audit_user ON audit_trails(user_id);
-- CREATE INDEX idx_certificates_entity ON certificates(entity_id);
-- CREATE INDEX idx_risk_entity ON risk_assessments(entity_id);
-- 

-- REWRITE YOUR MIGRATION BELOW THIS LINE
