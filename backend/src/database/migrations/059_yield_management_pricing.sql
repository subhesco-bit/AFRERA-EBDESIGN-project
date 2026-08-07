-- ============================================================================
-- 059_yield_management_pricing.sql   (2026-08-05)
--
-- AIRLINE-STYLE YIELD MANAGEMENT, APPLIED TO PERISHABLE PRODUCE.
--
-- WHY THE ANALOGY ACTUALLY HOLDS
--
-- An airline seat and a crate of Kaji Nemu share the property that makes yield
-- management necessary: fixed, perishable inventory against uncertain demand
-- arriving over time. A seat is worthless one second after departure. A lemon
-- with a two-week window is worthless on day fifteen. In both cases the cost
-- of an unsold unit is the ENTIRE unit, so the question is never "what is this
-- worth" but "what is this worth GIVEN how much time is left and how much is
-- still unsold".
--
-- WHERE THE ANALOGY BREAKS, AND WHY THAT MATTERS HERE
--
--   Overbooking does not transfer. An airline can sell 105 seats for 100
--   because a seat is a promise and no-shows are predictable. A crate of
--   produce is physical: overselling means somebody who paid receives nothing,
--   and on this platform that somebody is often an FPO that already paid the
--   farmer. There is no overbooking table in this migration and there should
--   not be one.
--
--   The floor is different. An airline can sell a last seat at any price above
--   marginal cost. Here the farmer has a floor — the whole platform exists to
--   defend it — so markdown is bounded by what was promised, not by zero.
--
--   Deterioration is continuous, not a cliff. A seat is 100% valuable until
--   departure and then 0%. Produce loses quality daily, so price should track
--   condition and not only the calendar.
--
-- EXTENDS, DOES NOT REPLACE. dynamicPricingService.js (475 lines, real) already
-- does nutrient-based and local-market pricing; price_windows (054) already
-- holds time-bounded quotes; arp_* (051) already does forward curves. This adds
-- only the inventory-over-time dimension none of them had.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. FARE BUCKETS — "inventory classes", in airline language
--
-- A lot is split into price tiers released in sequence. Early buyers get the
-- cheap tier; as it sells out, the price steps up. This is the mechanism that
-- rewards commitment and captures willingness-to-pay from late buyers, and it
-- is exactly how an airline sells the same cabin at eleven different prices.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pricing_buckets (
    id BIGSERIAL PRIMARY KEY,
    lot_code VARCHAR(60) NOT NULL,
    product_id VARCHAR(80),
    bucket_code VARCHAR(20) NOT NULL,
    -- 1 opens first and is cheapest. Sequence matters: buckets open in order.
    sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),

    price_inr_per_kg NUMERIC(12,2) NOT NULL CHECK (price_inr_per_kg > 0),
    allocated_kg NUMERIC(14,3) NOT NULL CHECK (allocated_kg > 0),
    sold_kg NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (sold_kg >= 0),
    remaining_kg NUMERIC(14,3)
        GENERATED ALWAYS AS (allocated_kg - sold_kg) STORED,

    opens_at TIMESTAMP,
    closes_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'closed'
        CHECK (status IN ('closed','open','sold_out','expired','withdrawn')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (lot_code, bucket_code),

    -- Cannot sell more than was allocated to the bucket. This is the constraint
    -- that makes overbooking impossible by construction rather than by policy —
    -- the physical-goods reason it must not be allowed.
    CONSTRAINT bucket_not_oversold CHECK (sold_kg <= allocated_kg),
    CONSTRAINT bucket_window_valid CHECK (
      opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at
    )
);

-- Total allocated across buckets must not exceed the lot. Enforced by trigger
-- rather than CHECK because it spans rows.
CREATE OR REPLACE FUNCTION check_bucket_allocation() RETURNS TRIGGER AS $$
DECLARE
    total_allocated NUMERIC;
    lot_size NUMERIC;
BEGIN
    SELECT COALESCE(SUM(allocated_kg), 0) INTO total_allocated
      FROM pricing_buckets WHERE lot_code = NEW.lot_code AND id <> COALESCE(NEW.id, -1);
    total_allocated := total_allocated + NEW.allocated_kg;

    SELECT lot_size_kg INTO lot_size FROM pricing_lots WHERE lot_code = NEW.lot_code;
    IF lot_size IS NOT NULL AND total_allocated > lot_size THEN
        RAISE EXCEPTION 'Bucket allocation (% kg) exceeds lot size (% kg) for lot %. '
                        'Selling more than exists is how a buyer who paid receives nothing.',
                        total_allocated, lot_size, NEW.lot_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 2. LOTS — the inventory being managed, with its expiry
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pricing_lots (
    id BIGSERIAL PRIMARY KEY,
    lot_code VARCHAR(60) NOT NULL UNIQUE,
    product_id VARCHAR(80),
    crop_key VARCHAR(60),
    farmer_id UUID,

    lot_size_kg NUMERIC(14,3) NOT NULL CHECK (lot_size_kg > 0),
    harvested_on DATE,
    -- The "departure time". After this the lot is worth nothing, which is what
    -- makes the whole mechanism necessary.
    expires_on DATE NOT NULL,
    shelf_life_days INTEGER
        GENERATED ALWAYS AS (expires_on - harvested_on) STORED,

    -- The farmer's promised floor. Markdown stops here, not at zero — the
    -- platform exists to defend this number, and an algorithm that discounts
    -- through it has inverted the platform's purpose.
    farmer_floor_inr_per_kg NUMERIC(12,2) NOT NULL CHECK (farmer_floor_inr_per_kg > 0),
    list_price_inr_per_kg NUMERIC(12,2) NOT NULL CHECK (list_price_inr_per_kg > 0),

    -- Quality decays continuously; price should track condition, not only date.
    current_quality_score NUMERIC(5,2)
        CHECK (current_quality_score IS NULL OR (current_quality_score BETWEEN 0 AND 100)),
    quality_assessed_on DATE,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','sold_out','expired','withdrawn','written_off')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT lot_expires_after_harvest CHECK (
      harvested_on IS NULL OR expires_on > harvested_on
    ),
    -- A list price below the farmer's floor means the platform is selling at a
    -- loss it has not acknowledged.
    CONSTRAINT list_at_or_above_floor CHECK (list_price_inr_per_kg >= farmer_floor_inr_per_kg)
);

CREATE TRIGGER trg_bucket_allocation
    BEFORE INSERT OR UPDATE ON pricing_buckets
    FOR EACH ROW EXECUTE FUNCTION check_bucket_allocation();

-- ---------------------------------------------------------------------------
-- 3. BOOKING CURVE — how demand actually arrives over the selling window
--
-- Airlines have decades of booking curves per route. This platform has none
-- yet, which is the honest position: the curve must be LEARNED from observed
-- sales, not assumed from a textbook. Rows accumulate; the model improves.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS booking_curve_observations (
    id BIGSERIAL PRIMARY KEY,
    crop_key VARCHAR(60),
    product_id VARCHAR(80),
    -- Days before expiry, so curves for different shelf lives are comparable.
    days_to_expiry INTEGER NOT NULL CHECK (days_to_expiry >= 0),
    pct_of_lot_sold NUMERIC(5,2) NOT NULL CHECK (pct_of_lot_sold BETWEEN 0 AND 100),
    realised_price_inr_per_kg NUMERIC(12,2),

    lot_code VARCHAR(60),
    season VARCHAR(20),
    observed_on DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Every curve point is an observation, not a projection.
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'real'
        CHECK (data_provenance IN ('real','estimated','assumed'))
);

-- The learned curve: how much of a lot is typically sold with N days left.
CREATE OR REPLACE VIEW v_booking_curve AS
SELECT
    crop_key,
    days_to_expiry,
    COUNT(*)                                            AS observations,
    ROUND(AVG(pct_of_lot_sold)::numeric, 2)             AS mean_pct_sold,
    ROUND(STDDEV_SAMP(pct_of_lot_sold)::numeric, 2)     AS stddev_pct_sold,
    ROUND(AVG(realised_price_inr_per_kg)::numeric, 2)   AS mean_realised_price,
    -- Under 10 observations the mean is an anecdote. Airlines build curves on
    -- thousands of departures; saying so keeps a three-lot average from being
    -- mistaken for a model.
    (COUNT(*) >= 10)                                    AS statistically_usable
FROM booking_curve_observations
WHERE data_provenance = 'real'
GROUP BY crop_key, days_to_expiry;

-- ---------------------------------------------------------------------------
-- 4. MARKDOWN SCHEDULE — the time-to-expiry discount ladder
--
-- The airline equivalent of dropping the fare as departure nears. Bounded by
-- the farmer floor at every step.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS markdown_rules (
    id SERIAL PRIMARY KEY,
    crop_key VARCHAR(60),
    applies_to_all BOOLEAN NOT NULL DEFAULT FALSE,

    -- Trigger conditions. Both must hold: time is running out AND stock remains.
    -- Discounting a lot that is nearly sold out just gives away margin.
    days_to_expiry_at_or_below INTEGER NOT NULL CHECK (days_to_expiry_at_or_below >= 0),
    pct_unsold_at_or_above NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (pct_unsold_at_or_above BETWEEN 0 AND 100),

    discount_pct NUMERIC(5,2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 90),
    -- Absolute stop. Even at maximum discount the price cannot fall below the
    -- farmer floor; below that the platform is funding the discount out of
    -- somebody else's income.
    never_below_floor BOOLEAN NOT NULL DEFAULT TRUE,

    priority INTEGER NOT NULL DEFAULT 100,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rationale TEXT,

    CONSTRAINT markdown_scope_defined CHECK (
      applies_to_all = TRUE OR crop_key IS NOT NULL
    ),
    -- Turning the floor guard off must be a deliberate, justified act.
    CONSTRAINT floor_override_needs_rationale CHECK (
      never_below_floor = TRUE OR (rationale IS NOT NULL AND length(trim(rationale)) > 0)
    )
);

INSERT INTO markdown_rules
 (applies_to_all, days_to_expiry_at_or_below, pct_unsold_at_or_above, discount_pct, priority, rationale)
VALUES
 (TRUE, 7, 60, 10.00, 10, 'A week left with most of the lot unsold. Small nudge.'),
 (TRUE, 4, 50, 20.00, 20, 'Half unsold with four days left — clearance begins.'),
 (TRUE, 2, 30, 35.00, 30,
  'Two days. Beyond this the alternative is not a lower price, it is a total loss '
  'plus disposal cost, so a deep discount is the better outcome for everyone including '
  'the farmer whose floor is still protected.'),
 (TRUE, 1, 10, 50.00, 40,
  'Final day. Anything above the farmer floor beats writing the lot off.')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. COMPETITOR PRICE INTELLIGENCE — EXTENDS price_intelligence (042)
--
-- CORRECTION. The first draft of this migration created a table called
-- competitor_price_observations. That was a duplicate and it should not have
-- been written: price_intelligence has existed since migration 042 and holds
-- the same facts under different names.
--
--     my column              042's column
--     competitor         ->  source_name
--     channel            ->  source_type
--     observed_price_inr ->  listed_price / effective_price
--     matched_product_id ->  product_id
--
-- That is the same synonym pattern already recorded for gst_invoices in
-- schema-decisions.json, and creating a second table would have left two
-- places holding a competitor's price with nothing keeping them equal.
--
-- 042 is authoritative. What it genuinely lacked is added by ALTER below —
-- pack-size normalisation, match confidence, and the provenance of how a
-- price was obtained. Those are new facts, not new spellings.
-- ---------------------------------------------------------------------------

-- Pack-size normalisation. The most common error in retail price comparison:
-- Rs 180 for a 250g pack is Rs 720/kg, not cheaper than a Rs 400 kilo.
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS pack_size_g NUMERIC(10,2);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'kg';
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS price_per_kg_inr NUMERIC(12,2);

-- Fuzzy name matching across retailers is unreliable. A 0.4 match must not
-- silently drive a repricing decision.
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS match_confidence NUMERIC(4,3);

-- HOW the price was obtained, and whether anyone checked that was permitted.
-- Many retailers prohibit automated collection in their terms of use; the
-- legal position varies by jurisdiction and by whether data sits behind a
-- login. A price from a public API, a licensed feed, a partner agreement or a
-- person reading a shelf label carry different obligations, and a column that
-- flattens them leaves the platform unable to say where a number came from.
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS collection_method VARCHAR(30);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS terms_reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS collection_note TEXT;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS observed_by UUID;

-- Comparability attributes: a generic listing and a lab-certified GI product
-- are not the same product, and comparing their prices is not like-for-like.
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS is_organic BOOLEAN;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS is_gi_tagged BOOLEAN;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS in_stock BOOLEAN;

COMMENT ON COLUMN price_intelligence.collection_method IS
  'One of: public_api, licensed_feed, partner_share, manual_observation, '
  'published_price_list, automated_collection. Enforced in the service layer '
  'rather than by CHECK, because rows predating migration 059 have NULL here '
  'and a CHECK would reject them on any UPDATE.';

COMMENT ON COLUMN price_intelligence.price_per_kg_inr IS
  'Normalised per-kg price. Set by the service from effective_price and '
  'pack_size_g. Not a generated column because 042 rows already carry prices '
  'with no pack size recorded, and a generated column would make those NULL '
  'permanently with no way to backfill.';

-- Where the platform sits against observed competitor prices, per kg.
CREATE OR REPLACE VIEW v_competitive_position AS
SELECT
    p.product_id,
    p.product_name,
    COUNT(*)                                                     AS observations,
    COUNT(DISTINCT p.source_name)                                AS competitors,
    ROUND(MIN(COALESCE(p.price_per_kg_inr, p.effective_price))::numeric, 2)  AS lowest_per_kg,
    ROUND(AVG(COALESCE(p.price_per_kg_inr, p.effective_price))::numeric, 2)  AS mean_per_kg,
    ROUND(MAX(COALESCE(p.price_per_kg_inr, p.effective_price))::numeric, 2)  AS highest_per_kg,
    MAX(p.created_at)                                            AS latest_observation,
    -- Stale competitor data is worse than none: it invites confident repricing
    -- against a number that changed weeks ago.
    (MAX(p.created_at) < CURRENT_TIMESTAMP - INTERVAL '7 days')  AS stale,
    ROUND(AVG(p.match_confidence)::numeric, 2)                   AS mean_match_confidence,
    ARRAY_AGG(DISTINCT p.collection_method) FILTER (WHERE p.collection_method IS NOT NULL)
                                                                 AS collection_methods
FROM price_intelligence p
GROUP BY p.product_id, p.product_name;

CREATE INDEX IF NOT EXISTS idx_buckets_lot ON pricing_buckets (lot_code, sequence_no);
CREATE INDEX IF NOT EXISTS idx_buckets_open ON pricing_buckets (status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_lots_expiring ON pricing_lots (expires_on) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_curve_lookup ON booking_curve_observations (crop_key, days_to_expiry);
CREATE INDEX IF NOT EXISTS idx_markdown_active ON markdown_rules (priority) WHERE enabled;
CREATE INDEX IF NOT EXISTS idx_price_intel_product ON price_intelligence (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_intel_name ON price_intelligence (product_name, created_at DESC);
