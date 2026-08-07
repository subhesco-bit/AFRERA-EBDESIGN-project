# Volume 4: Database Architecture

## Executive Summary

The AFRERA platform database architecture is designed to support a comprehensive digital agricultural operating system integrating ERP, Marketplace, Supply Chain, Finance, Banking, Insurance, AI Decision Support, Organic Traceability, Government Scheme Intelligence, Farmer Advisory, Cooperative Management, Logistics, Analytics, Compliance, and Governance. The architecture uses a hybrid approach with PostgreSQL for relational data and MongoDB for document storage, optimized for performance, scalability, and data integrity.

---

## Database Technology Stack

### Primary Database: PostgreSQL (AWS RDS)

- **Version**: PostgreSQL 15
- **Deployment**: Multi-AZ with read replicas
- **Backup**: Automated daily backups with point-in-time recovery
- **Encryption**: AES-256 encryption at rest and in transit
- **Extensions**: PostGIS, pgcrypto, uuid-ossp, pg_trgm

### Document Database: MongoDB (AWS DocumentDB)

- **Version**: MongoDB 5.0 compatible
- **Deployment**: Replica set with 3 nodes
- **Backup**: Automated snapshots
- **Encryption**: Encryption at rest and in transit

### Cache Layer: Redis (AWS ElastiCache)

- **Version**: Redis 7
- **Deployment**: Cluster mode with replication
- **Persistence**: AOF (Append Only File)
- **Encryption**: Encryption in transit

### Search Engine: Elasticsearch

- **Version**: 8.x
- **Deployment**: 3-node cluster
- **Purpose**: Full-text search, analytics, log analysis

---

## Database Schema Design

### 1. Identity and Access Management (IAM)

#### Table: users


```sql

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_image_url VARCHAR(500),
    date_of_birth DATE,
    gender VARCHAR(20),
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('FARMER', 'BUYER', 'GOVERNMENT', 'ADMIN', 'PARTNER', 'COOPERATIVE')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^[+]?[0-9]{10,15}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_kyc_verified ON users(kyc_verified);

```

#### Table: user_roles


```sql

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'FARMER', 'BUYER', 'GOVERNMENT_OFFICIAL', 'PARTNER_ADMIN', 'COOPERATIVE_ADMIN')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);

```

#### Table: user_permissions


```sql

CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_user_permission UNIQUE (user_id, permission, resource_type, resource_id)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX idx_user_permissions_resource ON user_permissions(resource_type, resource_id);

```

#### Table: user_sessions


```sql

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

```

#### Table: audit_logs


```sql

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);

```

---

### 2. Farmer Management

#### Table: farmers


```sql

CREATE TABLE farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_code VARCHAR(20) UNIQUE NOT NULL,
    aadhaar_number VARCHAR(12) UNIQUE,
    pan_number VARCHAR(10),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('GENERAL', 'OBC', 'SC', 'ST', 'OTHER')),
    education_level VARCHAR(50),
    farming_experience_years INTEGER,
    land_holding_size DECIMAL(10,2) CHECK (land_holding_size >= 0),
    irrigation_source VARCHAR(100),
    soil_type VARCHAR(100),
    primary_crop VARCHAR(100),
    secondary_crops TEXT[],
    livestock_details JSONB,
    farming_practices TEXT[],
    certification_details JSONB,
    fdi_score INTEGER CHECK (fdi_score BETWEEN 0 AND 100),
    fdi_grade VARCHAR(2) CHECK (fdi_grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D')),
    fdi_calculated_at TIMESTAMP,
    bank_account_number VARCHAR(20),
    bank_ifsc_code VARCHAR(11),
    bank_account_verified BOOLEAN DEFAULT FALSE,
    cooperative_id UUID REFERENCES cooperatives(id),
    is_cooperative_member BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLACKLISTED')),
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_farmers_user_id ON farmers(user_id);
CREATE INDEX idx_farmers_farmer_code ON farmers(farmer_code);
CREATE INDEX idx_farmers_aadhaar ON farmers(aadhaar_number);
CREATE INDEX idx_farmers_cooperative_id ON farmers(cooperative_id);
CREATE INDEX idx_farmers_fdi_score ON farmers(fdi_score);
CREATE INDEX idx_farmers_status ON farmers(status);
CREATE INDEX idx_farmers_location ON farmers USING GIN(livestock_details);

```

#### Table: farms


```sql

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    farm_code VARCHAR(20) UNIQUE NOT NULL,
    farm_name VARCHAR(200),
    location_name VARCHAR(200),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100),
    village VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    altitude DECIMAL(10,2),
    total_area DECIMAL(10,2) NOT NULL CHECK (total_area > 0),
    cultivated_area DECIMAL(10,2) CHECK (cultivated_area > 0),
    soil_type VARCHAR(100),
    soil_ph_level DECIMAL(4,2),
    irrigation_type VARCHAR(50),
    water_source VARCHAR(100),
    ownership_type VARCHAR(50) CHECK (ownership_type IN ('OWNED', 'LEASED', 'SHARED')),
    land_document_type VARCHAR(50),
    land_document_number VARCHAR(50),
    land_document_url VARCHAR(500),
    is_organic BOOLEAN DEFAULT FALSE,
    organic_certification_number VARCHAR(50),
    organic_certified_at TIMESTAMP,
    organic_expiry_date DATE,
    geo_boundary GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX idx_farms_farm_code ON farms(farm_code);
CREATE INDEX idx_farms_location ON farms(state, district, village);
CREATE INDEX idx_farms_geo ON farms USING GIST(geo_boundary);
CREATE INDEX idx_farms_is_organic ON farms(is_organic);

```

#### Table: farmer_training


```sql

CREATE TABLE farmer_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    training_program_id UUID NOT NULL REFERENCES training_programs(id),
    enrollment_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ENROLLED' CHECK (status IN ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED', 'FAILED')),
    score DECIMAL(5,2),
    certificate_url VARCHAR(500),
    certificate_issued_at TIMESTAMP,
    folu_compliance_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_farmer_training UNIQUE (farmer_id, training_program_id)
);

CREATE INDEX idx_farmer_training_farmer_id ON farmer_training(farmer_id);
CREATE INDEX idx_farmer_training_program_id ON farmer_training(training_program_id);
CREATE INDEX idx_farmer_training_status ON farmer_training(status);

```

---

### 3. Marketplace

#### Table: products


```sql

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id),
    subcategory_id UUID REFERENCES product_subcategories(id),
    farmer_id UUID REFERENCES farmers(id),
    is_gi_product BOOLEAN DEFAULT FALSE,
    gi_number VARCHAR(50),
    gi_region VARCHAR(100),
    is_organic BOOLEAN DEFAULT FALSE,
    organic_certification_number VARCHAR(50),
    nutritional_info JSONB,
    specifications JSONB,
    images TEXT[],
    primary_image_url VARCHAR(500),
    base_price DECIMAL(12,2) NOT NULL CHECK (base_price > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    unit VARCHAR(20) NOT NULL CHECK (unit IN ('KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'DOZEN', 'BUNCH')),
    available_quantity DECIMAL(12,2) NOT NULL CHECK (available_quantity >= 0),
    minimum_order_quantity DECIMAL(12,2) DEFAULT 1 CHECK (minimum_order_quantity > 0),
    harvest_date DATE,
    expiry_date DATE,
    storage_conditions TEXT,
    quality_grade VARCHAR(20),
    fdi_score INTEGER CHECK (fdi_score BETWEEN 0 AND 100),
    carbon_footprint DECIMAL(10,2),
    sustainability_score INTEGER CHECK (sustainability_score BETWEEN 0 AND 100),
    tags TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED')),
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) CHECK (rating_average BETWEEN 0 AND 5),
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_products_product_code ON products(product_code);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_farmer_id ON products(farmer_id);
CREATE INDEX idx_products_is_organic ON products(is_organic);
CREATE INDEX idx_products_is_gi_product ON products(is_gi_product);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(base_price);
CREATE INDEX idx_products_rating ON products(rating_average);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_nutritional ON products USING GIN(nutritional_info);

```

#### Table: product_categories


```sql

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    icon_url VARCHAR(500),
    image_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_categories_parent_id ON product_categories(parent_id);
CREATE INDEX idx_product_categories_is_active ON product_categories(is_active);

```

#### Table: product_subcategories


```sql

CREATE TABLE product_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES product_categories(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    image_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_subcategories_category_id ON product_subcategories(category_id);
CREATE INDEX idx_product_subcategories_is_active ON product_subcategories(is_active);

```

#### Table: orders


```sql

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    buyer_type VARCHAR(50) NOT NULL CHECK (buyer_type IN ('INDIVIDUAL', 'COOPERATIVE', 'BUSINESS', 'GOVERNMENT')),
    order_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD' CHECK (order_type IN ('STANDARD', 'PRE_SEASON', 'CONTRACT', 'BULK')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(12,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    payment_id VARCHAR(100),
    shipping_address JSONB NOT NULL,
    billing_address JSONB,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    notes TEXT,
    coupon_code VARCHAR(50),
    applied_coupon_id UUID REFERENCES coupons(id),
    margin_percentage DECIMAL(5,2),
    margin_amount DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_shipping_address ON orders USING GIN(shipping_address);

```

#### Table: order_items


```sql

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    product_code VARCHAR(20),
    quantity DECIMAL(12,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price > 0),
    discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
    farmer_id UUID REFERENCES farmers(id),
    farm_id UUID REFERENCES farms(id),
    harvest_date DATE,
    quality_grade VARCHAR(20),
    specifications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_farmer_id ON order_items(farmer_id);

```

#### Table: reviews


```sql

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200),
    comment TEXT,
    images TEXT[],
    helpful_count INTEGER DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);

```

---

### 4. Financial Services

#### Table: accounts


```sql

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('SAVINGS', 'CURRENT', 'LOAN', 'CREDIT')),
    account_name VARCHAR(200) NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'FROZEN', 'CLOSED')),
    kyc_verified BOOLEAN DEFAULT FALSE,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    available_credit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_accounts_status ON accounts(status);

```

#### Table: transactions


```sql

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(30) UNIQUE NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('CREDIT', 'DEBIT', 'TRANSFER', 'PAYMENT', 'REFUND', 'INTEREST', 'PENALTY')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    description TEXT,
    reference_id UUID,
    reference_type VARCHAR(50),
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    category VARCHAR(50),
    tags TEXT[],
    metadata JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);

```

#### Table: loans


```sql

CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID REFERENCES accounts(id),
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('CROP_LOAN', 'EQUIPMENT_LOAN', 'LAND_DEVELOPMENT', 'WORKING_CAPITAL', 'GREENHOUSE', 'INFRASTRUCTURE')),
    principal_amount DECIMAL(15,2) NOT NULL CHECK (principal_amount > 0),
    interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate > 0),
    interest_type VARCHAR(20) NOT NULL DEFAULT 'REDUCING' CHECK (interest_type IN ('REDUCING', 'FLAT')),
    tenure_months INTEGER NOT NULL CHECK (tenure_months > 0),
    emi_amount DECIMAL(15,2),
    total_interest DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    purpose TEXT,
    collateral_details JSONB,
    subsidy_percentage DECIMAL(5,2),
    subsidy_amount DECIMAL(15,2),
    subsidy_scheme_id UUID REFERENCES government_schemes(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'PAID', 'DEFAULTED', 'REJECTED')),
    application_date DATE NOT NULL,
    approval_date DATE,
    disbursement_date DATE,
    first_emi_date DATE,
    maturity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_loan_number ON loans(loan_number);
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_type ON loans(loan_type);

```

#### Table: loan_repayments


```sql

CREATE TABLE loan_repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id),
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL,
    principal_component DECIMAL(15,2) NOT NULL,
    interest_component DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'WAIVED')),
    late_fee DECIMAL(15,2) DEFAULT 0,
    paid_late_fee DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_loan_installment UNIQUE (loan_id, installment_number)
);

CREATE INDEX idx_loan_repayments_loan_id ON loan_repayments(loan_id);
CREATE INDEX idx_loan_repayments_due_date ON loan_repayments(due_date);
CREATE INDEX idx_loan_repayments_status ON loan_repayments(status);

```

---

### 5. Insurance

#### Table: insurance_policies


```sql

CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('CROP_INSURANCE', 'HEALTH_INSURANCE', 'LIFE_INSURANCE', 'EQUIPMENT_INSURANCE', 'TRANSIT_INSURANCE', 'LIABILITY_INSURANCE')),
    insurance_provider VARCHAR(100) NOT NULL,
    scheme_id UUID REFERENCES government_schemes(id),
    coverage_amount DECIMAL(15,2) NOT NULL CHECK (coverage_amount > 0),
    premium_amount DECIMAL(15,2) NOT NULL CHECK (premium_amount > 0),
    premium_frequency VARCHAR(20) NOT NULL DEFAULT 'ANNUAL' CHECK (premium_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME')),
    sum_assured DECIMAL(15,2),
    deductible_amount DECIMAL(15,2),
    policy_start_date DATE NOT NULL,
    policy_end_date DATE NOT NULL,
    coverage_details JSONB NOT NULL,
    beneficiary_details JSONB,
    premium_paid_amount DECIMAL(15,2) DEFAULT 0,
    subsidy_percentage DECIMAL(5,2),
    subsidy_amount DECIMAL(15,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'CLAIMED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insurance_policies_policy_number ON insurance_policies(policy_number);
CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_type ON insurance_policies(policy_type);
CREATE INDEX idx_insurance_policies_status ON insurance_policies(status);
CREATE INDEX idx_insurance_policies_dates ON insurance_policies(policy_start_date, policy_end_date);

```

#### Table: insurance_claims


```sql

CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(30) UNIQUE NOT NULL,
    policy_id UUID NOT NULL REFERENCES insurance_policies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    claim_type VARCHAR(50) NOT NULL,
    incident_date DATE NOT NULL,
    reported_date DATE NOT NULL,
    claim_amount DECIMAL(15,2) NOT NULL CHECK (claim_amount > 0),
    description TEXT NOT NULL,
    incident_details JSONB NOT NULL,
    supporting_documents TEXT[],
    damage_assessment JSONB,
    surveyor_id UUID REFERENCES users(id),
    surveyor_report JSONB,
    surveyor_report_date DATE,
    approved_amount DECIMAL(15,2),
    settlement_amount DECIMAL(15,2),
    settlement_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'SURVEY_SCHEDULED', 'SURVEY_COMPLETED', 'APPROVED', 'REJECTED', 'SETTLED', 'CLOSED')),
    ai_confidence_score DECIMAL(5,2),
    ai_recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insurance_claims_claim_number ON insurance_claims(claim_number);
CREATE INDEX idx_insurance_claims_policy_id ON insurance_claims(policy_id);
CREATE INDEX idx_insurance_claims_user_id ON insurance_claims(user_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX idx_insurance_claims_incident_date ON insurance_claims(incident_date);

```

---

### 6. Logistics

#### Table: shipments


```sql

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_number VARCHAR(20) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    shipment_type VARCHAR(50) NOT NULL CHECK (shipment_type IN ('STANDARD', 'EXPRESS', 'COLD_CHAIN', 'BULK')),
    origin_address JSONB NOT NULL,
    destination_address JSONB NOT NULL,
    origin_coordinates GEOGRAPHY(POINT, 4326),
    destination_coordinates GEOGRAPHY(POINT, 4326),
    pickup_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    carrier_id UUID REFERENCES logistics_providers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES drivers(id),
    tracking_number VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED')),
    weight DECIMAL(10,2),
    volume DECIMAL(10,2),
    temperature_requirements JSONB,
    special_instructions TEXT,
    cost DECIMAL(12,2),
    subsidy_percentage DECIMAL(5,2),
    subsidy_amount DECIMAL(12,2),
    route_optimization_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_shipment_number ON shipments(shipment_number);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX idx_shipments_dates ON shipments(pickup_date, expected_delivery_date);
CREATE INDEX idx_shipments_coordinates ON shipments USING GIST(origin_coordinates);
CREATE INDEX idx_shipments_destination ON shipments USING GIST(destination_coordinates);

```

#### Table: shipment_tracking


```sql

CREATE TABLE shipment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326),
    location_name VARCHAR(200),
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    speed DECIMAL(8,2),
    heading DECIMAL(5,2),
    altitude DECIMAL(8,2),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipment_tracking_shipment_id ON shipment_tracking(shipment_id);
CREATE INDEX idx_shipment_tracking_timestamp ON shipment_tracking(timestamp);
CREATE INDEX idx_shipment_tracking_location ON shipment_tracking USING GIST(location);

```

#### Table: vehicles


```sql

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('TRUCK', 'VAN', 'BIKE', 'COLD_TRUCK', 'CONTAINER')),
    capacity_weight DECIMAL(10,2),
    capacity_volume DECIMAL(10,2),
    temperature_controlled BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(5,2),
    max_temperature DECIMAL(5,2),
    owner_type VARCHAR(50) CHECK (owner_type IN ('COMPANY', 'PARTNER', 'FARMER')),
    owner_id UUID,
    registration_date DATE,
    insurance_expiry DATE,
    fitness_expiry DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE')),
    current_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_vehicle_number ON vehicles(vehicle_number);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(current_location);

```

#### Table: drivers


```sql

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    driver_code VARCHAR(20) UNIQUE NOT NULL,
    license_number VARCHAR(30) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    license_type VARCHAR(50),
    vehicle_id UUID REFERENCES vehicles(id),
    experience_years INTEGER,
    rating_average DECIMAL(3,2) CHECK (rating_average BETWEEN 0 AND 5),
    total_deliveries INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    current_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_driver_code ON drivers(driver_code);
CREATE INDEX idx_drivers_license_number ON drivers(license_number);
CREATE INDEX idx_drivers_vehicle_id ON drivers(vehicle_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);

```

---

### 7. Government Schemes

#### Table: government_schemes


```sql

CREATE TABLE government_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_code VARCHAR(20) UNIQUE NOT NULL,
    scheme_name VARCHAR(200) NOT NULL,
    scheme_type VARCHAR(50) NOT NULL CHECK (scheme_type IN ('SUBSIDY', 'GRANT', 'LOAN', 'INSURANCE', 'TRAINING', 'INFRASTRUCTURE')),
    ministry VARCHAR(100),
    description TEXT,
    eligibility_criteria JSONB NOT NULL,
    required_documents TEXT[],
    benefit_details JSONB NOT NULL,
    application_process TEXT,
    subsidy_percentage DECIMAL(5,2),
    max_subsidy_amount DECIMAL(15,2),
    application_start_date DATE,
    application_end_date DATE,
    scheme_start_date DATE,
    scheme_end_date DATE,
    state_specific JSONB,
    target_beneficiaries TEXT[],
    budget_allocation DECIMAL(15,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'CLOSED', 'UPCOMING')),
    website_url VARCHAR(500),
    contact_details JSONB,
    faq JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_government_schemes_scheme_code ON government_schemes(scheme_code);
CREATE INDEX idx_government_schemes_type ON government_schemes(scheme_type);
CREATE INDEX idx_government_schemes_status ON government_schemes(status);
CREATE INDEX idx_government_schemes_dates ON government_schemes(application_start_date, application_end_date);
CREATE INDEX idx_government_schemes_eligibility ON government_schemes USING GIN(eligibility_criteria);

```

#### Table: scheme_applications


```sql

CREATE TABLE scheme_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(30) UNIQUE NOT NULL,
    scheme_id UUID NOT NULL REFERENCES government_schemes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    farmer_id UUID REFERENCES farmers(id),
    application_data JSONB NOT NULL,
    documents TEXT[],
    submission_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'FIELD_VERIFICATION', 'APPROVED', 'REJECTED', 'ON_HOLD', 'DISBURSED')),
    current_stage VARCHAR(50),
    reviewer_id UUID REFERENCES users(id),
    review_comments TEXT,
    approved_amount DECIMAL(15,2),
    subsidy_amount DECIMAL(15,2),
    disbursement_date DATE,
    disbursement_reference VARCHAR(100),
    rejection_reason TEXT,
    ai_eligibility_score DECIMAL(5,2),
    ai_recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheme_applications_application_number ON scheme_applications(application_number);
CREATE INDEX idx_scheme_applications_scheme_id ON scheme_applications(scheme_id);
CREATE INDEX idx_scheme_applications_user_id ON scheme_applications(user_id);
CREATE INDEX idx_scheme_applications_farmer_id ON scheme_applications(farmer_id);
CREATE INDEX idx_scheme_applications_status ON scheme_applications(status);
CREATE INDEX idx_scheme_applications_submission_date ON scheme_applications(submission_date);

```

---

### 8. Training Programs

#### Table: training_programs


```sql

CREATE TABLE training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('CULTIVATION', 'POST_HARVEST', 'MARKETING', 'FINANCIAL_LITERACY', 'TECHNOLOGY', 'SUSTAINABILITY', 'CERTIFICATION')),
    duration_hours INTEGER NOT NULL,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('ONLINE', 'OFFLINE', 'HYBRID')),
    language VARCHAR(10) DEFAULT 'EN',
    syllabus JSONB,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    instructor_id UUID REFERENCES users(id),
    max_participants INTEGER,
    fee_amount DECIMAL(10,2),
    subsidy_percentage DECIMAL(5,2),
    folu_compliant BOOLEAN DEFAULT FALSE,
    folu_pillars TEXT[],
    certification_offered BOOLEAN DEFAULT FALSE,
    certificate_template_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    enrollment_start_date DATE,
    enrollment_end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_programs_program_code ON training_programs(program_code);
CREATE INDEX idx_training_programs_category ON training_programs(category);
CREATE INDEX idx_training_programs_status ON training_programs(status);
CREATE INDEX idx_training_programs_dates ON training_programs(start_date, end_date);

```

---

### 9. Soil Testing

#### Table: soil_samples


```sql

CREATE TABLE soil_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_number VARCHAR(20) UNIQUE NOT NULL,
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    farm_id UUID REFERENCES farms(id),
    collection_date DATE NOT NULL,
    collection_location GEOGRAPHY(POINT, 4326),
    depth_cm DECIMAL(5,2),
    sample_type VARCHAR(50) CHECK (sample_type IN ('SURFACE', 'SUBSURFACE', 'COMPOSITE')),
    collector_id UUID REFERENCES users(id),
    lab_id UUID REFERENCES laboratories(id),
    status VARCHAR(20) NOT NULL DEFAULT 'COLLECTED' CHECK (status IN ('COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'TESTING', 'COMPLETED', 'REJECTED')),
    test_requested_by VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_soil_samples_sample_number ON soil_samples(sample_number);
CREATE INDEX idx_soil_samples_farmer_id ON soil_samples(farmer_id);
CREATE INDEX idx_soil_samples_farm_id ON soil_samples(farm_id);
CREATE INDEX idx_soil_samples_status ON soil_samples(status);
CREATE INDEX idx_soil_samples_collection_date ON soil_samples(collection_date);
CREATE INDEX idx_soil_samples_location ON soil_samples USING GIST(collection_location);

```

#### Table: soil_test_results


```sql

CREATE TABLE soil_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL REFERENCES soil_samples(id),
    test_date DATE NOT NULL,
    tested_by UUID REFERENCES users(id),
    lab_id UUID REFERENCES laboratories(id),
    ph_level DECIMAL(4,2),
    electrical_conductivity DECIMAL(8,2),
    organic_carbon_percent DECIMAL(5,2),
    nitrogen_mg_kg DECIMAL(8,2),
    phosphorus_mg_kg DECIMAL(8,2),
    potassium_mg_kg DECIMAL(8,2),
    calcium_mg_kg DECIMAL(8,2),
    magnesium_mg_kg DECIMAL(8,2),
    sulfur_mg_kg DECIMAL(8,2),
    iron_mg_kg DECIMAL(8,2),
    manganese_mg_kg DECIMAL(8,2),
    zinc_mg_kg DECIMAL(8,2),
    copper_mg_kg DECIMAL(8,2),
    boron_mg_kg DECIMAL(8,2),
    soil_texture VARCHAR(50),
    water_holding_capacity VARCHAR(50),
    recommendations JSONB,
    fertilizer_recommendations JSONB,
    crop_recommendations JSONB,
    report_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'REJECTED', 'RETEST_REQUIRED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_sample_result UNIQUE (sample_id)
);

CREATE INDEX idx_soil_test_results_sample_id ON soil_test_results(sample_id);
CREATE INDEX idx_soil_test_results_test_date ON soil_test_results(test_date);
CREATE INDEX idx_soil_test_results_lab_id ON soil_test_results(lab_id);

```

---

### 10. Cooperatives

#### Table: cooperatives


```sql

CREATE TABLE cooperatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cooperative_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(50) UNIQUE,
    registration_date DATE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PRODUCER', 'MARKETING', 'PROCESSING', 'MULTI_PURPOSE')),
    category VARCHAR(50),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    block VARCHAR(100),
    village VARCHAR(100),
    address JSONB NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    total_members INTEGER DEFAULT 0,
    total_area DECIMAL(12,2),
    annual_turnover DECIMAL(15,2),
    certification_details JSONB,
    bank_account_number VARCHAR(20),
    bank_ifsc_code VARCHAR(11),
    gst_number VARCHAR(15),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cooperatives_cooperative_code ON cooperatives(cooperative_code);
CREATE INDEX idx_cooperatives_registration_number ON cooperatives(registration_number);
CREATE INDEX idx_cooperatives_type ON cooperatives(type);
CREATE INDEX idx_cooperatives_location ON cooperatives(state, district);
CREATE INDEX idx_cooperatives_status ON cooperatives(status);

```

---

### 11. Greenhouse Engineering

#### Table: greenhouses


```sql

CREATE TABLE greenhouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_code VARCHAR(20) UNIQUE NOT NULL,
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    farm_id UUID REFERENCES farms(id),
    greenhouse_type VARCHAR(50) NOT NULL CHECK (greenhouse_type IN ('POLYHOUSE', 'NET_HOUSE', 'GLASS_HOUSE', 'SHADE_NET')),
    structure_type VARCHAR(50),
    length_meters DECIMAL(8,2) NOT NULL,
    width_meters DECIMAL(8,2) NOT NULL,
    height_meters DECIMAL(8,2),
    area_sq_meters DECIMAL(10,2) NOT NULL,
    covering_material VARCHAR(100),
    frame_material VARCHAR(100),
    irrigation_system VARCHAR(50),
    ventilation_system VARCHAR(50),
    climate_control BOOLEAN DEFAULT FALSE,
    heating_system VARCHAR(50),
    cooling_system VARCHAR(50),
    automation_level VARCHAR(50),
    installation_date DATE,
    estimated_cost DECIMAL(15,2),
    subsidy_percentage DECIMAL(5,2),
    subsidy_amount DECIMAL(15,2),
    subsidy_scheme_id UUID REFERENCES government_schemes(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PLANNED', 'UNDER_CONSTRUCTION', 'ACTIVE', 'INACTIVE', 'DECOMMISSIONED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_greenhouses_greenhouse_code ON greenhouses(greenhouse_code);
CREATE INDEX idx_greenhouses_farmer_id ON greenhouses(farmer_id);
CREATE INDEX idx_greenhouses_farm_id ON greenhouses(farm_id);
CREATE INDEX idx_greenhouses_type ON greenhouses(greenhouse_type);
CREATE INDEX idx_greenhouses_status ON greenhouses(status);

```

#### Table: greenhouse_dpr


```sql

CREATE TABLE greenhouse_dpr (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dpr_number VARCHAR(20) UNIQUE NOT NULL,
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    project_name VARCHAR(200) NOT NULL,
    project_description TEXT,
    total_cost DECIMAL(15,2) NOT NULL,
    subsidy_amount DECIMAL(15,2),
    beneficiary_contribution DECIMAL(15,2),
    bank_loan_amount DECIMAL(15,2),
    technical_specifications JSONB NOT NULL,
    bill_of_quantities JSONB,
    timeline JSONB,
    expected_yield JSONB,
    cost_benefit_analysis JSONB,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'FUNDED')),
    submitted_date DATE,
    approved_date DATE,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_greenhouse_dpr_dpr_number ON greenhouse_dpr(dpr_number);
CREATE INDEX idx_greenhouse_dpr_greenhouse_id ON greenhouse_dpr(greenhouse_id);
CREATE INDEX idx_greenhouse_dpr_farmer_id ON greenhouse_dpr(farmer_id);
CREATE INDEX idx_greenhouse_dpr_status ON greenhouse_dpr(status);

```

---

### 12. Shared Infrastructure

#### Table: shared_assets


```sql

CREATE TABLE shared_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_code VARCHAR(20) UNIQUE NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('TRACTOR', 'HARVESTER', 'IRRIGATION_SYSTEM', 'PROCESSING_UNIT', 'COLD_STORAGE', 'WAREHOUSE', 'TRANSPORT', 'SOLAR_PANEL', 'OTHER')),
    category VARCHAR(50),
    specifications JSONB NOT NULL,
    purchase_date DATE,
    purchase_cost DECIMAL(15,2),
    current_value DECIMAL(15,2),
    depreciation_rate DECIMAL(5,2),
    condition VARCHAR(20) CHECK (condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR')),
    ownership_type VARCHAR(50) CHECK (ownership_type IN ('COOPERATIVE', 'COMPANY', 'PARTNER', 'GOVERNMENT')),
    owner_id UUID,
    location GEOGRAPHY(POINT, 4326),
    location_address JSONB,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE')),
    rental_rate_per_hour DECIMAL(10,2),
    rental_rate_per_day DECIMAL(10,2),
    security_deposit DECIMAL(10,2),
    insurance_details JSONB,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SOLD', 'SCRAPPED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_assets_asset_code ON shared_assets(asset_code);
CREATE INDEX idx_shared_assets_type ON shared_assets(asset_type);
CREATE INDEX idx_shared_assets_ownership_type ON shared_assets(ownership_type);
CREATE INDEX idx_shared_assets_availability_status ON shared_assets(availability_status);
CREATE INDEX idx_shared_assets_location ON shared_assets USING GIST(location);

```

#### Table: asset_rentals


```sql

CREATE TABLE asset_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_number VARCHAR(20) UNIQUE NOT NULL,
    asset_id UUID NOT NULL REFERENCES shared_assets(id),
    renter_id UUID NOT NULL REFERENCES users(id),
    renter_type VARCHAR(50) NOT NULL CHECK (renter_type IN ('FARMER', 'COOPERATIVE', 'BUSINESS')),
    rental_start_date DATE NOT NULL,
    rental_end_date DATE NOT NULL,
    rental_duration_hours DECIMAL(8,2),
    rental_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    security_deposit DECIMAL(10,2),
    security_deposit_returned BOOLEAN DEFAULT FALSE,
    purpose TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    pickup_location JSONB,
    return_location JSONB,
    pickup_date DATE,
    return_date DATE,
    damage_assessment JSONB,
    additional_charges DECIMAL(10,2),
    refund_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_rentals_rental_number ON asset_rentals(rental_number);
CREATE INDEX idx_asset_rentals_asset_id ON asset_rentals(asset_id);
CREATE INDEX idx_asset_rentals_renter_id ON asset_rentals(renter_id);
CREATE INDEX idx_asset_rentals_dates ON asset_rentals(rental_start_date, rental_end_date);
CREATE INDEX idx_asset_rentals_status ON asset_rentals(status);

```

---

### 13. Carbon Footprint

#### Table: carbon_footprints


```sql

CREATE TABLE carbon_footprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id),
    farm_id UUID REFERENCES farms(id),
    product_id UUID REFERENCES products(id),
    calculation_date DATE NOT NULL,
    calculation_period VARCHAR(20) CHECK (calculation_period IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    total_carbon_emission_kg DECIMAL(12,2),
    carbon_sequestration_kg DECIMAL(12,2),
    net_carbon_footprint_kg DECIMAL(12,2),
    emission_sources JSONB,
    sequestration_methods JSONB,
    carbon_credits_generated DECIMAL(12,2),
    carbon_credits_sold DECIMAL(12,2),
    carbon_credits_available DECIMAL(12,2),
    certification_status VARCHAR(20),
    certificate_url VARCHAR(500),
    ai_calculated BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carbon_footprints_farmer_id ON carbon_footprints(farmer_id);
CREATE INDEX idx_carbon_footprints_farm_id ON carbon_footprints(farm_id);
CREATE INDEX idx_carbon_footprints_calculation_date ON carbon_footprints(calculation_date);
CREATE INDEX idx_carbon_footprints_product_id ON carbon_footprints(product_id);

```

---

### 14. Weather

#### Table: weather_alerts


```sql

CREATE TABLE weather_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id VARCHAR(30) UNIQUE NOT NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('HEAT_WAVE', 'COLD_WAVE', 'HEAVY_RAIN', 'DROUGHT', 'STORM', 'FROST', 'FLOOD', 'WIND')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'EXTREME')),
    affected_regions JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    advisory TEXT,
    impact_assessment JSONB,
    recommended_actions TEXT[],
    source VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weather_alerts_alert_id ON weather_alerts(alert_id);
CREATE INDEX idx_weather_alerts_type ON weather_alerts(alert_type);
CREATE INDEX idx_weather_alerts_severity ON weather_alerts(severity);
CREATE INDEX idx_weather_alerts_dates ON weather_alerts(start_date, end_date);
CREATE INDEX idx_weather_alerts_status ON weather_alerts(status);
CREATE INDEX idx_weather_alerts_regions ON weather_alerts USING GIN(affected_regions);

```

#### Table: weather_data


```sql

CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location GEOGRAPHY(POINT, 4326),
    location_name VARCHAR(200),
    state VARCHAR(100),
    district VARCHAR(100),
    observation_date DATE NOT NULL,
    observation_time TIMESTAMP NOT NULL,
    temperature_celsius DECIMAL(5,2),
    humidity_percent DECIMAL(5,2),
    wind_speed_kmh DECIMAL(5,2),
    wind_direction VARCHAR(10),
    rainfall_mm DECIMAL(5,2),
    pressure_hpa DECIMAL(7,2),
    visibility_km DECIMAL(5,2),
    cloud_cover_percent DECIMAL(5,2),
    uv_index DECIMAL(3,2),
    soil_moisture_percent DECIMAL(5,2),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weather_data_location ON weather_data USING GIST(location);
CREATE INDEX idx_weather_data_observation_date ON weather_data(observation_date);
CREATE INDEX idx_weather_data_state_district ON weather_data(state, district);

```

---

### 15. Notifications

#### Table: notifications


```sql

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('ORDER', 'PAYMENT', 'SHIPMENT', 'SCHEME', 'TRAINING', 'WEATHER', 'SYSTEM', 'PROMOTION')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    channels TEXT[] NOT NULL DEFAULT ARRAY['IN_APP'],
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    sms_sent_at TIMESTAMP,
    push_sent_at TIMESTAMP,
    expires_at TIMESTAMP,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);

```

---

## Database Relationships

### Entity Relationship Diagram (ERD)

```
users (1) ----< (N) user_roles
users (1) ----< (N) user_permissions
users (1) ----< (N) user_sessions
users (1) ----< (N) audit_logs
users (1) ----< (N) farmers
users (1) ----< (N) orders
users (1) ----< (N) accounts
users (1) ----< (N) loans
users (1) ----< (N) insurance_policies
users (1) ----< (N) insurance_claims
users (1) ----< (N) scheme_applications
users (1) ----< (N) reviews
users (1) ----< (N) notifications

farmers (1) ----< (N) farms
farmers (1) ----< (N) farmer_training
farmers (1) ----< (N) products
farmers (1) ----< (N) soil_samples
farmers (1) ----< (N) carbon_footprints
farmers (1) ----< (N) greenhouses
farmers (1) ----< (N) greenhouse_dpr

farms (1) ----< (N) products
farms (1) ----< (N) soil_samples
farms (1) ----< (N) greenhouses

products (1) ----< (N) order_items
products (1) ----< (N) reviews
products (1) ----< (N) carbon_footprints

orders (1) ----< (N) order_items
orders (1) ----< (N) shipments
orders (1) ----< (N) reviews

accounts (1) ----< (N) transactions
accounts (1) ----< (N) loans

loans (1) ----< (N) loan_repayments

insurance_policies (1) ----< (N) insurance_claims

government_schemes (1) ----< (N) scheme_applications
government_schemes (1) ----< (N) loans
government_schemes (1) ----< (N) insurance_policies
government_schemes (1) ----< (N) greenhouses

training_programs (1) ----< (N) farmer_training

soil_samples (1) ----< (1) soil_test_results

cooperatives (1) ----< (N) farmers
cooperatives (1) ----< (N) shared_assets

greenhouses (1) ----< (N) greenhouse_dpr

shared_assets (1) ----< (N) asset_rentals

```

---

## Database Indexes

### Index Strategy

**Primary Indexes**: All tables have primary key indexes on UUID columns
**Unique Indexes**: Enforce data uniqueness on business keys
**Foreign Key Indexes**: Optimize join operations
**Composite Indexes**: Optimize common query patterns
**GIN Indexes**: Full-text search and JSONB queries
**GiST Indexes**: Geospatial queries

### Index Maintenance

**Reindex**: Weekly during low-traffic periods
**Analyze**: Daily statistics collection
**Vacuum**: Weekly to reclaim space
**Monitor**: Index usage statistics

---

## Database Constraints

### Types of Constraints

**Primary Key Constraints**: Ensure unique identification
**Foreign Key Constraints**: Maintain referential integrity
**Unique Constraints**: Enforce business rules
**Check Constraints**: Validate data values
**Not Null Constraints**: Ensure required fields
**Exclusion Constraints**: Advanced validation

### Constraint Enforcement

**Immediate**: All constraints enforced immediately
**Deferrable**: Some constraints can be deferred for transactions
**Validation**: Application-level validation before database operations

---

## Database Triggers

### Audit Triggers

#### Trigger: audit_user_changes


```sql

CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES (NEW.id, 'CREATE', 'USER', NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES (NEW.id, 'UPDATE', 'USER', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values)
        VALUES (OLD.id, 'DELETE', 'USER', OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_user_changes
    BEFORE INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_user_changes();

```

#### Trigger: audit_order_changes


```sql

CREATE OR REPLACE FUNCTION audit_order_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
        VALUES (NEW.user_id, 'CREATE', 'ORDER', NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES (NEW.user_id, 'UPDATE', 'ORDER', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_order_changes
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_order_changes();

```

### Business Logic Triggers

#### Trigger: update_product_rating


```sql

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    rating_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'APPROVED' AND OLD.status != 'APPROVED') THEN
        SELECT AVG(rating), COUNT(*)
        INTO avg_rating, rating_count
        FROM reviews
        WHERE product_id = NEW.product_id AND status = 'APPROVED';
        
        UPDATE products
        SET rating_average = avg_rating,
            rating_count = rating_count
        WHERE id = NEW.product_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND NEW.status != 'APPROVED' AND OLD.status = 'APPROVED' THEN
        SELECT AVG(rating), COUNT(*)
        INTO avg_rating, rating_count
        FROM reviews
        WHERE product_id = NEW.product_id AND status = 'APPROVED';
        
        UPDATE products
        SET rating_average = COALESCE(avg_rating, 0),
            rating_count = COALESCE(rating_count, 0)
        WHERE id = NEW.product_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT AVG(rating), COUNT(*)
        INTO avg_rating, rating_count
        FROM reviews
        WHERE product_id = OLD.product_id AND status = 'APPROVED';
        
        UPDATE products
        SET rating_average = COALESCE(avg_rating, 0),
            rating_count = COALESCE(rating_count, 0)
        WHERE id = OLD.product_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

```

#### Trigger: update_account_balance


```sql

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'COMPLETED' THEN
        IF NEW.transaction_type = 'CREDIT' THEN
            UPDATE accounts
            SET balance = balance + NEW.amount
            WHERE id = NEW.account_id;
        ELSIF NEW.transaction_type = 'DEBIT' THEN
            UPDATE accounts
            SET balance = balance - NEW.amount
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        IF NEW.transaction_type = 'CREDIT' THEN
            UPDATE accounts
            SET balance = balance + NEW.amount
            WHERE id = NEW.account_id;
        ELSIF NEW.transaction_type = 'DEBIT' THEN
            UPDATE accounts
            SET balance = balance - NEW.amount
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

```

#### Trigger: update_timestamps


```sql

CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER trigger_update_users_timestamps
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER trigger_update_farmers_timestamps
    BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER trigger_update_products_timestamps
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER trigger_update_orders_timestamps
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamps();

```

---

## Audit Architecture

### Audit Strategy

**Comprehensive Logging**: All data changes logged
**Immutable Records**: Audit logs cannot be modified
**Queryable**: Easy to query and analyze
**Compliance**: Meets regulatory requirements

### Audit Log Schema

**Fields**:
- id: Unique identifier
- user_id: User who performed action
- action: Type of action (CREATE, UPDATE, DELETE)
- resource_type: Type of resource affected
- resource_id: ID of resource affected
- old_values: Previous values (for UPDATE, DELETE)
- new_values: New values (for CREATE, UPDATE)
- ip_address: IP address of request
- user_agent: User agent of request
- created_at: Timestamp of action
- metadata: Additional context

### Audit Retention

**Active Data**: 1 year
**Archive Data**: 7 years
**Compliance Data**: Permanent for critical events

### Audit Query Examples

**User Activity**:

```sql

SELECT * FROM audit_logs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 100;

```

**Resource History**:

```sql

SELECT * FROM audit_logs
WHERE resource_type = 'ORDER'
AND resource_id = 'order-uuid'
ORDER BY created_at;

```

**Security Events**:

```sql

SELECT * FROM audit_logs
WHERE action IN ('DELETE', 'UPDATE')
AND resource_type = 'USER'
ORDER BY created_at DESC;

```

---

## Database Security

### Security Measures

**Encryption at Rest**: AES-256 encryption
**Encryption in Transit**: TLS 1.3
**Row-Level Security**: Implement RLS policies
**Data Masking**: Sensitive data masking
**Access Control**: Principle of least privilege

### Security Policies

**Network Security**: VPC, security groups
**Authentication**: IAM roles, MFA
**Authorization**: RBAC, ABAC
**Auditing**: CloudTrail, audit logs

---

## Database Performance

### Performance Optimization

**Query Optimization**: Explain analyze, query tuning
**Index Optimization**: Proper indexing strategy
**Connection Pooling**: PgBouncer connection pooler
**Caching**: Redis caching layer
**Read Replicas**: Offload read queries

### Performance Monitoring

**Metrics**: CPU, memory, I/O, connections
**Slow Queries**: Identify and optimize
**Index Usage**: Monitor index efficiency
**Cache Hit Ratio**: Monitor cache performance

---

## Database Backup and Recovery

### Backup Strategy

**Automated Backups**: Daily automated backups
**Point-in-Time Recovery**: 7-day PITR window
**Cross-Region Replication**: Disaster recovery
**Backup Verification**: Regular restore testing

### Recovery Objectives

**RPO**: 1 hour (Recovery Point Objective)
**RTO**: 4 hours (Recovery Time Objective)
**Testing**: Monthly recovery testing
**Documentation**: Recovery runbooks

---

## Conclusion

The AFRERA database architecture provides a comprehensive foundation for the integrated platform, supporting ERP, Marketplace, Supply Chain, Finance, Banking, Insurance, AI Decision Support, Organic Traceability, Government Scheme Intelligence, Farmer Advisory, Cooperative Management, Logistics, Analytics, Compliance, and Governance. The architecture is designed for scalability, performance, security, and compliance, with comprehensive audit logging and disaster recovery capabilities.
