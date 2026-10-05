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
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 2. USERS (Section 21: Identity & Access Management)
CREATE TABLE IF NOT EXISTS users (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 3. ROLES (Section 21: Identity & Access Management)
CREATE TABLE IF NOT EXISTS roles (
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
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  resource VARCHAR(100),
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROLE_PERMISSIONS (Section 21: RBAC)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id),
  permission_id INTEGER REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- 6. USER_ROLES (Section 21: RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
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
CREATE TABLE IF NOT EXISTS organizations (
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
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 9. MFA_SECRETS (Section 21: Multi-Factor Authentication)
CREATE TABLE IF NOT EXISTS mfa_secrets (
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
CREATE TABLE IF NOT EXISTS states (
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
CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  state_id INTEGER REFERENCES states(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. BLOCKS
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  district_id INTEGER REFERENCES districts(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. VILLAGES (Section 8: Village-Level Management)
CREATE TABLE IF NOT EXISTS villages (
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
CREATE INDEX IF NOT EXISTS idx_villages_block_id ON villages(block_id);
CREATE INDEX IF NOT EXISTS idx_villages_location ON villages(latitude, longitude);

-- 14. FARMERS (Section 3: Farmer Profile & Management)
CREATE TABLE IF NOT EXISTS farmers (
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
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_village_id ON farmers(village_id);

-- 15. FARMS (Section 7: Farm/Field Management)
CREATE TABLE IF NOT EXISTS farms (
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
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farms_location ON farms(latitude, longitude);

-- 16. PLOTS (Section 7: Farm/Field Management)
CREATE TABLE IF NOT EXISTS plots (
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
CREATE TABLE IF NOT EXISTS crops (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  scientific_name VARCHAR(255),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. CROP_VARIETIES (Section 20: Crop & Commodity Master)
CREATE TABLE IF NOT EXISTS crop_varieties (
  id SERIAL PRIMARY KEY,
  crop_id INTEGER REFERENCES crops(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  average_yield_kg_per_acre DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. CROP_PLANS (Section 12: Production Planning)
CREATE TABLE IF NOT EXISTS crop_plans (
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
CREATE INDEX IF NOT EXISTS idx_crop_plans_farmer_id ON crop_plans(farmer_id);

-- 20. CROP_CYCLES (Section 8: Crop/Production Management)
CREATE TABLE IF NOT EXISTS crop_cycles (
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
CREATE TABLE IF NOT EXISTS products (
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
CREATE INDEX IF NOT EXISTS idx_products_farmer_id ON products(farmer_id);

-- 22. BUYERS (Section 20: Buyer & Supplier Master)
CREATE TABLE IF NOT EXISTS buyers (
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
CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);

-- ============================================================================
-- SECTION 3: MARKETPLACE & COMMERCE (Section 9: Marketplace & E-Commerce)
-- ============================================================================

-- 23. MARKETPLACE_LISTINGS
CREATE TABLE IF NOT EXISTS marketplace_listings (
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
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_product_id ON marketplace_listings(product_id);

-- 24. BUYER_INQUIRIES (Section 9: Marketplace & E-Commerce)
CREATE TABLE IF NOT EXISTS buyer_inquiries (
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
CREATE INDEX IF NOT EXISTS idx_buyer_inquiries_buyer_id ON buyer_inquiries(buyer_id);

-- 25. BUYER_MATCHES (Claude AI: Section 9)
CREATE TABLE IF NOT EXISTS buyer_matches (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON orders(farmer_id);

-- 27. REPUTATION_SCORES (Section 9: Reputation System)
CREATE TABLE IF NOT EXISTS reputation_scores (
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
CREATE TABLE IF NOT EXISTS cold_storage_nodes (
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
CREATE INDEX IF NOT EXISTS idx_cold_storage_nodes_village_id ON cold_storage_nodes(village_id);

-- 29. STORAGE_CHAMBERS (Section 6: Multi-Temperature Storage)
CREATE TABLE IF NOT EXISTS storage_chambers (
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
CREATE TABLE IF NOT EXISTS storage_bookings (
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
CREATE INDEX IF NOT EXISTS idx_storage_bookings_farmer_id ON storage_bookings(farmer_id);

-- 31. COLD_STORAGE_INVENTORY (Section 6: Inventory Tracking)
CREATE TABLE IF NOT EXISTS cold_storage_inventory (
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
CREATE TABLE IF NOT EXISTS temperature_monitoring (
  id BIGSERIAL PRIMARY KEY,
  chamber_id UUID REFERENCES storage_chambers(id),
  temperature_celsius DECIMAL(5, 2),
  humidity_percent DECIMAL(5, 2),
  recorded_at TIMESTAMP,
  sensor_id VARCHAR(100),
  is_anomaly BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_temperature_monitoring_chamber_id_timestamp ON temperature_monitoring(chamber_id, recorded_at);

-- 33. ENERGY_CONSUMPTION (Section 6: Energy Resilience)
CREATE TABLE IF NOT EXISTS energy_consumption (
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
CREATE TABLE IF NOT EXISTS shipments (
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
CREATE TABLE IF NOT EXISTS reefer_vehicles (
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
CREATE TABLE IF NOT EXISTS logistics_tracking (
  id BIGSERIAL PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id),
  vehicle_id UUID REFERENCES reefer_vehicles(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  temperature_celsius DECIMAL(5, 2),
  gps_timestamp TIMESTAMP,
  recorded_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_logistics_tracking_shipment_id ON logistics_tracking(shipment_id);

-- ============================================================================
-- SECTION 6: QUALITY & LABS (Section 4: Quality & Labs)
-- ============================================================================

-- 37. LABORATORIES
CREATE TABLE IF NOT EXISTS laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_code VARCHAR(50) UNIQUE,
  location_name VARCHAR(255),
  village_id UUID REFERENCES villages(id),
  test_types VARCHAR(255)[],
  is_operational BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 38. LAB_TESTS (Section 4: Laboratory Services)
CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES laboratories(id),
  farmer_id UUID REFERENCES farmers(id),
  test_type VARCHAR(50),
  sample_details JSONB,
  test_results JSONB,
  test_date DATE,
  reported_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_tests_farmer_id ON lab_tests(farmer_id);

-- ============================================================================
-- Additional tables would continue for all 78 tables...
-- This is a truncated example showing the pattern
-- ============================================================================

-- Create default admin user (password should be changed immediately)
INSERT INTO users (email, password_hash, first_name, last_name, is_active) VALUES
('admin@ebdesign.com', '$2b$10$stub_hash_change_immediately', 'System', 'Administrator', true);

-- Assign admin role
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u CROSS JOIN roles r WHERE u.email = 'admin@ebdesign.com' AND r.code = 'admin';