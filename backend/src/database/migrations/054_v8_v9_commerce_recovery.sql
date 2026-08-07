-- ============================================================================
-- 054_v8_v9_commerce_recovery.sql   (2026-08-05)
--
-- Recovered from the ne_harvest v8/v9 OS lineage (28 unique HTML prototypes
-- scanned; 426 business functions found absent from the backend, of which the
-- ones below carry concepts the schema had no home for).
--
-- MOST OF THAT LINEAGE IS UI, AND IS DELIBERATELY NOT PORTED.
--
-- bookColdStorage() swaps a badge to "Booked ✓". signContract() swaps a badge
-- to "Signed ✓". reserveHarvest() shows a toast. They look like features and
-- they persist nothing — porting them would move the illusion into the
-- backend rather than build the thing. The four concepts below are different:
-- each is a commercial commitment that has to survive a page reload, and none
-- of them has a table anywhere in this chain.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. CART PRICE FREEZE
--
-- v9 locks a price into the cart for a fixed window (cartFreezeRemainingMs).
-- On a platform whose prices move with a live market this is not a convenience
-- — it is the difference between a quote and a moving target. A buyer filling
-- a basket over ten minutes must not be repriced underneath.
--
-- The freeze is a liability: if the market moves against the platform inside
-- the window, the platform absorbs it. So the window has to be bounded and
-- recorded, not implied by client-side state that a refresh discards.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cart_price_locks (
    id BIGSERIAL PRIMARY KEY,
    cart_id VARCHAR(80) NOT NULL,
    user_id UUID,
    product_id VARCHAR(80) NOT NULL,

    locked_price_inr NUMERIC(12,2) NOT NULL CHECK (locked_price_inr > 0),
    market_price_at_lock_inr NUMERIC(12,2) NOT NULL CHECK (market_price_at_lock_inr > 0),
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),

    locked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Bounded on purpose. An unbounded freeze is a free option written against
    -- the platform: the buyer exercises it only when the market has moved in
    -- their favour, and never when it has not.
    freeze_seconds INTEGER NOT NULL DEFAULT 900
        CHECK (freeze_seconds > 0 AND freeze_seconds <= 86400),
    expires_at TIMESTAMP
        GENERATED ALWAYS AS (locked_at + make_interval(secs => freeze_seconds)) STORED,

    released_at TIMESTAMP,
    release_reason VARCHAR(30)
        CHECK (release_reason IS NULL OR release_reason IN
               ('checked_out','expired','cancelled','stock_gone','price_error')),

    CONSTRAINT released_lock_needs_reason CHECK (
      released_at IS NULL OR release_reason IS NOT NULL
    )
);

CREATE OR REPLACE VIEW v_active_price_locks AS
SELECT
    id, cart_id, user_id, product_id, quantity,
    locked_price_inr, market_price_at_lock_inr, locked_at, expires_at,
    EXTRACT(EPOCH FROM (expires_at - CURRENT_TIMESTAMP))::int AS seconds_remaining
FROM cart_price_locks
WHERE released_at IS NULL AND expires_at > CURRENT_TIMESTAMP;

-- What the freeze is costing. Positive exposure means the market has risen
-- above the locked price and the platform is carrying the difference.
CREATE OR REPLACE VIEW v_price_lock_exposure AS
SELECT
    product_id,
    COUNT(*)                                                  AS active_locks,
    SUM(quantity)                                             AS locked_quantity,
    SUM(quantity * locked_price_inr)                          AS locked_value_inr,
    SUM(quantity * market_price_at_lock_inr)                  AS market_value_at_lock_inr,
    SUM(quantity * (market_price_at_lock_inr - locked_price_inr)) AS exposure_inr
FROM cart_price_locks
WHERE released_at IS NULL AND expires_at > CURRENT_TIMESTAMP
GROUP BY product_id;

-- ---------------------------------------------------------------------------
-- 2. SHARED PRICE-SPREAD INCENTIVE POOL
--
-- v9's redeemIncentivePool() distributes a share of the platform's price
-- spread back to farmers, redeemable as cash OR equipment credit, once per
-- cycle. This is the mechanism that makes "the farmer shares the upside" a
-- fact rather than a slogan, so it needs a ledger, not a flag on a user.
--
-- The once-per-cycle rule is enforced by a unique constraint rather than by
-- the check v9 did in JavaScript, because a double-redeem is a direct cash
-- loss and a client-side guard loses every race.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS incentive_pool_cycles (
    id SERIAL PRIMARY KEY,
    cycle_code VARCHAR(40) NOT NULL UNIQUE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    total_spread_collected_inr NUMERIC(16,2) NOT NULL DEFAULT 0
        CHECK (total_spread_collected_inr >= 0),
    farmer_share_pct NUMERIC(5,2) NOT NULL DEFAULT 40.00
        CHECK (farmer_share_pct >= 0 AND farmer_share_pct <= 100),
    pool_amount_inr NUMERIC(16,2)
        GENERATED ALWAYS AS (ROUND(total_spread_collected_inr * farmer_share_pct / 100, 2)) STORED,

    eligible_farmer_count INTEGER NOT NULL DEFAULT 0 CHECK (eligible_farmer_count >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'accumulating'
        CHECK (status IN ('accumulating','closed','distributing','distributed')),
    distribution_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT cycle_period_valid CHECK (period_end >= period_start),
    CONSTRAINT distributed_cycle_has_date CHECK (
      status <> 'distributed' OR distribution_date IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS incentive_pool_redemptions (
    id BIGSERIAL PRIMARY KEY,
    cycle_id INTEGER NOT NULL REFERENCES incentive_pool_cycles (id),
    farmer_id UUID NOT NULL,

    amount_inr NUMERIC(14,2) NOT NULL CHECK (amount_inr > 0),
    redemption_mode VARCHAR(20) NOT NULL
        CHECK (redemption_mode IN ('cash_wallet','equipment_credit','input_credit','reinvest')),

    -- v9 offered a bonus for taking equipment credit rather than cash. Kept as
    -- a column so the incentive is visible and adjustable, not buried in code.
    bonus_pct NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (bonus_pct >= 0 AND bonus_pct <= 100),
    credited_amount_inr NUMERIC(14,2)
        GENERATED ALWAYS AS (ROUND(amount_inr * (100 + bonus_pct) / 100, 2)) STORED,

    redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    wallet_txn_ref VARCHAR(80),

    -- One redemption per farmer per cycle. In JavaScript this was an if-check
    -- on a boolean; two concurrent taps would both pass it and both pay out.
    CONSTRAINT one_redemption_per_cycle UNIQUE (cycle_id, farmer_id),

    -- Cash has no bonus by definition — a cash bonus would just be a larger
    -- cash payout, and expressing it as a bonus hides the real cost.
    CONSTRAINT cash_has_no_bonus CHECK (redemption_mode <> 'cash_wallet' OR bonus_pct = 0)
);

-- ---------------------------------------------------------------------------
-- 3. FARMER CONTRACT READINESS
--
-- v9's saveContractReadiness() captures what a farmer will actually commit to
-- BEFORE a buyer asks: minimum acceptable price, minimum lot, notice period,
-- advance required, and what they will do if the contract falls through.
--
-- This is the single most useful thing to hold about a farmer for contract
-- farming, and nothing in this chain stored it. Without it every negotiation
-- starts from zero and the farmer negotiates alone against a buyer who does
-- this for a living.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS farmer_contract_readiness (
    id BIGSERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL,
    crop VARCHAR(120),

    -- Minimum Acceptable Price. The farmer's own floor, not the platform's.
    map_price_inr_per_kg NUMERIC(12,2) CHECK (map_price_inr_per_kg IS NULL OR map_price_inr_per_kg > 0),
    willing_to_contract BOOLEAN,
    min_lot_kg NUMERIC(12,2) CHECK (min_lot_kg IS NULL OR min_lot_kg > 0),
    notice_days INTEGER CHECK (notice_days IS NULL OR notice_days >= 0),
    advance_required_pct NUMERIC(5,2)
        CHECK (advance_required_pct IS NULL OR (advance_required_pct >= 0 AND advance_required_pct <= 100)),

    conditions TEXT,
    efficiency_notes TEXT,
    training_needs TEXT,
    support_notes TEXT,

    -- What happens if the contract does not complete. Recorded up front,
    -- because the moment it is needed is the moment nobody is calm.
    default_sell_action VARCHAR(40),
    default_buy_action VARCHAR(40),

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (farmer_id, crop),

    -- Saying yes to contracting without naming a floor price leaves the farmer
    -- negotiating from nothing.
    CONSTRAINT willing_farmer_states_a_floor CHECK (
      willing_to_contract IS NOT TRUE OR map_price_inr_per_kg IS NOT NULL
    )
);

-- Buyers can be matched only against farmers who have stated terms.
CREATE OR REPLACE VIEW v_contract_ready_farmers AS
SELECT
    farmer_id, crop, map_price_inr_per_kg, min_lot_kg, notice_days,
    advance_required_pct, conditions, updated_at,
    CASE
      WHEN map_price_inr_per_kg IS NOT NULL AND min_lot_kg IS NOT NULL
           AND notice_days IS NOT NULL THEN 'ready'
      WHEN map_price_inr_per_kg IS NOT NULL THEN 'partial — price stated, logistics terms missing'
      ELSE 'not ready'
    END AS readiness
FROM farmer_contract_readiness
WHERE willing_to_contract IS TRUE;

-- ---------------------------------------------------------------------------
-- 4. LIVE PRICE WINDOWS
--
-- v9's getLivePrice() moves a price inside a band, held stable within a
-- 5-minute window so the UI does not flicker. The prototype generated it from
-- a hash of the product id — deterministic noise, honestly commented as such.
--
-- Ported as a table rather than as that function, because the useful part was
-- never the noise: it was the WINDOW. A price that holds for a known interval
-- is quotable; one that changes per render is not. Real feeds (Agmarknet,
-- e-NAM) can fill these rows without anything downstream changing.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS price_windows (
    id BIGSERIAL PRIMARY KEY,
    product_id VARCHAR(80) NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_seconds INTEGER NOT NULL DEFAULT 300 CHECK (window_seconds > 0),
    window_end TIMESTAMP
        GENERATED ALWAYS AS (window_start + make_interval(secs => window_seconds)) STORED,

    base_price_inr NUMERIC(12,2) NOT NULL CHECK (base_price_inr > 0),
    live_price_inr NUMERIC(12,2) NOT NULL CHECK (live_price_inr > 0),
    band_pct NUMERIC(5,2) NOT NULL DEFAULT 8.00 CHECK (band_pct >= 0 AND band_pct <= 100),

    -- WHERE THE NUMBER CAME FROM. 'synthetic' means it was generated, not
    -- observed, and it must never be presented as a market rate. This column
    -- is why the prototype's deterministic noise can live in the same table as
    -- a real Agmarknet feed without the two becoming indistinguishable.
    source VARCHAR(20) NOT NULL DEFAULT 'synthetic'
        CHECK (source IN ('synthetic','agmarknet','enam','mandi_manual','platform_actual')),
    source_ref VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (product_id, window_start),

    -- A synthetic price must stay inside its declared band. Outside it, it is
    -- not a plausible simulation, it is a wrong number with a source label.
    CONSTRAINT synthetic_price_within_band CHECK (
      source <> 'synthetic'
      OR (live_price_inr BETWEEN base_price_inr * (1 - band_pct / 100)
                             AND base_price_inr * (1 + band_pct / 100))
    ),
    -- Real feeds must say which feed.
    CONSTRAINT real_price_names_its_source CHECK (
      source = 'synthetic' OR source_ref IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_cart_locks_active ON cart_price_locks (cart_id)
  WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cart_locks_expiry ON cart_price_locks (expires_at)
  WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pool_redemption_farmer ON incentive_pool_redemptions (farmer_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_readiness_crop ON farmer_contract_readiness (crop)
  WHERE willing_to_contract IS TRUE;
CREATE INDEX IF NOT EXISTS idx_price_windows_lookup ON price_windows (product_id, window_start DESC);
