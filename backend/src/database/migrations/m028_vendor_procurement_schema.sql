-- Migration M028: Vendor, Procurement & Supply Chain Operations Schema
-- System 28 - Vendor, Procurement & Supply Chain Ops
-- Created: 2026-09-08
-- Description: Database schema for vendor management, procurement operations, and supply chain optimization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- VENDOR MANAGEMENT TABLES
-- ============================================================================

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type VARCHAR(100) NOT NULL, -- manufacturer, distributor, supplier, service_provider
  business_registration VARCHAR(100),
  contact_person VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  gstin VARCHAR(15),
  pan VARCHAR(10),
  business_category VARCHAR(100),
  risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  ai_classification JSONB,
  status VARCHAR(50) DEFAULT 'pending_verification', -- pending_verification, active, suspended, terminated
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor profiles table
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  business_description TEXT,
  year_established INTEGER,
  employee_count INTEGER,
  annual_revenue DECIMAL(15,2),
  product_categories TEXT[],
  service_areas TEXT[],
  certifications TEXT[],
  quality_standards TEXT[],
  bank_details JSONB,
  payment_terms JSONB,
  delivery_capacity JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id)
);

-- Vendor certifications table
CREATE TABLE IF NOT EXISTS vendor_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  certification_name VARCHAR(255) NOT NULL,
  certification_number VARCHAR(100),
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, revoked
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor performance table
CREATE TABLE IF NOT EXISTS vendor_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  quality_score DECIMAL(3,2), -- 0.00 to 1.00
  delivery_score DECIMAL(3,2),
  pricing_score DECIMAL(3,2),
  responsiveness_score DECIMAL(3,2),
  compliance_score DECIMAL(3,2),
  overall_score DECIMAL(3,2),
  strengths JSONB,
  weaknesses JSONB,
  ai_recommendations JSONB,
  assessed_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROCUREMENT OPERATIONS TABLES
-- ============================================================================

-- Procurement requests table
CREATE TABLE IF NOT EXISTS procurement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id UUID NOT NULL,
  request_type VARCHAR(100) NOT NULL, -- direct_purchase, tender, contract, emergency
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  requested_items JSONB NOT NULL,
  budget_estimate DECIMAL(15,2),
  required_by DATE,
  delivery_location JSONB,
  specifications JSONB,
  ai_optimization JSONB,
  status VARCHAR(50) DEFAULT 'pending_approval', -- pending_approval, approved, rejected, in_progress, completed, cancelled
  requested_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Procurement approvals table
CREATE TABLE IF NOT EXISTS procurement_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  procurement_request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  approval_level VARCHAR(50) NOT NULL, -- level1, level2, level3, final
  decision VARCHAR(20) NOT NULL, -- approved, rejected, deferred
  comments TEXT,
  approved_amount DECIMAL(15,2),
  conditions JSONB,
  approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUPPLY CHAIN TABLES
-- ============================================================================

-- Supply chain nodes table
CREATE TABLE IF NOT EXISTS supply_chain_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id VARCHAR(100) UNIQUE NOT NULL,
  node_type VARCHAR(50) NOT NULL, -- manufacturer, warehouse, distributor, retailer, customer
  parent_node_id UUID REFERENCES supply_chain_nodes(id),
  organization_id UUID,
  location JSONB NOT NULL, -- {lat, lng, address}
  capacity DECIMAL(15,2),
  current_utilization DECIMAL(3,2), -- 0.00 to 1.00
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supply chain optimization table
CREATE TABLE IF NOT EXISTS supply_chain_optimization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  optimization_id VARCHAR(100) UNIQUE NOT NULL,
  supply_chain_type VARCHAR(100) NOT NULL,
  current_metrics JSONB NOT NULL,
  optimization_recommendations JSONB NOT NULL,
  expected_savings DECIMAL(15,2),
  implementation_plan JSONB,
  implementation_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  generated_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supply chain tracking table
CREATE TABLE IF NOT EXISTS supply_chain_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL,
  node_id UUID NOT NULL REFERENCES supply_chain_nodes(id),
  arrival_time TIMESTAMP,
  departure_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'in_transit', -- in_transit, arrived, departed, completed
  tracking_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vendor indexes
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_risk_level ON vendors(risk_level);
CREATE INDEX IF NOT EXISTS idx_vendors_organization ON vendors(created_by);

-- Vendor performance indexes
CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor_id ON vendor_performance(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_date ON vendor_performance(assessment_date);

-- Procurement request indexes
CREATE INDEX IF NOT EXISTS idx_procurement_requests_org ON procurement_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_status ON procurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_type ON procurement_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_priority ON procurement_requests(priority);

-- Supply chain node indexes
CREATE INDEX IF NOT EXISTS idx_supply_chain_nodes_type ON supply_chain_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_supply_chain_nodes_status ON supply_chain_nodes(status);
CREATE INDEX IF NOT EXISTS idx_supply_chain_nodes_parent ON supply_chain_nodes(parent_node_id);

-- Supply chain optimization indexes
CREATE INDEX IF NOT EXISTS idx_supply_chain_optimization_type ON supply_chain_optimization(supply_chain_type);
CREATE INDEX IF NOT EXISTS idx_supply_chain_optimization_status ON supply_chain_optimization(implementation_status);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_profiles_updated_at BEFORE UPDATE ON vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_certifications_updated_at BEFORE UPDATE ON vendor_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_performance_updated_at BEFORE UPDATE ON vendor_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procurement_requests_updated_at BEFORE UPDATE ON procurement_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supply_chain_nodes_updated_at BEFORE UPDATE ON supply_chain_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supply_chain_optimization_updated_at BEFORE UPDATE ON supply_chain_optimization
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supply_chain_tracking_updated_at BEFORE UPDATE ON supply_chain_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE vendors IS 'Vendor registration and management';
COMMENT ON TABLE vendor_profiles IS 'Detailed vendor profiles and capabilities';
COMMENT ON TABLE vendor_certifications IS 'Vendor certifications and compliance documents';
COMMENT ON TABLE vendor_performance IS 'Vendor performance evaluations and metrics';
COMMENT ON TABLE procurement_requests IS 'Procurement request management';
COMMENT ON TABLE procurement_approvals IS 'Procurement approval workflow';
COMMENT ON TABLE supply_chain_nodes IS 'Supply chain node definitions';
COMMENT ON TABLE supply_chain_optimization IS 'AI-powered supply chain optimization results';
COMMENT ON TABLE supply_chain_tracking IS 'Real-time supply chain tracking';