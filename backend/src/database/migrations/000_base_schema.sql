-- AFRERA Platform Database Schema
-- PostgreSQL Schema for ERP Integration
-- Supports multi-tenant architecture with proper relationships

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pgcrypto function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pg_trgm function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'farmer', 'fpo', 'corporate', 'consumer', 'logistics', 'horeca');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method AS ENUM ('cod', 'upi', 'bank_transfer', 'card', 'wallet');
CREATE TYPE loan_status AS ENUM ('pending', 'approved', 'disbursed', 'active', 'completed', 'defaulted');
CREATE TYPE shipment_status AS ENUM ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE insurance_status AS ENUM ('active', 'expired', 'cancelled', 'claimed', 'settled');
CREATE TYPE claim_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'settled');
CREATE TYPE contract_status AS ENUM ('draft', 'active', 'completed', 'cancelled', 'disputed');
CREATE TYPE asset_status AS ENUM ('available', 'booked', 'maintenance', 'unavailable');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed');

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'consumer',
    status VARCHAR(20) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200) GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
    date_of_birth DATE,
    gender VARCHAR(20),
    profile_image_url TEXT,
    address_id UUID,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    preferences JSONB DEFAULT '{}',
    kyc_status VARCHAR(20) DEFAULT 'pending',
    kyc_document_type VARCHAR(50),
    kyc_document_number VARCHAR(100),
    kyc_verified_at TIMESTAMP,
    fpo_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    address_type VARCHAR(20) DEFAULT 'home',
    is_default BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- PRODUCTS & CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    description TEXT,
    icon VARCHAR(50),
    attributes JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    region VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    state_id INTEGER REFERENCES states(id),
    unit_id INTEGER REFERENCES units(id),
    description TEXT,
    usp TEXT,
    gi_status BOOLEAN DEFAULT FALSE,
    gi_certificate_number VARCHAR(100),
    gi_registry_date DATE,
    organic BOOLEAN DEFAULT FALSE,
    organic_certificate_number VARCHAR(100),
    nutrition_data JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    base_price DECIMAL(10, 2) NOT NULL,
    map_price DECIMAL(10, 2), -- Minimum Advertised Price for farmers
    retail_price DECIMAL(10, 2),
    weight_per_unit DECIMAL(10, 3),
    dimensions JSONB,
    tags TEXT[],
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_state ON products(state_id);
CREATE INDEX IF NOT EXISTS idx_products_gi ON products(gi_status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100),
    attributes JSONB DEFAULT '{}',
    price DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    certification_type VARCHAR(50) NOT NULL,
    certificate_number VARCHAR(100),
    issuing_authority VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    document_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORDERS & COMMERCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2),
    shipping_amount DECIMAL(12, 2),
    discount_amount DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    payment_status payment_status DEFAULT 'pending',
    payment_method payment_method,
    shipping_address_id UUID REFERENCES addresses(id),
    billing_address_id UUID REFERENCES addresses(id),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    coupon_code VARCHAR(50),
    erp_reference VARCHAR(100),
    erp_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255),
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2),
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER DEFAULT 1,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method payment_method,
    payment_status payment_status,
    transaction_id VARCHAR(255),
    gateway_response JSONB,
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_amount DECIMAL(12, 2),
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    minimum_order_value DECIMAL(12, 2),
    maximum_discount_amount DECIMAL(12, 2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    applicable_categories INTEGER[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FARMERS & FPOs
-- ============================================================================

CREATE TABLE IF NOT EXISTS fpos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    registration_date DATE,
    address_id UUID REFERENCES addresses(id),
    contact_person_name VARCHAR(255),
    contact_person_phone VARCHAR(20),
    contact_person_email VARCHAR(255),
    gst_number VARCHAR(50),
    pan_number VARCHAR(20),
    fdi_score INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    total_area_hectares DECIMAL(10, 2),
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    erp_vendor_id VARCHAR(100),
    erp_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fpo_id UUID REFERENCES fpos(id),
    farmer_id VARCHAR(100) UNIQUE, -- External farmer ID
    fdi_score INTEGER DEFAULT 0,
    fdi_grade VARCHAR(10),
    fdi_last_calculated TIMESTAMP,
    certification_count INTEGER DEFAULT 0,
    lab_report_count INTEGER DEFAULT 0,
    fulfilled_orders INTEGER DEFAULT 0,
    years_active INTEGER DEFAULT 0,
    farm_size_hectares DECIMAL(10, 2),
    farm_location_id UUID REFERENCES addresses(id),
    training_completed BOOLEAN DEFAULT FALSE,
    disputes INTEGER DEFAULT 0,
    max_advance_percentage INTEGER DEFAULT 20,
    credit_score INTEGER DEFAULT 50,
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    erp_vendor_id VARCHAR(100),
    erp_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_fpo_id ON farmers(fpo_id);

CREATE TABLE IF NOT EXISTS farmer_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    certification_type VARCHAR(50) NOT NULL,
    certificate_number VARCHAR(100),
    issuing_authority VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    document_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    training_type VARCHAR(100) NOT NULL,
    training_provider VARCHAR(255),
    completion_date DATE,
    score INTEGER,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FINANCIAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    grade VARCHAR(10),
    factors JSONB DEFAULT '{}',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id),
    amount DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    term_months INTEGER NOT NULL,
    purpose VARCHAR(255),
    status loan_status DEFAULT 'pending',
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP,
    disbursement_date TIMESTAMP,
    maturity_date DATE,
    collateral_type VARCHAR(100),
    collateral_value DECIMAL(12, 2),
    guarantor_name VARCHAR(255),
    guarantor_phone VARCHAR(20),
    bank_loan_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emi_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    principal_amount DECIMAL(12, 2) NOT NULL,
    interest_amount DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    paid_date TIMESTAMP,
    paid_amount DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id),
    contract_id UUID,
    amount DECIMAL(12, 2) NOT NULL,
    advance_percentage INTEGER NOT NULL,
    tranche_number INTEGER DEFAULT 1,
    total_tranches INTEGER DEFAULT 3,
    tranche_status VARCHAR(20) DEFAULT 'pending',
    release_conditions JSONB DEFAULT '{}',
    as_input_credit BOOLEAN DEFAULT FALSE,
    input_items JSONB DEFAULT '[]',
    release_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'advance', 'repayment', 'disbursement'
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method payment_method,
    reference_number VARCHAR(255),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed',
    description TEXT,
    erp_reference VARCHAR(100),
    erp_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INSURANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'crop', 'transit', 'personal_accident', 'warehouse', 'equipment'
    scheme VARCHAR(255),
    coverage_description TEXT,
    sum_insured_min DECIMAL(12, 2),
    sum_insured_max DECIMAL(12, 2),
    premium_rate DECIMAL(5, 2),
    farmer_share VARCHAR(50),
    notes TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    farmer_id UUID REFERENCES farmers(id),
    product_id INTEGER REFERENCES insurance_products(id),
    master_policy_id UUID,
    coverage_amount DECIMAL(12, 2) NOT NULL,
    premium_amount DECIMAL(12, 2) NOT NULL,
    policy_start_date DATE NOT NULL,
    policy_end_date DATE NOT NULL,
    status insurance_status DEFAULT 'active',
    insurer_name VARCHAR(255),
    insurer_policy_number VARCHAR(100),
    beneficiaries JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    policy_id UUID REFERENCES policies(id),
    user_id UUID REFERENCES users(id),
    claim_amount DECIMAL(12, 2) NOT NULL,
    incident_date DATE,
    incident_description TEXT,
    incident_location VARCHAR(255),
    supporting_documents JSONB DEFAULT '[]',
    status claim_status DEFAULT 'submitted',
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_date TIMESTAMP,
    approved_amount DECIMAL(12, 2),
    settled_date TIMESTAMP,
    settlement_reference VARCHAR(100),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_type VARCHAR(50) NOT NULL, -- 'fpo', 'corporate', 'logistics'
    organization_id UUID,
    coverage_type VARCHAR(100) NOT NULL,
    sum_insured DECIMAL(15, 2) NOT NULL,
    premium_amount DECIMAL(15, 2),
    insurer_name VARCHAR(255),
    policy_number VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    terms JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOGISTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipment_modes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    base_rate DECIMAL(10, 2),
    per_km_rate DECIMAL(10, 2),
    capacity_kg DECIMAL(10, 2),
    transit_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    mode_id INTEGER REFERENCES shipment_modes(id),
    origin_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    dest_lat DECIMAL(10, 8),
    dest_lng DECIMAL(11, 8),
    weight_kg DECIMAL(10, 2) NOT NULL,
    volume_cbm DECIMAL(10, 2),
    is_perishable BOOLEAN DEFAULT FALSE,
    temperature_requirement DECIMAL(5, 2),
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    estimated_transit_days INTEGER,
    status shipment_status DEFAULT 'pending',
    tracking_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment_id ON shipment_tracking(shipment_id);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity_kg DECIMAL(10, 2),
    reefer_equipped BOOLEAN DEFAULT FALSE,
    temperature_range VARCHAR(50),
    owner_type VARCHAR(50), -- 'platform', 'partner', 'external'
    owner_id UUID,
    driver_id UUID,
    current_location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_expiry_date DATE,
    assigned_vehicle_id UUID REFERENCES vehicles(id),
    status VARCHAR(20) DEFAULT 'active',
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONTRACT FARMING
-- ============================================================================

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id),
    buyer_id UUID REFERENCES users(id),
    crop_id UUID REFERENCES products(id),
    season VARCHAR(50) NOT NULL,
    volume_kg DECIMAL(12, 2) NOT NULL,
    floor_price DECIMAL(10, 2) NOT NULL,
    contract_value DECIMAL(12, 2),
    status contract_status DEFAULT 'draft',
    contract_date DATE,
    expected_harvest_date DATE,
    delivery_location VARCHAR(255),
    quality_standards JSONB DEFAULT '{}',
    payment_terms TEXT,
    advance_percentage DECIMAL(5, 2),
    advance_amount DECIMAL(12, 2),
    escrow_account_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    target_quantity DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'pending',
    completed_date TIMESTAMP,
    completed_quantity DECIMAL(12, 2),
    verification_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    balance DECIMAL(15, 2) DEFAULT 0,
    release_conditions JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INFRASTRUCTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type_id INTEGER REFERENCES asset_types(id),
    description TEXT,
    capacity VARCHAR(100),
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    cooperative_rate DECIMAL(10, 2),
    corporate_rate DECIMAL(10, 2),
    unit VARCHAR(50),
    is_mobile BOOLEAN DEFAULT FALSE,
    location_id UUID REFERENCES addresses(id),
    responsible_user_id UUID REFERENCES users(id),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    useful_life_years INTEGER,
    maintenance_interval_days INTEGER,
    status asset_status DEFAULT 'available',
    utilization_rate DECIMAL(5, 2),
    erp_asset_id VARCHAR(100),
    erp_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id),
    user_id UUID REFERENCES users(id),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    booking_type VARCHAR(50), -- 'rental', 'cooperative', 'corporate'
    rate DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'confirmed',
    purpose VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id),
    maintenance_type VARCHAR(100) NOT NULL,
    scheduled_date DATE,
    completed_date TIMESTAMP,
    performed_by VARCHAR(255),
    cost DECIMAL(12, 2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GOVERNANCE & COMPLIANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS schemes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    ministry VARCHAR(255),
    eligibility_criteria JSONB DEFAULT '{}',
    subsidy_percentage DECIMAL(5, 2),
    max_amount DECIMAL(12, 2),
    application_deadline DATE,
    scheme_start_date DATE,
    scheme_end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    documents_required JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subsidy_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id),
    scheme_id INTEGER REFERENCES schemes(id),
    amount DECIMAL(12, 2) NOT NULL,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'submitted',
    approved_date TIMESTAMP,
    approved_amount DECIMAL(12, 2),
    disbursement_date TIMESTAMP,
    disbursement_reference VARCHAR(100),
    rejection_reason TEXT,
    supporting_documents JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    requirement_type VARCHAR(100) NOT NULL,
    requirement_description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    completed_date TIMESTAMP,
    evidence_url TEXT,
    verified_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ERP INTEGRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS erp_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    erp_type VARCHAR(50) NOT NULL, -- 'sap', 'oracle', 'custom'
    operation VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    status sync_status DEFAULT 'pending',
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_entity ON erp_sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_status ON erp_sync_logs(status);

-- ============================================================================
-- AI & ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    prediction JSONB NOT NULL,
    confidence DECIMAL(5, 2),
    features_used JSONB DEFAULT '[]',
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    recommendation_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    source VARCHAR(50), -- 'collaborative', 'content', 'contextual'
    score DECIMAL(5, 2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    clicked_at TIMESTAMP,
    converted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    event_type VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    page_url TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farmers_updated_at ON farmers;
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Farmer Dashboard View
-- FIXED 2026-08-04: this view referenced u.name, which does not exist on
-- users (that table carries email/phone/role only). The human-readable name
-- lives on user_profiles.full_name, a generated column. The view therefore
-- failed to create, and with it the farmer dashboard it backs.
-- LEFT JOIN, not JOIN: a farmer with no profile row should still appear on
-- their own dashboard rather than vanishing from it.
CREATE VIEW farmer_dashboard AS
SELECT
    f.id,
    f.user_id,
    up.full_name as farmer_name,
    f.fdi_score,
    f.fdi_grade,
    f.farm_size_hectares,
    fpo.name as fpo_name,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(l.amount), 0) as total_loans,
    f.status
FROM farmers f
JOIN users u ON f.user_id = u.id
LEFT JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN fpos fpo ON f.fpo_id = fpo.id
LEFT JOIN orders o ON f.user_id = o.user_id
LEFT JOIN loans l ON f.id = l.farmer_id
GROUP BY f.id, up.full_name, f.fdi_score, f.fdi_grade, f.farm_size_hectares, fpo.name, f.status;

-- Product Performance View
CREATE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.category_id,
    c.name as category_name,
    p.state_id,
    s.name as state_name,
    COUNT(DISTINCT oi.order_id) as order_count,
    COALESCE(SUM(oi.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(AVG(oi.unit_price), 0) as average_price,
    p.gi_status,
    p.is_active
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN states s ON p.state_id = s.id
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.category_id, c.name, p.state_id, s.name, p.gi_status, p.is_active;

-- ERP Sync Status View
CREATE VIEW erp_sync_dashboard AS
SELECT 
    entity_type,
    COUNT(*) as total_entities,
    SUM(CASE WHEN status = 'synced' THEN 1 ELSE 0 END) as synced_entities,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_entities,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_entities,
    MAX(synced_at) as last_sync_time
FROM erp_sync_logs
GROUP BY entity_type;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default categories
INSERT INTO categories (name, description, icon, sort_order) VALUES
('Grains & Millets', 'Rice, wheat, millets and other grains', '🌾', 1),
('Spices', 'Turmeric, chilli, cardamom and other spices', '🌶️', 2),
('Fruits', 'Citrus, tropical and other fruits', '🍊', 3),
('Vegetables & Greens', 'Leafy greens and vegetables', '🥬', 4),
('Tea & Beverages', 'Tea, coffee and other beverages', '🍵', 5),
('Honey & Sweeteners', 'Honey, jaggery and natural sweeteners', '🍯', 6),
('Fermented & Pickles', 'Fermented foods and pickles', '🫙', 7),
('Bamboo Foods', 'Bamboo shoots and products', '🎋', 8),
('Mushrooms', 'Wild and cultivated mushrooms', '🍄', 9),
('Herbs & Wellness', 'Medicinal herbs and wellness products', '🌿', 10),
('Oils, Nuts & Seeds', 'Cold-pressed oils, nuts and seeds', '🥜', 11),
('Superfoods & Value-Added', 'Nutrient-dense superfoods', '✨', 12);

-- Insert default states
INSERT INTO states (name, code, region) VALUES
('Assam', 'AS', 'Northeast'),
('Nagaland', 'NL', 'Northeast'),
('Manipur', 'MN', 'Northeast'),
('Meghalaya', 'ML', 'Northeast'),
('Arunachal Pradesh', 'AR', 'Northeast'),
('Mizoram', 'MZ', 'Northeast'),
('Tripura', 'TR', 'Northeast'),
('Sikkim', 'SK', 'Northeast');

-- Insert default units
INSERT INTO units (name, symbol, description) VALUES
('Kilogram', 'KG', 'Metric kilogram'),
('Gram', 'G', 'Metric gram'),
('Litre', 'L', 'Metric litre'),
('Millilitre', 'ML', 'Metric millilitre'),
('Piece', 'PC', 'Individual piece'),
('Dozen', 'DZ', '12 pieces'),
('Bunch', 'BN', 'Bunch of items');

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Platform administrator with full access', '["*"]'),
('farmer', 'Farmer with access to farmer portal and marketplace', '["marketplace:read", "marketplace:buy", "farmer:read", "farmer:update", "orders:read"]'),
('fpo', 'FPO administrator with member management access', '["marketplace:read", "marketplace:buy", "farmer:read", "farmer:update", "fpo:read", "fpo:update", "orders:read", "orders:manage"]'),
('corporate', 'Corporate buyer with bulk purchasing access', '["marketplace:read", "marketplace:buy", "orders:read", "orders:create", "procurement:read", "procurement:create"]'),
('consumer', 'Regular consumer with marketplace access', '["marketplace:read", "marketplace:buy", "orders:read", "orders:create"]'),
('logistics', 'Logistics partner with shipment management access', '["logistics:read", "logistics:update", "shipments:read", "shipments:update", "vehicles:read", "drivers:read"]'),
('horeca', 'Hotel/Restaurant/Cafe with bulk ordering access', '["marketplace:read", "marketplace:buy", "orders:read", "orders:create", "procurement:read"]');

-- Insert default shipment modes
INSERT INTO shipment_modes (name, code, description, base_rate, per_km_rate, capacity_kg, transit_days) VALUES
('Bike', 'BIKE', '2-Wheeler for hyperlocal deliveries', 50, 2.5, 50, 1),
('Auto', 'AUTO', '3-Wheeler for city and feeder loads', 80, 3.0, 200, 1),
('Truck', 'TRUCK', 'Truck for bulk and cold-chain', 200, 4.0, 5000, 4),
('Rail', 'RAIL', 'Rail for long-haul bulk', 150, 1.5, 10000, 6),
('Courier', 'COURIER', 'Courier for small parcels', 300, 5.0, 50, 3),
('Speed Post', 'SPEEDPOST', 'India Post nationwide reach', 200, 3.0, 30, 5),
('Air Cargo', 'AIR', 'Air cargo for perishable premium', 800, 15.0, 100, 1);

-- Insert default insurance products
INSERT INTO insurance_products (name, type, scheme, coverage_description, sum_insured_min, sum_insured_max, premium_rate, farmer_share, status) VALUES
('Crop Insurance (PMFBY)', 'crop', 'Pradhan Mantri Fasal Bima Yojana', 'Coverage against yield loss due to natural calamities', 10000, 500000, 2.0, '~2% of sum insured', 'active'),
('Transit Insurance', 'transit', 'Marine/Inland Cargo', 'Coverage against damage during transportation', 5000, 1000000, 0.5, '~0.5% of value', 'active'),
('Personal Accident', 'personal_accident', 'Group PA', 'Accidental death and disability coverage', 50000, 500000, 0.3, 'Group premium', 'active'),
('Warehouse Insurance', 'warehouse', 'Fire & Allied Perils', 'Coverage for stored produce against fire, flood, burglary', 100000, 10000000, 0.8, '~0.5% of stored value', 'active'),
('Equipment Breakdown', 'equipment', 'Machinery Breakdown', 'Coverage for processing equipment breakdown', 50000, 2000000, 1.2, '~1% of insured value', 'active');

-- Insert default schemes
INSERT INTO schemes (name, code, description, ministry, eligibility_criteria, subsidy_percentage, max_amount, status) VALUES
('PM-KISAN', 'PMKISAN', 'Pradhan Mantri Kisan Samman Nidhi', 'Ministry of Agriculture', '{"farmer_type": "small_marginal", "land_holding_max_hectares": 2}', 100, 6000, 'active'),
('Agricultural Infrastructure Fund', 'AIF', 'Loans for agricultural infrastructure at subsidized interest rates', 'Ministry of Agriculture', '{"entity_type": ["fpo", "farmer"], "project_type": "infrastructure"}', 3.0, 20000000, 'active'),
('National Beekeeping and Honey Mission', 'NBHM', 'Support for beekeeping and honey production', 'Ministry of Agriculture', '{"activity": "beekeeping", "min_hives": 50}', 50, 1000000, 'active');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with authentication and authorization';
COMMENT ON TABLE products IS 'Product catalog with GI certification and pricing';
COMMENT ON TABLE orders IS 'Customer orders with payment and shipping information';
COMMENT ON TABLE farmers IS 'Farmer profiles with FDI scores and certifications';
COMMENT ON TABLE fpos IS 'Farmer Producer Organizations';
COMMENT ON TABLE loans IS 'Loan applications and disbursement tracking';
COMMENT ON TABLE contracts IS 'Contract farming agreements with escrow';
COMMENT ON TABLE shipments IS 'Logistics shipment tracking';
COMMENT ON TABLE policies IS 'Insurance policies and coverage';
COMMENT ON TABLE assets IS 'Shared infrastructure assets';
COMMENT ON TABLE erp_sync_logs IS 'ERP synchronization tracking';
COMMENT ON TABLE ai_predictions IS 'AI model predictions and recommendations';
