-- Farmer Groups Schema (M024)
-- Farmer producer groups and cooperatives management

CREATE TABLE IF NOT EXISTS farmer_groups (
    group_id VARCHAR(50) PRIMARY KEY,
    group_name VARCHAR(200) NOT NULL,
    group_code VARCHAR(50) UNIQUE NOT NULL,
    group_type VARCHAR(50) NOT NULL,
    registration_number VARCHAR(100),
    registration_date DATE,
    district VARCHAR(50),
    state VARCHAR(50),
    village VARCHAR(100),
    address TEXT,
    leader_id VARCHAR(50),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    established_date DATE,
    total_members INTEGER DEFAULT 0,
    objectives JSONB,
    bylaws JSONB,
    bank_account_details JSONB,
    ai_group_health_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_memberships (
    membership_id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL REFERENCES farmer_groups(group_id),
    farmer_id VARCHAR(50) NOT NULL,
    membership_type VARCHAR(50),
    role VARCHAR(50),
    join_date DATE NOT NULL,
    contribution_amount DECIMAL(15,2),
    share_percentage DECIMAL(5,2),
    voting_rights BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_meetings (
    meeting_id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL REFERENCES farmer_groups(group_id),
    meeting_type VARCHAR(50),
    meeting_date DATE NOT NULL,
    meeting_time TIME,
    location VARCHAR(200),
    agenda JSONB,
    attendees JSONB,
    minutes TEXT,
    decisions JSONB,
    action_items JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_finances (
    finance_id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL REFERENCES farmer_groups(group_id),
    transaction_type VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    transaction_date DATE NOT NULL,
    reference_number VARCHAR(100),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmer_groups_district ON farmer_groups(district);
CREATE INDEX idx_farmer_groups_state ON farmer_groups(state);
CREATE INDEX idx_farmer_groups_status ON farmer_groups(status);
CREATE INDEX idx_group_memberships_group ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_farmer ON group_memberships(farmer_id);
CREATE INDEX idx_group_meetings_group ON group_meetings(group_id);
CREATE INDEX idx_group_meetings_date ON group_meetings(meeting_date);
CREATE INDEX idx_group_finances_group ON group_finances(group_id);
CREATE INDEX idx_group_finances_date ON group_finances(transaction_date);
