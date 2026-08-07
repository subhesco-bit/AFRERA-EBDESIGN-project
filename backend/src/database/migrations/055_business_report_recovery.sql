-- ============================================================================
-- 055_business_report_recovery.sql   (2026-08-05)
--
-- Recovered from NE_Harvest_Complete_Business_Report.html — 55 sections and 20
-- data tables of operating economics that existed only as a formatted document.
--
-- WHY A DOCUMENT'S TABLES BELONG IN THE DATABASE
--
-- A landed-cost build-up in an HTML report is read once and then quoted from
-- memory. The moment freight changes, every number downstream is wrong and
-- nothing recomputes. These four datasets in particular drive decisions the
-- platform already makes in code — pricing, scheme eligibility, shelf life,
-- and route economics — so they belong where those decisions can read them.
--
-- Everything here is flagged with its provenance. These are planning figures
-- from a business plan, not observed transactions.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. LANDED COST BUILD-UP
--
-- Eight components between farmgate and an NCR doorstep, each with a min /
-- optimised / max. Total: Rs 109.80 / 121.00 / 143.80 per kg.
--
-- Held as components rather than a single total because the total is the
-- least useful number in the table. When margin is thin the question is always
-- WHICH line moved, and a stored total cannot answer it.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS landed_cost_components (
    id SERIAL PRIMARY KEY,
    corridor VARCHAR(80) NOT NULL DEFAULT 'NE->NCR',
    sequence_no INTEGER NOT NULL,
    component VARCHAR(160) NOT NULL,

    min_inr_per_kg NUMERIC(10,2) NOT NULL CHECK (min_inr_per_kg >= 0),
    optimised_inr_per_kg NUMERIC(10,2) NOT NULL CHECK (optimised_inr_per_kg >= 0),
    max_inr_per_kg NUMERIC(10,2) NOT NULL CHECK (max_inr_per_kg >= 0),

    -- Which of these a subsidy or an operating change can actually move.
    controllable BOOLEAN NOT NULL DEFAULT TRUE,
    subsidy_scheme VARCHAR(80),
    notes TEXT,

    data_provenance VARCHAR(20) NOT NULL DEFAULT 'estimated'
        CHECK (data_provenance IN ('real','estimated','assumed')),
    source_document VARCHAR(120) NOT NULL DEFAULT 'NE_Harvest_Complete_Business_Report.html',
    as_of DATE NOT NULL DEFAULT CURRENT_DATE,

    UNIQUE (corridor, sequence_no),

    -- A band whose min exceeds its max is not a band. Silently inverted ranges
    -- make every downstream "best case" calculation return the worst case.
    CONSTRAINT landed_cost_band_ordered CHECK (
      min_inr_per_kg <= optimised_inr_per_kg AND optimised_inr_per_kg <= max_inr_per_kg
    )
);

INSERT INTO landed_cost_components
 (sequence_no, component, min_inr_per_kg, optimised_inr_per_kg, max_inr_per_kg, controllable, subsidy_scheme, notes)
VALUES
 (1,'Procurement farmgate (incl. local transport to aggregation)',95.00,100.00,115.00,TRUE,NULL,
  'The largest line by far — roughly 83% of optimised landed cost. Also the one '
  'the platform least wants to reduce, since paying the farmer more is the point.'),
 (2,'Rail freight post NE Logistics Policy subsidy',3.00,4.00,5.00,TRUE,'NE Logistics Policy Freight Subsidy',
  'Already net of a 30-50% subsidy. Without the subsidy this line roughly doubles.'),
 (3,'Loading/unloading handling',1.00,1.50,2.00,TRUE,NULL,NULL),
 (4,'Multi-layer insurance (transit + cold chain + cargo)',0.30,0.50,0.80,TRUE,NULL,
  'Cheap relative to what it covers. Cutting it to save 50 paise is a false economy '
  'against a consignment worth over Rs 100/kg.'),
 (5,'Cold storage (origin + Delhi buffer)',2.50,3.50,5.00,TRUE,'MIDH Horticulture Mission',NULL),
 (6,'Losses/wastage (with cold chain: 4-8%)',4.00,6.00,9.00,TRUE,NULL,
  'Stated as achievable WITH cold chain. Without it, NE horticulture losses run far '
  'higher and this line alone can exceed the freight it was meant to save.'),
 (7,'Last-mile delivery RWA (own reefer vehicle)',2.00,2.50,3.00,TRUE,NULL,
  'Own reefer at Rs 2-3/kg against Rs 35-60/kg quick-commerce commission. The single '
  'largest structural cost advantage in the model.'),
 (8,'Platform overhead (tech + ops)',2.00,3.00,4.00,TRUE,NULL,NULL)
ON CONFLICT (corridor, sequence_no) DO NOTHING;

CREATE OR REPLACE VIEW v_landed_cost_total AS
SELECT
    corridor,
    SUM(min_inr_per_kg)       AS min_total_inr_per_kg,
    SUM(optimised_inr_per_kg) AS optimised_total_inr_per_kg,
    SUM(max_inr_per_kg)       AS max_total_inr_per_kg,
    COUNT(*)                  AS components,
    MAX(as_of)                AS as_of
FROM landed_cost_components
GROUP BY corridor;

-- Where the money actually goes, largest first.
CREATE OR REPLACE VIEW v_landed_cost_share AS
SELECT
    c.corridor, c.sequence_no, c.component,
    c.optimised_inr_per_kg,
    ROUND(c.optimised_inr_per_kg / NULLIF(t.optimised_total_inr_per_kg, 0) * 100, 2) AS pct_of_total,
    c.subsidy_scheme
FROM landed_cost_components c
JOIN v_landed_cost_total t ON t.corridor = c.corridor
ORDER BY c.optimised_inr_per_kg DESC;

-- ---------------------------------------------------------------------------
-- 2. GOVERNMENT SCHEME FUNDING MAP
--
-- Ten schemes with quantum and timing. Extends dpr_schemes (053), which scores
-- eligibility; this records what each is worth and when to apply.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scheme_funding_map (
    id SERIAL PRIMARY KEY,
    scheme_name VARCHAR(160) NOT NULL UNIQUE,
    ministry VARCHAR(120),
    covers TEXT NOT NULL,
    grant_quantum TEXT NOT NULL,
    apply_when VARCHAR(80),
    apply_month_earliest INTEGER CHECK (apply_month_earliest IS NULL OR apply_month_earliest >= 0),

    subsidy_pct_min NUMERIC(5,2) CHECK (subsidy_pct_min IS NULL OR (subsidy_pct_min >= 0 AND subsidy_pct_min <= 100)),
    subsidy_pct_max NUMERIC(5,2) CHECK (subsidy_pct_max IS NULL OR (subsidy_pct_max >= 0 AND subsidy_pct_max <= 100)),
    ceiling_inr NUMERIC(16,2),

    -- Nothing here has been confirmed against a live scheme portal. Government
    -- windows open and close without notice, and a lapsed scheme quoted as
    -- current is worse than no information: someone plans a season around it.
    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
        CHECK (verification_status IN ('unverified','verified','lapsed','superseded')),
    last_verified_on DATE,
    source_document VARCHAR(120) NOT NULL DEFAULT 'NE_Harvest_Complete_Business_Report.html',

    CONSTRAINT scheme_pct_band_ordered CHECK (
      subsidy_pct_min IS NULL OR subsidy_pct_max IS NULL OR subsidy_pct_min <= subsidy_pct_max
    ),
    CONSTRAINT verified_scheme_has_date CHECK (
      verification_status <> 'verified' OR last_verified_on IS NOT NULL
    )
);

INSERT INTO scheme_funding_map
 (scheme_name, ministry, covers, grant_quantum, apply_when, apply_month_earliest, subsidy_pct_min, subsidy_pct_max)
VALUES
 ('NE Logistics Policy Freight Subsidy','DPIIT','30-50% of freight cost for NE->mainland goods','Rs 3-5/kg saving on every shipment','Month 1 — immediately',1,30,50),
 ('NEC Capital Grant','DoNER Ministry','Cold storage, aggregation centre, processing unit infrastructure','Up to Rs 5Cr per project, 90% grant for NE entities','Month 2-3',2,NULL,90),
 ('SFAC FPC Equity Grant','Agriculture Ministry','FPC equity grant + working capital soft loan','Rs 10-25L equity + concessional loan','Month 2',2,NULL,NULL),
 ('MIDH Horticulture Mission','Agriculture Ministry','Pre-cooling, pack houses, cold chain infrastructure','50% subsidy, max Rs 35L','Month 3',3,50,50),
 ('ASIDE Scheme','DPIIT','Export infrastructure — packaging, testing lab, cold chain','Rs 50L-2Cr, 75% grant','Month 4 (after APEDA reg)',4,75,75),
 ('PMFME','Food Processing','Each processing unit — equipment, FSSAI, packaging upgrade','35% subsidy, max Rs 10L per unit','Each unit at setup',NULL,35,35),
 ('NABARD FPC Financing','NABARD','Working capital + term loan at 7-9%','Rs 2Cr working capital, Rs 5Cr term loan','Month 3',3,NULL,NULL),
 ('Startup India (DPIIT)','DPIIT','Tax exemption 3 years, fund-of-funds access','Rs 5-15L tax benefit','Month 1 (1 day online)',1,NULL,NULL),
 ('ODOP (One District One Product)','DPIIT + States','Branding, packaging, market linkage for district-specific products','Rs 10-50L per product','Month 4',4,NULL,NULL),
 ('PLI Food Processing','Food Processing','Processed food scale-up incentive on incremental sales','4-10% of sales, 6 years','Year 2-3 (after processing units)',13,4,10)
ON CONFLICT (scheme_name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. PACKAGING AND SHELF LIFE
--
-- Vacuum + nitrogen MAP against conventional packing. The business impact is
-- the point: Akhuni at 3-4 months cannot be exported at all; at 12-18 months
-- the NE diaspora in the UK, US and Australia becomes reachable. Shelf life is
-- a market-access constraint, not a storage detail.
--
-- Feeds the ARP model directly (051): storage_months is an input to the carry
-- penalty and a hard cap on holding.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS packaging_shelf_life (
    id SERIAL PRIMARY KEY,
    product VARCHAR(120) NOT NULL,
    packaging_method VARCHAR(60) NOT NULL DEFAULT 'vacuum_n2_map'
        CHECK (packaging_method IN ('conventional','vacuum_n2_map','ema','cold_chain_only','ambient')),

    conventional_months_min NUMERIC(6,2) CHECK (conventional_months_min IS NULL OR conventional_months_min >= 0),
    conventional_months_max NUMERIC(6,2) CHECK (conventional_months_max IS NULL OR conventional_months_max >= 0),
    improved_months_min NUMERIC(6,2) CHECK (improved_months_min IS NULL OR improved_months_min >= 0),
    improved_months_max NUMERIC(6,2) CHECK (improved_months_max IS NULL OR improved_months_max >= 0),

    removes_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    cost_change_inr_per_pack NUMERIC(10,2),
    business_impact TEXT NOT NULL,

    data_provenance VARCHAR(20) NOT NULL DEFAULT 'assumed'
        CHECK (data_provenance IN ('real','estimated','assumed')),
    source_document VARCHAR(120) NOT NULL DEFAULT 'NE_Harvest_Complete_Business_Report.html',

    UNIQUE (product, packaging_method),

    -- Claiming an improvement that is not an improvement would let a packaging
    -- upgrade be justified on a number that goes the wrong way.
    CONSTRAINT improved_shelf_life_is_longer CHECK (
      improved_months_min IS NULL OR conventional_months_min IS NULL
      OR improved_months_min >= conventional_months_min
    )
);

INSERT INTO packaging_shelf_life
 (product, conventional_months_min, conventional_months_max, improved_months_min, improved_months_max,
  removes_cold_chain, cost_change_inr_per_pack, business_impact)
VALUES
 ('King Chili (dried)',6,8,24,30,FALSE,NULL,
  'Amazon listing viable. Export to US/UK NE diaspora. Two-year D2C sales window from one harvest.'),
 ('Lakadong Turmeric powder',8,12,30,36,FALSE,NULL,
  'Curcumin claim holds for 3 years. Premium lab-certified pricing sustained.'),
 ('Akhuni (dried/powder)',3,4,12,18,FALSE,NULL,
  'Global export to NE diaspora (UK, US, Australia) — currently impossible due to shelf life.'),
 ('Ngari (fermented fish)',6,8,18,24,TRUE,-10.00,
  'Removes the cold chain requirement entirely. Cost drops Rs 8-12/pack. Global diaspora export viable.'),
 ('Wild Mushroom (dried)',6,9,24,30,FALSE,NULL,
  'Restaurant and hotel bulk purchase viable — chefs need long-life pantry stock.'),
 ('Herbal tea blends',12,12,30,36,FALSE,NULL,
  'Modern trade requires 18+ months of remaining life. Now accessible.')
ON CONFLICT (product, packaging_method) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. PROCESSING UNITS PIPELINE  (25 units in the report)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS processing_unit_concepts (
    id SERIAL PRIMARY KEY,
    unit_no INTEGER NOT NULL UNIQUE,
    unit_name VARCHAR(160) NOT NULL,
    category VARCHAR(60) NOT NULL,
    raw_input TEXT,
    output_products TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'concept'
        CHECK (status IN ('concept','feasibility','funded','building','operating','shelved')),
    -- PMFME covers 35% to a Rs 10L ceiling per unit.
    pmfme_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    estimated_capex_inr NUMERIC(14,2),

    source_document VARCHAR(120) NOT NULL DEFAULT 'NE_Harvest_Complete_Business_Report.html',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A unit past concept stage without a capex figure cannot be funded, and
    -- "funded" without a number is how a plan drifts from a budget.
    CONSTRAINT funded_unit_has_capex CHECK (
      status NOT IN ('funded','building','operating') OR estimated_capex_inr IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- 5. RWA TARGET ZONES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rwa_target_zones (
    id SERIAL PRIMARY KEY,
    zone VARCHAR(120) NOT NULL UNIQUE,
    city VARCHAR(60) NOT NULL DEFAULT 'NCR',
    why_first TEXT,
    entry_strategy TEXT,
    priority VARCHAR(4) NOT NULL CHECK (priority IN ('P1','P2','P3')),

    status VARCHAR(20) NOT NULL DEFAULT 'target'
        CHECK (status IN ('target','contacted','pilot','active','declined')),
    rwas_signed INTEGER NOT NULL DEFAULT 0 CHECK (rwas_signed >= 0),
    source_document VARCHAR(120) NOT NULL DEFAULT 'NE_Harvest_Complete_Business_Report.html'
);

INSERT INTO rwa_target_zones (zone, why_first, entry_strategy, priority) VALUES
 ('Noida Sector 15-62','Highest organic consumer density + tech-savvy','Tasting event + free discovery box to RWA committee','P1'),
 ('Vasant Kunj, Delhi','High-income government employees, health-conscious','Government employees cooperative tie-in','P1'),
 ('Gurgaon Sector 45-57','MNC professionals, international travel exposure','Organic + lab certification story first','P2')
ON CONFLICT (zone) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_landed_cost_corridor ON landed_cost_components (corridor, sequence_no);
CREATE INDEX IF NOT EXISTS idx_scheme_map_month ON scheme_funding_map (apply_month_earliest);
CREATE INDEX IF NOT EXISTS idx_processing_status ON processing_unit_concepts (status);
CREATE INDEX IF NOT EXISTS idx_rwa_priority ON rwa_target_zones (priority, status);

-- 25 processing-unit concepts, seeded verbatim from the report's table.
INSERT INTO processing_unit_concepts (unit_no, unit_name, category, raw_input, output_products)
VALUES
 (1,'Wild Forest Resin & Incense','Botanicals','Pine resin, Dipterocarp resin, wild amber, NE aromatic barks','Natural incense sticks, resin blocks, aromatic bark sachets, temple incense range'),
 (2,'Wild Medicinal Plant Extract','Botanicals','Swertia chirayita, Andrographis, Berberis, rhododendron bark','Standardised herbal extracts (pharma B2B), Swertia tea, wild herb tinctures'),
 (3,'Moringa Superfood Supplement','Botanicals','Wild NE moringa (higher nutrient than cultivated)','Moringa capsules, supplement-grade powder, moringa seed oil, protein concentrate'),
 (4,'Activated Bamboo Charcoal','Botanicals','Waste bamboo from processing units (circular model)','Activated charcoal powder (cosmetics), air purifier bags, toothpaste ingredient, cooking charcoal'),
 (5,'Natural Food Colour Extraction','Botanicals','Butterfly pea (blue), black rice (purple), roselle (red), turmeric (yellow)','Liquid + powder food colours (5), butterfly pea tea, colour kits for home bakers'),
 (6,'Bamboo Product Design','Natural Materials','Construction bamboo species (not food bamboo)','Bamboo toothbrushes, cutlery sets, straws, kitchen utensils, gifting boxes'),
 (7,'Banana Fibre & Natural Paper','Natural Materials','Banana plant pseudostem (waste from harvest — currently burned)','Banana fibre sheets, handmade paper, eco-bags, artisan notebooks'),
 (8,'Wild Silk Processing','Natural Materials','Eri silk cocoons (ahimsa silk — no silkworm killed)','Eri silk yarn, fabric, scarves (finished), eri protein for cosmetics'),
 (9,'Naga Pine Resin Products','Natural Materials','Pine resin from NL Pinus kesiya forests (sustainable tapping)','Natural rosin, turpentine oil, pine tar soap, wood sealer, resin candles'),
 (10,'Wild Forest Tea (Non-Assam)','Beverages','Wild Camellia sinensis from NE forests (non-commercial, foraged)','Wild single-estate green/white tea, bamboo-aged tea, NE herbal tisane blends'),
 (11,'Traditional NE Fermented Beverage','Beverages','Black rice, local millet, hill fruits, Naga herbs','Zutho-inspired probiotic rice ferment, rice vinegar, probiotic rice water drink'),
 (12,'Bamboo Vinegar','Beverages','Smoke condensate from bamboo charcoal production (currently wasted)','Food-grade bamboo vinegar, agricultural bio-pesticide, cosmetic grade, soap'),
 (13,'Wild Kombucha & Probiotic Drinks','Beverages','Wild forest tea, rhododendron, passion fruit, Naga ginger as base','NE kombucha (5 flavours), wild ginger beer, rhododendron sparkling ferment'),
 (14,'Natural Dye Extraction','Textile & Craft','Indigo, walnut shells, turmeric, Naga cherry, barberry bark','Natural dye powders (8+ colours), dye concentrate, kits for home weavers/artists'),
 (15,'Naga Handloom Integration','Textile & Craft','Eri silk, local cotton, natural dyes, traditional Naga patterns','Naga shawl premium range, handloom fabric, fashion accessories, home décor'),
 (16,'Edible Insect Protein','Novel','Silkworm pupae (eri silk by-product), Chapurah forest ants, grasshoppers','Roasted silkworm pupa (traditional snack), ant chutney paste, insect protein powder'),
 (17,'Naga Bamboo Salt','Novel','Natural rock salt (Mon district springs) burned in bamboo — traditional method','Naga bamboo salt, herb-smoked salt (King Chili salt, Naga herb salt), salt gift sets'),
 (18,'Mushroom Spawn & Grow Kits','Novel','Wild mushroom spores (oyster, shiitake, lion''s mane) from NE forest','Home mushroom grow kits, spawn bags for farmers, lion''s mane kits, cultivation training'),
 (19,'Aquaculture & Indigenous Fish Processing','Novel','Loktak Lake fish (Ngamu, Pengba), NL stream river fish','MAP-sealed Pengba fillet, smoked Ngamu, Loktak fish pickle, river fish chips'),
 (20,'Bio-Pesticide & Organic Input','Agri-Input','NE botanical plants with pesticidal properties, bamboo vinegar, PGPR','PGPR bio-fertilizer, botanical bio-pesticide (certified), vermicompost, bio-fungicide'),
 (21,'Vermicomposting & Waste Unit','Agri-Input','Organic waste from all 25 processing units (circular model)','Vermicompost, liquid bio-fertilizer, earthworm protein meal, compost tea'),
 (22,'Heritage Seed Bank & Nursery','Agri-Input','Heritage vegetable + spice seeds from NL and MN traditional farming','Heritage seed packets (D2C urban garden), certified organic seedlings, "Grow Your NE" kits'),
 (23,'Cold-Press Neem & Bio-Oil','Agri-Input','NE neem seeds, Pongamia seeds, wild plant oil seeds','Cold-pressed neem oil (organic agriculture + cosmetics), Pongamia feedstock, neem cake'),
 (24,'Solar Drying & Dehydration Services','Agri-Input','Seasonal surplus from any NE farmer (service model — not product unit)','Drying services for hire, custom dehydrated batches, vacuum-dried powder, spray-dried'),
 (25,'Quality Control & Packaging Hub','Infrastructure','All produce and processed products from all 24 units','FSSAI compliance testing, lab QC, uniform MAP packaging, labelling, QR traceability, export packing')
ON CONFLICT (unit_no) DO NOTHING;
