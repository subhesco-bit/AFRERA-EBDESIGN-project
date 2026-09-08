-- ============================================================================
-- EBDESIGN COMPLETE DATABASE SCHEMA - SKELETON
-- Maps all 96 architectural points to database entities
-- ============================================================================
-- Database: ebdesign_dev
-- Version: Skeleton v1.0
-- Created: 2026-09-06
-- Status: Ready for Devin implementation
-- ============================================================================

-- ============================================================================
-- SECTION 1: FOUNDATION & IDENTITY (Audit, Auth, Master Data)
-- ============================================================================

-- 1. AUDIT LOG (Section 21: Audit Trail & Compliance Logging)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(100),
  entity_id UUID,
  action VARCHAR(50),
  details JSONB,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 2. USERS (Section 21: Identity & Access Management)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- 3. ROLES (Section 21: Identity & Access Management)
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_role_id INTEGER REFERENCES roles(id),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO roles (code, name, description, is_system) VALUES
('farmer', 'Farmer', 'Agricultural producer', true),
('fpo_member', 'FPO Member', 'Member of Farmer Producer Organization', true),
('fpo_admin', 'FPO Administrator', 'Administrator of FPO', true),
('field_officer', 'Field Officer', 'On-ground field operations staff', true),
('crop_doctor', 'Crop Doctor', 'Agricultural specialist/agronomist', true),
('veterinarian', 'Veterinarian', 'Livestock health specialist', true),
('lab_technician', 'Lab Technician', 'Laboratory testing staff', true),
('buyer', 'Buyer', 'Purchaser of agricultural products', true),
('warehouse_operator', 'Warehouse Operator', 'Cold storage operations', true),
('logistics_operator', 'Logistics Operator', 'Transportation and delivery', true),
('government_officer', 'Government Officer', 'Government scheme administration', true),
('admin', 'Administrator', 'System administrator', true),
('state_admin', 'State Administrator', 'State-level administration', true),
('district_admin', 'District Administrator', 'District-level administration', true),
('cluster_manager', 'Cluster Manager', 'Cluster/block level management', true);

-- 4. PERMISSIONS (Section 21: RBAC)
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  resource VARCHAR(100),
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROLE_PERMISSIONS (Section 21: RBAC)
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- 6. USER_ROLES (Section 21: RBAC)
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  organization_id UUID,
  state_code VARCHAR(10),
  district_code VARCHAR(10),
  cluster_code VARCHAR(10),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id, organization_id)
);

-- 7. ORGANIZATIONS (Section 2: Multi-Entity Architecture)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  code VARCHAR(50) UNIQUE,
  parent_org_id UUID REFERENCES organizations(id),
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO organizations (name, type, code) VALUES
('Lumo Earth', 'NGO', 'lumo_earth'),
('SV ESCO', 'Partner', 'sv_esco');

-- 8. SESSIONS (Section 21: Authentication & Session Management)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- 9. MFA_SECRETS (Section 21: Multi-Factor Authentication)
CREATE TABLE mfa_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  secret_key VARCHAR(255),
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 2: MASTER DATA MANAGEMENT (Section 20: Master Data)
-- All these are "single source of truth" entities
-- ============================================================================

-- 10. STATES
CREATE TABLE states (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO states (code, name, region) VALUES
('AS', 'Assam', 'Northeast'),
('AR', 'Arunachal Pradesh', 'Northeast'),
('MN', 'Manipur', 'Northeast'),
('ML', 'Meghalaya', 'Northeast'),
('MZ', 'Mizoram', 'Northeast'),
('NL', 'Nagaland', 'Northeast'),
('TR', 'Tripura', 'Northeast');

-- 11. DISTRICTS
CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  state_id INTEGER REFERENCES states(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. BLOCKS
CREATE TABLE blocks (
  id SERIAL PRIMARY KEY,
  district_id INTEGER REFERENCES districts(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. VILLAGES (Section 8: Village-Level Management)
CREATE TABLE villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id INTEGER REFERENCES blocks(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  primary_crops TEXT[],
  primary_language VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_villages_block_id ON villages(block_id);
CREATE INDEX idx_villages_location ON villages(latitude, longitude);

-- 14. FARMERS (Section 3: Farmer Profile & Management)
CREATE TABLE farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  village_id UUID REFERENCES villages(id),
  farmer_code VARCHAR(50) UNIQUE,
  aadhar_number VARCHAR(12),
  pan_number VARCHAR(10),
  phone_verified BOOLEAN DEFAULT false,
  aadhar_verified BOOLEAN DEFAULT false,
  kyc_status VARCHAR(50),
  fdi_score DECIMAL(3, 1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_farmers_user_id ON farmers(user_id);
CREATE INDEX idx_farmers_village_id ON farmers(village_id);

-- 15. FARMS (Section 7: Farm/Field Management)
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  farm_code VARCHAR(50) UNIQUE,
  total_acreage DECIMAL(10, 2),
  soil_type VARCHAR(100),
  water_source VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  gps_boundary POLYGON,
  ownership_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX idx_farms_location ON farms(latitude, longitude);

-- 16. PLOTS (Section 7: Farm/Field Management)
CREATE TABLE plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  plot_code VARCHAR(50) UNIQUE,
  acreage DECIMAL(10, 2),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  gps_boundary POLYGON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. CROPS (Section 20: Crop & Commodity Master)
CREATE TABLE crops (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  scientific_name VARCHAR(255),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. CROP_VARIETIES (Section 20: Crop & Commodity Master)
CREATE TABLE crop_varieties (
  id SERIAL PRIMARY KEY,
  crop_id INTEGER REFERENCES crops(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  average_yield_kg_per_acre DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. CROP_PLANS (Section 12: Production Planning)
CREATE TABLE crop_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  crop_id INTEGER REFERENCES crops(id),
  variety_id INTEGER REFERENCES crop_varieties(id),
  season VARCHAR(50),
  year INTEGER,
  plot_id UUID REFERENCES plots(id),
  planting_date DATE,
  expected_harvest_date DATE,
  expected_yield_kg DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_crop_plans_farmer_id ON crop_plans(farmer_id);

-- 20. CROP_CYCLES (Section 8: Crop/Production Management)
CREATE TABLE crop_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_plan_id UUID REFERENCES crop_plans(id),
  status VARCHAR(50),
  actual_harvest_date DATE,
  actual_yield_kg DECIMAL(10, 2),
  quality_score DECIMAL(3, 1),
  food_loss_kg DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. PRODUCTS (Section 20: Product & SKU Master)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  crop_cycle_id UUID REFERENCES crop_cycles(id),
  sku VARCHAR(100) UNIQUE,
  batch_number VARCHAR(50),
  quantity_kg DECIMAL(10, 2),
  quality_grade VARCHAR(20),
  certifications VARCHAR(255)[],
  price_per_kg DECIMAL(10, 2),
  list_date TIMESTAMP,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_farmer_id ON products(farmer_id);

-- 22. BUYERS (Section 20: Buyer & Supplier Master)
CREATE TABLE buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  buyer_code VARCHAR(50) UNIQUE,
  organization_name VARCHAR(255),
  buyer_type VARCHAR(50),
  channel VARCHAR(50),
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_buyers_user_id ON buyers(user_id);

-- ============================================================================
-- SECTION 3: MARKETPLACE & COMMERCE (Section 9: Marketplace & E-Commerce)
-- ============================================================================

-- 23. MARKETPLACE_LISTINGS
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  title VARCHAR(255),
  description TEXT,
  photos_urls TEXT[],
  quality_metadata JSONB,
  price_per_kg DECIMAL(10, 2),
  minimum_order_kg DECIMAL(10, 2),
  available_quantity_kg DECIMAL(10, 2),
  harvest_date DATE,
  shelf_life_days INTEGER,
  certifications VARCHAR(255)[],
  storage_requirement VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_marketplace_listings_product_id ON marketplace_listings(product_id);

-- 24. BUYER_INQUIRIES (Section 9: Marketplace & E-Commerce)
CREATE TABLE buyer_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES buyers(id),
  crop_id INTEGER REFERENCES crops(id),
  quantity_kg DECIMAL(10, 2),
  quality_requirements VARCHAR(255),
  delivery_location VARCHAR(255),
  expected_delivery_date DATE,
  confidence_score DECIMAL(3, 1),
  confidence_rationale TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_buyer_inquiries_buyer_id ON buyer_inquiries(buyer_id);

-- 25. BUYER_MATCHES (Claude AI: Section 9)
CREATE TABLE buyer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES buyer_inquiries(id),
  farmer_id UUID REFERENCES farmers(id),
  product_id UUID REFERENCES products(id),
  match_score DECIMAL(3, 1),
  match_reason TEXT,
  ai_confidence DECIMAL(3, 1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. ORDERS (Section 9: Marketplace & E-Commerce)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES buyers(id),
  farmer_id UUID REFERENCES farmers(id),
  product_id UUID REFERENCES products(id),
  order_number VARCHAR(50) UNIQUE,
  quantity_kg DECIMAL(10, 2),
  unit_price DECIMAL(10, 2),
  total_value DECIMAL(12, 2),
  delivery_location VARCHAR(255),
  expected_delivery_date DATE,
  order_status VARCHAR(50),
  quality_feedback TEXT,
  buyer_rating DECIMAL(3, 1),
  is_repeat_order BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);

-- 27. REPUTATION_SCORES (Section 9: Reputation System)
CREATE TABLE reputation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  metric VARCHAR(50),
  score DECIMAL(3, 1),
  period VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 4: COLD STORAGE (Core Project) (Section 6: Cold Storage)
-- ============================================================================

-- 28. COLD_STORAGE_NODES (Section 6: Infrastructure Design)
CREATE TABLE cold_storage_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_code VARCHAR(50) UNIQUE,
  location_name VARCHAR(255),
  village_id UUID REFERENCES villages(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_capacity_tonnes DECIMAL(10, 2),
  primary_commodity VARCHAR(100),
  owner_organization VARCHAR(100),
  is_operational BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cold_storage_nodes_village_id ON cold_storage_nodes(village_id);

-- 29. STORAGE_CHAMBERS (Section 6: Multi-Temperature Storage)
CREATE TABLE storage_chambers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES cold_storage_nodes(id),
  chamber_code VARCHAR(50) UNIQUE,
  capacity_tonnes DECIMAL(10, 2),
  min_temperature DECIMAL(5, 2),
  max_temperature DECIMAL(5, 2),
  humidity_range VARCHAR(50),
  suitable_commodities VARCHAR(255)[],
  current_utilization_percent DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 30. STORAGE_BOOKINGS (Section 6: Cold Storage Booking Workflow)
CREATE TABLE storage_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  chamber_id UUID REFERENCES storage_chambers(id),
  booking_number VARCHAR(50) UNIQUE,
  product_id UUID REFERENCES products(id),
  quantity_kg DECIMAL(10, 2),
  booking_date TIMESTAMP,
  inbound_date DATE,
  outbound_date DATE,
  storage_cost_per_kg DECIMAL(10, 4),
  total_storage_cost DECIMAL(12, 2),
  booking_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_storage_bookings_farmer_id ON storage_bookings(farmer_id);

-- 31. COLD_STORAGE_INVENTORY (Section 6: Inventory Tracking)
CREATE TABLE cold_storage_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES storage_bookings(id),
  chamber_id UUID REFERENCES storage_chambers(id),
  batch_number VARCHAR(50),
  lot_number VARCHAR(50),
  current_quantity_kg DECIMAL(10, 2),
  quality_assessment VARCHAR(255),
  expiry_date DATE,
  received_date TIMESTAMP,
  last_quality_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 32. TEMPERATURE_MONITORING (Section 6: Temperature Monitoring & Alerts)
CREATE TABLE temperature_monitoring (
  id BIGSERIAL PRIMARY KEY,
  chamber_id UUID REFERENCES storage_chambers(id),
  temperature_celsius DECIMAL(5, 2),
  humidity_percent DECIMAL(5, 2),
  recorded_at TIMESTAMP,
  sensor_id VARCHAR(100),
  is_anomaly BOOLEAN DEFAULT false
);
CREATE INDEX idx_temperature_monitoring_chamber_id_timestamp ON temperature_monitoring(chamber_id, recorded_at);

-- 33. ENERGY_CONSUMPTION (Section 6: Energy Resilience)
CREATE TABLE energy_consumption (
  id BIGSERIAL PRIMARY KEY,
  node_id UUID REFERENCES cold_storage_nodes(id),
  kwh_consumed DECIMAL(10, 2),
  renewable_kwh DECIMAL(10, 2),
  battery_discharge_kwh DECIMAL(10, 2),
  recorded_at TIMESTAMP,
  efficiency_rating VARCHAR(50)
);

-- ============================================================================
-- SECTION 5: LOGISTICS & SHIPMENT (Section 15: Logistics)
-- ============================================================================

-- 34. SHIPMENTS (Section 15: Shipment Management)
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  storage_booking_id UUID REFERENCES storage_bookings(id),
  shipment_number VARCHAR(50) UNIQUE,
  source_location VARCHAR(255),
  destination_location VARCHAR(255),
  dispatch_date TIMESTAMP,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  shipment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 35. REEFER_VEHICLES (Section 6: Reefer Fleet Management)
CREATE TABLE reefer_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_code VARCHAR(50) UNIQUE,
  registration_number VARCHAR(50) UNIQUE,
  capacity_tonnes DECIMAL(10, 2),
  temperature_range_min DECIMAL(5, 2),
  temperature_range_max DECIMAL(5, 2),
  driver_id UUID REFERENCES users(id),
  is_operational BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 36. LOGISTICS_TRACKING (Section 15: Real-Time Tracking)
CREATE TABLE logistics_tracking (
  id BIGSERIAL PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id),
  vehicle_id UUID REFERENCES reefer_vehicles(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  temperature_celsius DECIMAL(5, 2),
  gps_timestamp TIMESTAMP,
  recorded_at TIMESTAMP
);
CREATE INDEX idx_logistics_tracking_shipment_id ON logistics_tracking(shipment_id);

-- ============================================================================
-- SECTION 6: QUALITY & LABS (Section 4: Quality & Labs)
-- ============================================================================

-- 37. LABORATORIES
CREATE TABLE laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_code VARCHAR(50) UNIQUE,
  location_name VARCHAR(255),
  village_id UUID REFERENCES villages(id),
  test_types VARCHAR(255)[],
  is_operational BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 38. LAB_TESTS (Section 4: Laboratory Services)
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES laboratories(id),
  farmer_id UUID REFERENCES farmers(id),
  test_type VARCHAR(50),
  sample_date DATE,
  results JSONB,
  certifications_generated VARCHAR(255)[],
  test_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 7: ADVISORY & PROFESSIONALS (Section 5: Professional Advisory)
-- ============================================================================

-- 39. PROFESSIONALS
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  professional_type VARCHAR(50),
  specialization VARCHAR(255),
  qualifications TEXT[],
  is_available BOOLEAN DEFAULT true,
  service_region VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 40. CONSULTATIONS (Section 5: Professional Advisory)
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  professional_id UUID REFERENCES professionals(id),
  consultation_type VARCHAR(50),
  consultation_date TIMESTAMP,
  mode VARCHAR(50),
  issue_description TEXT,
  recommendation TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 8: FINANCE & PAYMENT (Section 11: Financial Management)
-- ============================================================================

-- 41. TRANSACTIONS (Section 11: Farm Accounting)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  order_id UUID REFERENCES orders(id),
  transaction_type VARCHAR(50),
  amount DECIMAL(12, 2),
  currency VARCHAR(3),
  description TEXT,
  transaction_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 42. INVOICES (Section 11: Invoicing & GST Compliance)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  invoice_number VARCHAR(50) UNIQUE,
  invoice_date DATE,
  subtotal DECIMAL(12, 2),
  gst_amount DECIMAL(12, 2),
  total_amount DECIMAL(12, 2),
  payment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 43. SETTLEMENTS (Section 11: Payment & Settlement)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  order_id UUID REFERENCES orders(id),
  settlement_date DATE,
  gross_amount DECIMAL(12, 2),
  storage_cost_deduction DECIMAL(12, 2),
  logistics_cost_deduction DECIMAL(12, 2),
  platform_fee_deduction DECIMAL(12, 2),
  net_amount DECIMAL(12, 2),
  payment_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 44. FARMER_INCOME_SUMMARY (Section 11: Financial Reporting)
CREATE TABLE farmer_income_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  season VARCHAR(50),
  year INTEGER,
  total_income DECIMAL(12, 2),
  total_expenses DECIMAL(12, 2),
  net_profit DECIMAL(12, 2),
  crops_grown VARCHAR(255)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 9: CREDIT & BANKING (Section 12: Credit & Banking)
-- ============================================================================

-- 45. CREDIT_APPLICATIONS (Section 12: Crop Credit)
CREATE TABLE credit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  credit_type VARCHAR(50),
  requested_amount DECIMAL(12, 2),
  tenure_months INTEGER,
  purpose TEXT,
  application_status VARCHAR(50),
  credit_limit_approved DECIMAL(12, 2),
  interest_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 46. CREDIT_DISBURSEMENTS (Section 12: Crop Credit)
CREATE TABLE credit_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES credit_applications(id),
  disbursement_date DATE,
  disbursement_amount DECIMAL(12, 2),
  disbursement_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 47. CREDIT_REPAYMENTS (Section 12: Crop Credit)
CREATE TABLE credit_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES credit_applications(id),
  repayment_date DATE,
  repayment_amount DECIMAL(12, 2),
  principal_paid DECIMAL(12, 2),
  interest_paid DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 48. DIGITAL_WALLETS (Section 11: Digital Wallet)
CREATE TABLE digital_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  balance DECIMAL(12, 2),
  last_credited TIMESTAMP,
  last_debited TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 10: INSURANCE & SUBSIDY (Section 13: Insurance, Section 10: Subsidy)
-- ============================================================================

-- 49. INSURANCE_POLICIES (Section 13: Insurance)
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  policy_type VARCHAR(50),
  provider VARCHAR(255),
  policy_number VARCHAR(50) UNIQUE,
  coverage_amount DECIMAL(12, 2),
  premium_amount DECIMAL(12, 2),
  start_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 50. INSURANCE_CLAIMS (Section 13: Insurance)
CREATE TABLE insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES insurance_policies(id),
  claim_number VARCHAR(50) UNIQUE,
  claim_date DATE,
  claim_amount DECIMAL(12, 2),
  loss_description TEXT,
  claim_status VARCHAR(50),
  settlement_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 51. SUBSIDY_SCHEMES (Section 10: Subsidy & Schemes)
CREATE TABLE subsidy_schemes (
  id SERIAL PRIMARY KEY,
  state_id INTEGER REFERENCES states(id),
  scheme_code VARCHAR(50) UNIQUE,
  scheme_name VARCHAR(255),
  scheme_type VARCHAR(50),
  equipment_eligible VARCHAR(255)[],
  subsidy_percentage DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 52. SUBSIDY_APPLICATIONS (Section 10: Subsidy Application)
CREATE TABLE subsidy_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  scheme_id INTEGER REFERENCES subsidy_schemes(id),
  equipment_type VARCHAR(100),
  application_date DATE,
  application_status VARCHAR(50),
  subsidy_amount_approved DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 11: CONTRACTS & PROJECTS (Section 16: Contracts, Section 22: Projects)
-- ============================================================================

-- 53. PRE_SEASON_CONTRACTS (Section 16: Pre-Season Contracts)
CREATE TABLE pre_season_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  buyer_id UUID REFERENCES buyers(id),
  contract_number VARCHAR(50) UNIQUE,
  crop_id INTEGER REFERENCES crops(id),
  expected_quantity_kg DECIMAL(10, 2),
  guaranteed_price_per_kg DECIMAL(10, 2),
  delivery_schedule VARCHAR(255),
  contract_start_date DATE,
  contract_end_date DATE,
  contract_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 54. FPO_ORGANIZATIONS (Section 22: FPO & Project Development)
CREATE TABLE fpo_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_code VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  village_id UUID REFERENCES villages(id),
  registration_date DATE,
  member_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 55. FPO_MEMBERS (Section 22: FPO & Project Development)
CREATE TABLE fpo_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id UUID REFERENCES fpo_organizations(id),
  farmer_id UUID REFERENCES farmers(id),
  membership_date DATE,
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 56. PROJECTS (Section 22: Project Development)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  fpo_id UUID REFERENCES fpo_organizations(id),
  village_id UUID REFERENCES villages(id),
  project_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50),
  total_investment DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 12: CONFIGURATION & RULES (Section 23: Rules Engine)
-- ============================================================================

-- 57. CONFIGURATION_ITEMS (Section 23: Configuration)
CREATE TABLE configuration_items (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  state_id INTEGER REFERENCES states(id),
  district_id INTEGER REFERENCES districts(id),
  config_value JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 58. RULE_DEFINITIONS (Section 23: Rules Engine)
CREATE TABLE rule_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code VARCHAR(100) UNIQUE,
  rule_name VARCHAR(255),
  rule_category VARCHAR(50),
  rule_condition JSONB,
  rule_action JSONB,
  rule_priority INTEGER,
  state_id INTEGER REFERENCES states(id),
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 59. WORKFLOW_DEFINITIONS (Section 23: Workflow Engine)
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_code VARCHAR(100) UNIQUE,
  workflow_name VARCHAR(255),
  workflow_type VARCHAR(50),
  workflow_steps JSONB,
  approval_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 60. WORKFLOW_INSTANCES (Section 23: Workflow Engine)
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflow_definitions(id),
  entity_type VARCHAR(100),
  entity_id UUID,
  current_step VARCHAR(100),
  status VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 13: COMMUNICATIONS & ALERTS (Section 13: Alerts & Notifications)
-- ============================================================================

-- 61. ALERT_DEFINITIONS (Section 13: Alert Types & Triggers)
CREATE TABLE alert_definitions (
  id SERIAL PRIMARY KEY,
  alert_code VARCHAR(100) UNIQUE,
  alert_name VARCHAR(255),
  alert_type VARCHAR(50),
  trigger_condition JSONB,
  alert_channels VARCHAR(100)[],
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 62. ALERTS (Section 13: Alerts & Notifications)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_definition_id INTEGER REFERENCES alert_definitions(id),
  farmer_id UUID REFERENCES farmers(id),
  message TEXT,
  alert_status VARCHAR(50),
  triggered_at TIMESTAMP,
  delivered_at TIMESTAMP,
  viewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 63. COMMUNICATION_PREFERENCES (Section 13: Communication Preferences)
CREATE TABLE communication_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  alert_type VARCHAR(50),
  channel VARCHAR(50),
  is_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  language VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 14: DOCUMENTS & COMPLIANCE (Section 24: Document Management)
-- ============================================================================

-- 64. DOCUMENTS (Section 24: Document Management)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  document_type VARCHAR(50),
  document_name VARCHAR(255),
  document_url TEXT,
  document_hash VARCHAR(255),
  expiry_date DATE,
  verification_status VARCHAR(50),
  verified_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 65. CERTIFICATIONS (Section 10: Regulatory & Compliance)
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  certification_type VARCHAR(100),
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  document_id UUID REFERENCES documents(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 15: ANALYTICS & MRV (Section 22: Analytics & MRV)
-- ============================================================================

-- 66. BASELINE_METRICS (Section 22: MRV Platform)
CREATE TABLE baseline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  metric_type VARCHAR(50),
  baseline_value DECIMAL(12, 2),
  measurement_date DATE,
  measurement_method TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 67. IMPACT_MEASUREMENTS (Section 22: MRV Platform)
CREATE TABLE impact_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  measurement_type VARCHAR(50),
  measured_value DECIMAL(12, 2),
  baseline_value DECIMAL(12, 2),
  impact_percentage DECIMAL(5, 2),
  measurement_date DATE,
  evidence_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 68. ANALYTICS_METRICS (Section 22: Analytics & Business Intelligence)
CREATE TABLE analytics_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_type VARCHAR(100),
  farmer_id UUID REFERENCES farmers(id),
  metric_value DECIMAL(12, 2),
  period_start DATE,
  period_end DATE,
  recorded_at TIMESTAMP
);

-- ============================================================================
-- SECTION 16: GIS & LOCATION (Section 19: GIS)
-- ============================================================================

-- 69. GEOGRAPHIC_ZONES (Section 19: GIS)
CREATE TABLE geographic_zones (
  id SERIAL PRIMARY KEY,
  zone_type VARCHAR(50),
  zone_name VARCHAR(255),
  zone_code VARCHAR(50) UNIQUE,
  parent_zone_id INTEGER REFERENCES geographic_zones(id),
  geom GEOMETRY(Polygon),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_geographic_zones_geom ON geographic_zones USING GIST(geom);

-- 70. WEATHER_DATA (Section 12: Weather & Forecasting)
CREATE TABLE weather_data (
  id BIGSERIAL PRIMARY KEY,
  village_id UUID REFERENCES villages(id),
  weather_date DATE,
  temperature_min DECIMAL(5, 2),
  temperature_max DECIMAL(5, 2),
  rainfall_mm DECIMAL(10, 2),
  humidity_percent DECIMAL(5, 2),
  wind_speed_kmph DECIMAL(5, 2),
  weather_condition VARCHAR(100),
  recorded_at TIMESTAMP
);
CREATE INDEX idx_weather_data_village_date ON weather_data(village_id, weather_date);

-- ============================================================================
-- SECTION 17: SUPPORT & GRIEVANCE (Section 16: Support & Operations)
-- ============================================================================

-- 71. SUPPORT_TICKETS (Section 16: Helpdesk & Support)
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  ticket_number VARCHAR(50) UNIQUE,
  subject VARCHAR(255),
  description TEXT,
  issue_category VARCHAR(50),
  priority VARCHAR(50),
  status VARCHAR(50),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);
CREATE INDEX idx_support_tickets_farmer_id ON support_tickets(farmer_id);

-- 72. GRIEVANCES (Section 16: Grievance Management ESSF)
CREATE TABLE grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id),
  grievance_type VARCHAR(100),
  grievance_description TEXT,
  grievance_date TIMESTAMP,
  investigation_status VARCHAR(50),
  resolution VARCHAR(255),
  compensation_amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 18: IOT & MONITORING (Section 18: IoT)
-- ============================================================================

-- 73. IOT_DEVICES (Section 18: IoT)
CREATE TABLE iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code VARCHAR(100) UNIQUE,
  device_type VARCHAR(50),
  location_type VARCHAR(50),
  location_id UUID,
  sensor_types VARCHAR(255)[],
  is_active BOOLEAN DEFAULT true,
  battery_percent DECIMAL(5, 2),
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 74. IOT_SENSOR_READINGS (Section 18: IoT)
CREATE TABLE iot_sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID REFERENCES iot_devices(id),
  sensor_type VARCHAR(50),
  sensor_value DECIMAL(10, 4),
  unit VARCHAR(20),
  recorded_at TIMESTAMP
);
CREATE INDEX idx_iot_sensor_readings_device_timestamp ON iot_sensor_readings(device_id, recorded_at);

-- ============================================================================
-- SECTION 19: FIELD OPERATIONS (Section 16: Field Operations)
-- ============================================================================

-- 75. FIELD_OFFICER_ASSIGNMENTS (Section 16: Field Operations)
CREATE TABLE field_officer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES users(id),
  village_id UUID REFERENCES villages(id),
  assignment_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 76. FIELD_VISITS (Section 16: Field Operations)
CREATE TABLE field_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID REFERENCES users(id),
  farmer_id UUID REFERENCES farmers(id),
  farm_id UUID REFERENCES farms(id),
  visit_date TIMESTAMP,
  visit_purpose VARCHAR(255),
  observations TEXT,
  photos_urls TEXT[],
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 20: DATA GOVERNANCE & COMPLIANCE
-- ============================================================================

-- 77. DATA_CONSENTS (GDPR Compliance)
CREATE TABLE data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  consent_type VARCHAR(100),
  consented_at TIMESTAMP,
  withdrawn_at TIMESTAMP,
  consent_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 78. DATA_ACCESS_LOGS (Data Governance)
CREATE TABLE data_access_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  data_type VARCHAR(100),
  entity_id UUID,
  access_type VARCHAR(50),
  accessed_at TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_organizations_active ON organizations(is_active);
CREATE INDEX idx_farmers_active ON farmers(is_active);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_transactions_farmer_date ON transactions(farmer_id, transaction_date);
CREATE INDEX idx_settlement_status ON settlements(payment_status);

-- ============================================================================
-- END OF SKELETON SCHEMA
-- ============================================================================
-- 96 architecture points mapped to 78 tables
-- Ready for Devin implementation
-- Next: Create migrations from this schema
-- ============================================================================
