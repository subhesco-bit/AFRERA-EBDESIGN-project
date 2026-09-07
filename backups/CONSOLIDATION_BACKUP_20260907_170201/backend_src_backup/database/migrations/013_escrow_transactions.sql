-- Escrow Transactions Table
-- Manages fund holding for secure transactions between buyers and farmers

CREATE TABLE IF NOT EXISTS escrow_transactions (
    escrow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(255) NOT NULL,
    buyer_id UUID NOT NULL,
    farmer_id UUID NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    payment_reference VARCHAR(255),
    release_conditions JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'refunded', 'cancelled')),
    release_data JSONB,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_escrow_order_id ON escrow_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_farmer_id ON escrow_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_created_at ON escrow_transactions(created_at DESC);

-- Add comments
COMMENT ON TABLE escrow_transactions IS 'Holds funds in escrow until delivery confirmation';
COMMENT ON COLUMN escrow_transactions.escrow_id IS 'Unique identifier for the escrow transaction';
COMMENT ON COLUMN escrow_transactions.order_id IS 'Reference to the associated order';
COMMENT ON COLUMN escrow_transactions.buyer_id IS 'User ID of the buyer who deposited funds';
COMMENT ON COLUMN escrow_transactions.farmer_id IS 'User ID of the farmer who will receive funds';
COMMENT ON COLUMN escrow_transactions.amount IS 'Amount held in escrow';
COMMENT ON COLUMN escrow_transactions.currency IS 'Currency code (default: INR)';
COMMENT ON COLUMN escrow_transactions.payment_reference IS 'External payment gateway reference';
COMMENT ON COLUMN escrow_transactions.release_conditions IS 'Conditions that must be met for fund release';
COMMENT ON COLUMN escrow_transactions.status IS 'Current state: pending, released, refunded, cancelled';
COMMENT ON COLUMN escrow_transactions.release_data IS 'Data recorded when funds were released';
COMMENT ON COLUMN escrow_transactions.released_at IS 'Timestamp when funds were released to farmer';
COMMENT ON COLUMN escrow_transactions.refunded_at IS 'Timestamp when funds were refunded to buyer';
COMMENT ON COLUMN escrow_transactions.refund_reason IS 'Reason for refund';
