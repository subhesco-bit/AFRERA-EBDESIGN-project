-- ============================================================================
-- 994_recovered_capabilities.sql   (2026-08-04)
--
-- Capabilities that existed in the pre-v43 lineage (`ne (3).zip`) and have NO
-- table anywhere in the current backend. Verified absent 2026-08-04.
--
-- These were found by scanning for BUSINESS CAPABILITY rather than for code
-- worth copying. Each was implemented in the prototype as UI functions
-- (reserveCSA, redeemIncentivePool, buildGiftHamper, bookColdStorage,
-- openWallet/renderWallet, selectPortal) — the implementations belong to a
-- single-file HTML app and are not worth porting, but the capabilities are.
--
-- Numbered 994 so it runs before the ERP process layer (995) and enterprise
-- foundation (996). Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CSA — Community Supported Agriculture
-- A consumer subscribes to a season's harvest IN ADVANCE, which moves working
-- capital to the farmer before planting and shares crop risk. That risk-sharing
-- is the whole point of the model, so it is recorded explicitly rather than
-- being treated as an ordinary pre-order.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS csa_subscriptions (
    id SERIAL PRIMARY KEY,
    subscription_code VARCHAR(40) UNIQUE NOT NULL,
    subscriber_id VARCHAR(100) NOT NULL,
    farmer_id VARCHAR(100),
    fpo_id VARCHAR(100),
    season VARCHAR(40) NOT NULL,              -- e.g. 'kharif-2026'
    share_size VARCHAR(20) NOT NULL DEFAULT 'full'
        CHECK (share_size IN ('half','full','double')),
    amount_committed NUMERIC(20,4) NOT NULL CHECK (amount_committed > 0),
    amount_paid NUMERIC(20,4) NOT NULL DEFAULT 0,
    delivery_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly'
        CHECK (delivery_frequency IN ('weekly','fortnightly','monthly')),
    -- The subscriber accepts that a poor season means a smaller share. This
    -- must be an explicit, recorded acceptance, not fine print.
    risk_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    risk_acknowledged_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','active','fulfilling','completed','cancelled','crop_failed')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (amount_paid <= amount_committed),
    -- Cannot activate a risk-sharing subscription without the subscriber
    -- acknowledging the risk.
    CONSTRAINT csa_requires_risk_ack CHECK (
        status = 'pending' OR risk_acknowledged = TRUE
    )
);

CREATE TABLE IF NOT EXISTS csa_deliveries (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES csa_subscriptions(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    delivered_date DATE,
    contents JSONB DEFAULT '[]',
    -- A short-share delivery must say why. A subscriber who committed capital
    -- in advance is owed an explanation, not a smaller box.
    was_short BOOLEAN DEFAULT FALSE,
    shortfall_reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled','packed','delivered','missed','substituted')),
    CONSTRAINT csa_short_needs_reason CHECK (
        was_short = FALSE OR (shortfall_reason IS NOT NULL AND length(trim(shortfall_reason)) > 0)
    )
);

-- ---------------------------------------------------------------------------
-- Incentive pools — collective (FPO/village) rewards
-- Distinct from individual loyalty points: a pool accrues to a GROUP and is
-- distributed by an agreed rule, which is how cooperative economics works.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS incentive_pools (
    id SERIAL PRIMARY KEY,
    pool_code VARCHAR(40) UNIQUE NOT NULL,
    pool_name VARCHAR(255) NOT NULL,
    owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('fpo','village','shg','cooperative')),
    owner_id VARCHAR(100) NOT NULL,
    balance_points NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (balance_points >= 0),
    balance_rupees NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (balance_rupees >= 0),
    distribution_rule VARCHAR(30) NOT NULL DEFAULT 'equal'
        CHECK (distribution_rule IN ('equal','by_volume','by_quality','by_tenure','committee')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incentive_pool_transactions (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER NOT NULL REFERENCES incentive_pools(id) ON DELETE CASCADE,
    txn_type VARCHAR(20) NOT NULL CHECK (txn_type IN ('accrual','distribution','adjustment','expiry')),
    points NUMERIC(18,2) NOT NULL DEFAULT 0,
    rupees NUMERIC(20,4) NOT NULL DEFAULT 0,
    beneficiary_id VARCHAR(100),
    reason TEXT NOT NULL,
    -- Distributing collective money requires a named human, never automation.
    approved_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pool_distribution_needs_approval CHECK (
        txn_type <> 'distribution' OR approved_by IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- Gift hampers — including B2B / ESG gifting
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gift_hampers (
    id SERIAL PRIMARY KEY,
    hamper_code VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    occasion VARCHAR(40),                     -- see merchandisingService OCCASIONS
    recipient_segment VARCHAR(30)
        CHECK (recipient_segment IN ('executive','employee','client','family','diplomatic','general')),
    budget_band VARCHAR(20),
    items JSONB NOT NULL DEFAULT '[]',
    base_price NUMERIC(20,4) NOT NULL DEFAULT 0,
    is_customisable BOOLEAN DEFAULT TRUE,
    -- Corporate/ESG gifting frequently needs provenance evidence for reporting.
    includes_provenance_certificate BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gift_hamper_orders (
    id SERIAL PRIMARY KEY,
    hamper_id INTEGER REFERENCES gift_hampers(id) ON DELETE SET NULL,
    order_reference VARCHAR(100),
    buyer_id VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    personalisation JSONB DEFAULT '{}',
    delivery_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','confirmed','packing','dispatched','delivered','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Cold storage bay booking
-- Village-level cold nodes are a scarce shared resource; booking prevents the
-- allocation conflicts that spoil produce.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cold_storage_bays (
    id SERIAL PRIMARY KEY,
    bay_code VARCHAR(40) UNIQUE NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    village_centre_id VARCHAR(100),
    capacity_kg NUMERIC(12,2) NOT NULL CHECK (capacity_kg > 0),
    min_temp_c NUMERIC(5,2),
    max_temp_c NUMERIC(5,2),
    latitude DECIMAL(10,7),
    longitude DECIMAL(11,7),
    is_operational BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (max_temp_c IS NULL OR min_temp_c IS NULL OR max_temp_c >= min_temp_c)
);

CREATE TABLE IF NOT EXISTS cold_storage_bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(40) UNIQUE NOT NULL,
    bay_id INTEGER NOT NULL REFERENCES cold_storage_bays(id) ON DELETE RESTRICT,
    booked_by VARCHAR(100) NOT NULL,
    booked_from TIMESTAMP NOT NULL,
    booked_to TIMESTAMP NOT NULL,
    quantity_kg NUMERIC(12,2) NOT NULL CHECK (quantity_kg > 0),
    produce_type VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'reserved'
        CHECK (status IN ('reserved','confirmed','in_use','completed','cancelled','no_show')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (booked_to > booked_from)
);

-- Prevent double-booking beyond bay capacity for an overlapping window.
-- Two farmers each told their produce is safe, when only one bay exists, is
-- how a harvest is lost.
CREATE OR REPLACE FUNCTION assert_bay_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity NUMERIC(12,2);
    v_booked NUMERIC(12,2);
BEGIN
    IF NEW.status IN ('cancelled','no_show','completed') THEN
        RETURN NEW;
    END IF;

    SELECT capacity_kg INTO v_capacity FROM cold_storage_bays WHERE id = NEW.bay_id;

    SELECT COALESCE(SUM(quantity_kg), 0) INTO v_booked
      FROM cold_storage_bookings
     WHERE bay_id = NEW.bay_id
       AND id <> COALESCE(NEW.id, -1)
       AND status IN ('reserved','confirmed','in_use')
       AND booked_from < NEW.booked_to
       AND booked_to   > NEW.booked_from;

    IF v_booked + NEW.quantity_kg > v_capacity THEN
        RAISE EXCEPTION
          'Cold bay % over capacity for that window: % kg already booked + % kg requested exceeds % kg.',
          NEW.bay_id, v_booked, NEW.quantity_kg, v_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bay_capacity ON cold_storage_bookings;
DROP TRIGGER IF EXISTS trg_bay_capacity ON cold_storage_bookings;
CREATE TRIGGER trg_bay_capacity BEFORE INSERT OR UPDATE ON cold_storage_bookings
    FOR EACH ROW EXECUTE FUNCTION assert_bay_capacity();

-- ---------------------------------------------------------------------------
-- Wallet — the header table was missing (wallet_transactions already exists)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('user','farmer','fpo','vendor')),
    owner_id VARCHAR(100) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    balance NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    loyalty_points NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    is_frozen BOOLEAN DEFAULT FALSE,
    frozen_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (owner_type, owner_id, currency),
    -- Freezing someone's money must always carry a stated reason.
    CONSTRAINT wallet_freeze_needs_reason CHECK (
        is_frozen = FALSE OR (frozen_reason IS NOT NULL AND length(trim(frozen_reason)) > 0)
    )
);

-- ---------------------------------------------------------------------------
-- Portal roles — the multi-tenant map (12 roles from the lineage)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS portal_roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    default_landing_route VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_csa_subscriber ON csa_subscriptions (subscriber_id, status);
CREATE INDEX IF NOT EXISTS idx_csa_farmer ON csa_subscriptions (farmer_id);
CREATE INDEX IF NOT EXISTS idx_csa_deliveries_sub ON csa_deliveries (subscription_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_pool_owner ON incentive_pools (owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_pool_txn_pool ON incentive_pool_transactions (pool_id);
CREATE INDEX IF NOT EXISTS idx_hamper_occasion ON gift_hampers (occasion, is_active);
CREATE INDEX IF NOT EXISTS idx_hamper_orders_buyer ON gift_hamper_orders (buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_bay_village ON cold_storage_bays (village_centre_id);
CREATE INDEX IF NOT EXISTS idx_bay_lat_lng ON cold_storage_bays (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bookings_bay_window ON cold_storage_bookings (bay_id, booked_from, booked_to);
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets (owner_type, owner_id);
