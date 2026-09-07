-- Phase 2: Product Certification Schema
CREATE TABLE product_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  certification_type VARCHAR(100) NOT NULL,
  certificate_number VARCHAR(255),
  issuer VARCHAR(255),
  issued_date DATE,
  valid_until DATE,
  verification_status VARCHAR(50) DEFAULT 'pending',
  revocation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certification_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number VARCHAR(255) UNIQUE,
  certification_type VARCHAR(100),
  issuer VARCHAR(255),
  issued_date DATE,
  valid_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_certs_product ON product_certifications(product_id);
CREATE INDEX idx_product_certs_type ON product_certifications(certification_type);
CREATE INDEX idx_registry_number ON certification_registry(certificate_number);
