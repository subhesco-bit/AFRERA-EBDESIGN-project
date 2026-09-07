-- Blockchain Traceability OS Database Schema
-- Manages blockchain-based product traceability and immutable records

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- BLOCKCHAIN TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    block_hash VARCHAR(66),
    transaction_index INTEGER,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    gas_used BIGINT,
    gas_price DECIMAL(20, 0),
    transaction_fee DECIMAL(20, 0),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_blockchain_transactions_block ON blockchain_transactions(block_number);
CREATE INDEX idx_blockchain_transactions_status ON blockchain_transactions(status);

-- ============================================================================
-- TRACEABILITY EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS traceability_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    event_type VARCHAR(50) NOT NULL, -- 'harvest', 'processing', 'packaging', 'shipping', 'delivery', 'sale'
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location_id UUID REFERENCES addresses(id),
    actor_id UUID REFERENCES users(id),
    actor_type VARCHAR(50), -- 'farmer', 'processor', 'distributor', 'retailer'
    transaction_hash VARCHAR(66) REFERENCES blockchain_transactions(transaction_hash),
    event_data JSONB NOT NULL,
    ipfs_hash VARCHAR(64),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_traceability_events_product ON traceability_events(product_id);
CREATE INDEX idx_traceability_events_batch ON traceability_events(batch_number);
CREATE INDEX idx_traceability_events_transaction ON traceability_events(transaction_hash);

-- ============================================================================
-- CHAIN OF CUSTODY
-- ============================================================================

CREATE TABLE IF NOT EXISTS chain_of_custody (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    current_holder_id UUID REFERENCES users(id),
    holder_type VARCHAR(50), -- 'farmer', 'fpo', 'processor', 'distributor', 'retailer', 'consumer'
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    from_holder_id UUID REFERENCES users(id),
    transaction_hash VARCHAR(66) REFERENCES blockchain_transactions(transaction_hash),
    transfer_document_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chain_of_custody_product ON chain_of_custody(product_id);
CREATE INDEX idx_chain_of_custody_batch ON chain_of_custody(batch_number);
CREATE INDEX idx_chain_of_custody_holder ON chain_of_custody(current_holder_id);

-- ============================================================================
-- BLOCKCHAIN CERTIFICATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS blockchain_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_type VARCHAR(50) NOT NULL, -- 'organic', 'gi', 'quality', 'safety'
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    product_id UUID REFERENCES products(id),
    batch_number VARCHAR(100),
    issuer_id UUID REFERENCES users(id),
    issuer_name VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    certificate_data JSONB NOT NULL,
    transaction_hash VARCHAR(66) REFERENCES blockchain_transactions(transaction_hash),
    ipfs_hash VARCHAR(64),
    is_revoked BOOLEAN DEFAULT FALSE,
    revocation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blockchain_certificates_product ON blockchain_certificates(product_id);
CREATE INDEX idx_blockchain_certificates_number ON blockchain_certificates(certificate_number);

-- ============================================================================
-- SMART CONTRACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS smart_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    contract_name VARCHAR(100) NOT NULL,
    contract_type VARCHAR(50) NOT NULL, -- 'traceability', 'certification', 'payment', 'escrow'
    abi JSONB NOT NULL,
    deployed_by VARCHAR(42),
    deployment_tx_hash VARCHAR(66),
    deployment_block BIGINT,
    network VARCHAR(50), -- 'mainnet', 'testnet', 'private'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_smart_contracts_address ON smart_contracts(contract_address);
CREATE INDEX idx_smart_contracts_type ON smart_contracts(contract_type);

-- ============================================================================
-- BLOCKCHAIN ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS blockchain_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_transactions INTEGER DEFAULT 0,
    confirmed_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    total_gas_used BIGINT DEFAULT 0,
    average_gas_price DECIMAL(20, 0),
    total_traceability_events INTEGER DEFAULT 0,
    total_certificates_issued INTEGER DEFAULT 0,
    unique_products_tracked INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blockchain_analytics_date ON blockchain_analytics(date);

-- ============================================================================
-- VERIFICATION REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    batch_number VARCHAR(100),
    certificate_id UUID REFERENCES blockchain_certificates(id),
    requested_by UUID REFERENCES users(id),
    request_type VARCHAR(50) NOT NULL, -- 'traceability', 'authenticity', 'certificate'
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    verification_result JSONB,
    blockchain_proof JSONB,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_requests_product ON verification_requests(product_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(verification_status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate transaction hash (simplified)
CREATE OR REPLACE FUNCTION generate_transaction_hash()
RETURNS VARCHAR(66) AS $$
DECLARE
    hash VARCHAR(66);
BEGIN
    hash := '0x' || upper(encode(digest(random()::TEXT || CURRENT_TIMESTAMP::TEXT, 'sha256'), 'hex'));
    RETURN hash;
END;
$$ LANGUAGE plpgsql;

-- Function to verify chain of custody
CREATE OR REPLACE FUNCTION verify_chain_of_custody(product_id UUID, batch_number VARCHAR)
RETURNS JSONB AS $$
DECLARE
    chain RECORD;
    is_complete BOOLEAN;
    result JSONB;
BEGIN
    -- Get chain of custody records
    SELECT jsonb_agg(c) INTO chain
    FROM chain_of_custody c
    WHERE c.product_id = product_id 
    AND c.batch_number = batch_number
    ORDER BY c.transfer_date ASC;
    
    -- Check if chain is complete (simplified)
    is_complete := true;
    
    result := jsonb_build_object(
        'is_complete', is_complete,
        'chain', chain,
        'verified_at', CURRENT_TIMESTAMP
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
