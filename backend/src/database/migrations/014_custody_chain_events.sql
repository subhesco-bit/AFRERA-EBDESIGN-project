-- Custody Chain Events Migration
-- 
-- ASSUMPTIONS FLAGGED:
-- The original source specified 5 named lifecycle milestones (Job.Offered through Settlement.Instructions)
-- and mentioned 11 status types + 8 exception types without full detail. This migration implements
-- a reasonable superset based on common logistics custody patterns. The vocabulary below should
-- be verified against the actual source document when available.
--
-- Lifecycle Statuses (11):
-- 1. job_offered - Initial job/offer created
-- 2. job_accepted - Offer accepted by carrier
-- 3. pickup_scheduled - Pickup time confirmed
-- 4. pickup_confirmed - Goods picked up from origin
-- 5. in_transit - Goods in transit
-- 6. out_for_delivery - Out for final delivery
-- 7. delivery_attempted - Delivery attempted
-- 8. delivery_confirmed - Delivery confirmed by recipient
-- 9. settlement_pending - Settlement calculation pending
-- 10. settlement_ready - Settlement instructions ready
-- 11. settlement_complete - Settlement execution confirmed
--
-- Exception Types (8):
-- 1. pickup_delayed - Pickup delayed
-- 2. transit_delayed - Transit delayed
-- 3. delivery_failed - Delivery failed
-- 4. goods_damaged - Goods damaged in transit
-- 5. goods_lost - Goods lost
-- 6. carrier_rejected - Carrier rejected job
-- 7. documentation_missing - Required documentation missing
-- 8. dispute_raised - Dispute raised by party

-- Create custody event type enum
CREATE TYPE custody_event_type AS ENUM (
  -- Lifecycle statuses
  'job_offered',
  'job_accepted',
  'pickup_scheduled',
  'pickup_confirmed',
  'in_transit',
  'out_for_delivery',
  'delivery_attempted',
  'delivery_confirmed',
  'settlement_pending',
  'settlement_ready',
  'settlement_complete',
  -- Exception types
  'pickup_delayed',
  'transit_delayed',
  'delivery_failed',
  'goods_damaged',
  'goods_lost',
  'carrier_rejected',
  'documentation_missing',
  'dispute_raised'
);

-- Create custody chain events table
CREATE TABLE IF NOT EXISTS custody_chain_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL,
  event_type custody_event_type NOT NULL,
  event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_data JSONB,
  
  -- Hash chain integrity
  previous_event_hash VARCHAR(64),
  current_event_hash VARCHAR(64) NOT NULL,
  
  -- Metadata
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Settlement instruction reference (for settlement-related events)
  settlement_instruction_id UUID,
  
  -- Constraints
  -- NOTE: settlement_instruction_id -> settlement_instructions FK is added via ALTER TABLE
  -- below (after that table is created) since settlement_instructions doesn't exist yet here.
  CONSTRAINT fk_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  CONSTRAINT fk_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Indexes for efficient queries
CREATE INDEX idx_custody_chain_shipment ON custody_chain_events(shipment_id);
CREATE INDEX idx_custody_chain_type ON custody_chain_events(event_type);
CREATE INDEX idx_custody_chain_timestamp ON custody_chain_events(event_timestamp DESC);
CREATE INDEX idx_custody_chain_hash ON custody_chain_events(current_event_hash);
CREATE INDEX idx_custody_chain_settlement ON custody_chain_events(settlement_instruction_id);

-- Create settlement instructions table
CREATE TABLE IF NOT EXISTS settlement_instructions (
  instruction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL,
  custody_event_id UUID NOT NULL,
  
  -- Settlement details
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payer_account VARCHAR(255),
  payee_account VARCHAR(255),
  settlement_type VARCHAR(50) NOT NULL, -- 'carrier_payment', 'refund', 'penalty', etc.
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'issued', 'confirmed', 'failed', 'cancelled')),
  
  -- Metadata
  reference_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  issued_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  confirmed_by UUID,
  
  -- Constraints
  CONSTRAINT fk_settlement_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  CONSTRAINT fk_settlement_custody_event FOREIGN KEY (custody_event_id) REFERENCES custody_chain_events(event_id) ON DELETE CASCADE,
  CONSTRAINT fk_settlement_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

-- Indexes for settlement instructions
CREATE INDEX idx_settlement_shipment ON settlement_instructions(shipment_id);
CREATE INDEX idx_settlement_status ON settlement_instructions(status);
CREATE INDEX idx_settlement_type ON settlement_instructions(settlement_type);
CREATE INDEX idx_settlement_reference ON settlement_instructions(reference_number);

-- Deferred FK: custody_chain_events.settlement_instruction_id -> settlement_instructions.instruction_id
-- (added here, not on custody_chain_events itself, since settlement_instructions didn't exist yet at that point)
ALTER TABLE custody_chain_events
  ADD CONSTRAINT fk_settlement_instruction
  FOREIGN KEY (settlement_instruction_id) REFERENCES settlement_instructions(instruction_id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TYPE custody_event_type IS 'Custody event types including lifecycle statuses and exceptions (ASSUMED vocabulary - verify with source)';
COMMENT ON TABLE custody_chain_events IS 'Immutable chain of custody events with hash-based integrity verification';
COMMENT ON COLUMN custody_chain_events.previous_event_hash IS 'Hash of previous event for chain integrity';
COMMENT ON COLUMN custody_chain_events.current_event_hash IS 'SHA-256 hash of this event for tamper evidence';
COMMENT ON TABLE settlement_instructions IS 'Settlement instructions that record what should happen without moving actual money';
COMMENT ON COLUMN settlement_instructions.status IS 'pending: created but not issued, issued: sent to payment system, confirmed: execution verified, failed: execution failed, cancelled: cancelled before execution';
