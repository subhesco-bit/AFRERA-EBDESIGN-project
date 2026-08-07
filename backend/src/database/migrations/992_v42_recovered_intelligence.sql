-- ============================================================================
-- 992_v42_recovered_intelligence.sql   (2026-08-04)
--
-- Business IP recovered from afrera_platform_v42.html (1.14 MB, 12,852 lines,
-- 456 functions, 294 data constants) extracted from the git folder.
--
-- WHAT WAS ACTUALLY NEW
-- Of 294 constants in v42: 56 already existed verbatim, 136 existed as
-- concepts under other names, and 102 were absent. Most of those 102 were
-- single-page-app tab state (BK_TAB, CLM_TAB, FTAB, GTAB…) which React routing
-- correctly replaces, plus V4_NAV…V24_NAV navigation snapshots which are
-- version archaeology rather than runnable code.
--
-- This migration ports the remainder — the parts that encode business
-- knowledge someone had to know, rather than UI mechanics:
--
--   crop_concepts + terms   20 crops, 286 search terms across 5 Indian
--                           languages. The catalog knows product NAMES; it
--                           could not previously match a farmer typing
--                           "mirchi" or "jolokia" to Chilli.
--   freight_lanes           4 real NE->NCR corridors with measured distances.
--   freight_slots           Full-truck slots with FPO capacity RESERVED.
--   transport_modes         7 modes with cost and speed factors.
--   handling_engines        The perishable/ambient rule split.
--   organic_input_rates     Per-acre dressing rates with agronomic purpose.
--   insurance_plan_catalog  Real premium rates, covers, excludes, documents.
--   promo_codes             Discount engine incl. GI-only restriction.
--   return_reasons /
--   dispute_kinds           The vocabulary of things going wrong.
--
-- Runs before 993 (enterprise control) so downstream layers can reference it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SEMANTIC CROP INDEX — multilingual search
--
-- The single most valuable thing in v42. A farmer in Assam types "jolokia";
-- a buyer in Delhi types "ghost pepper"; the catalog stores "King Chilli".
-- Without this table none of those three find each other.
--
-- The source carried a botanical correction worth preserving: the bare term
-- "pepper" was deliberately REMOVED from the chilli concept, because Piper
-- (true pepper) and Zanthoxylum (Sichuan pepper) are different plant families
-- and the catalog carries several. Matching them into Chilli was wrong.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS crop_concepts (
    concept_key VARCHAR(40) PRIMARY KEY,
    label VARCHAR(120) NOT NULL,
    scientific_name VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_concept_terms (
    id SERIAL PRIMARY KEY,
    concept_key VARCHAR(40) NOT NULL REFERENCES crop_concepts(concept_key) ON DELETE CASCADE,
    -- 'en' | 'Hindi' | 'Assamese' | 'Bengali' | 'Meitei' | 'Nepali' | 'variety'
    lang VARCHAR(20) NOT NULL,
    term VARCHAR(120) NOT NULL,
    -- Normalised for lookup: lowercase, so "Bhut Jolokia" matches "bhut jolokia".
    term_norm VARCHAR(120) GENERATED ALWAYS AS (lower(term)) STORED,
    UNIQUE (concept_key, lang, term)
);

-- ---------------------------------------------------------------------------
-- 2. FREIGHT CORRIDORS AND SLOTS
--
-- freight_slots carries the mechanism worth noticing: capacity is split into
-- an FPO reservation and a general pool. Farmer Producer Organisations get
-- guaranteed space on every truck rather than competing with larger traders
-- who can book faster. That is an equity decision expressed as a schema
-- constraint, so it cannot be quietly dropped later.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS freight_lanes (
    id SERIAL PRIMARY KEY,
    lane_code VARCHAR(30) UNIQUE NOT NULL,
    origin VARCHAR(160) NOT NULL,
    destination VARCHAR(160) NOT NULL,
    distance_km INTEGER NOT NULL CHECK (distance_km > 0),
    modes TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transport_modes (
    mode_code VARCHAR(20) PRIMARY KEY,
    icon VARCHAR(10),
    name VARCHAR(80) NOT NULL,
    use_case VARCHAR(160),
    -- Relative cost per kg and relative speed. Rail is cheapest (1.1) and
    -- slowest; air is dearest (9.0) and fastest.
    rate_per_kg_factor NUMERIC(6,2) NOT NULL CHECK (rate_per_kg_factor > 0),
    speed_factor NUMERIC(6,2) NOT NULL CHECK (speed_factor > 0),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS freight_slots (
    id SERIAL PRIMARY KEY,
    slot_code VARCHAR(30) UNIQUE NOT NULL,
    lane_code VARCHAR(30) NOT NULL REFERENCES freight_lanes(lane_code) ON DELETE CASCADE,
    departure_at TIMESTAMP,
    total_capacity_kg INTEGER NOT NULL CHECK (total_capacity_kg > 0),
    fpo_capacity_kg INTEGER NOT NULL DEFAULT 0 CHECK (fpo_capacity_kg >= 0),
    general_capacity_kg INTEGER NOT NULL DEFAULT 0 CHECK (general_capacity_kg >= 0),
    fpo_used_kg INTEGER NOT NULL DEFAULT 0 CHECK (fpo_used_kg >= 0),
    general_used_kg INTEGER NOT NULL DEFAULT 0 CHECK (general_used_kg >= 0),
    -- Released = the FPO reservation has expired and unused space opens to all.
    -- Until then it is held, which is the entire point of reserving it.
    released BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','closing','closed','departed','cancelled')),
    CONSTRAINT slot_split_matches_total CHECK (fpo_capacity_kg + general_capacity_kg <= total_capacity_kg),
    CONSTRAINT slot_fpo_not_oversold CHECK (fpo_used_kg <= fpo_capacity_kg),
    CONSTRAINT slot_general_not_oversold CHECK (general_used_kg <= general_capacity_kg)
);

-- 11-state shipment lifecycle recovered from v42 TM_STATUSES.
CREATE TABLE IF NOT EXISTS shipment_statuses (
    status_code VARCHAR(30) PRIMARY KEY,
    step_order SMALLINT NOT NULL UNIQUE,
    is_terminal BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- 3. HANDLING ENGINES — the perishable / ambient split
--
-- These are operating rules, not settings. "FEFO everywhere" and "temperature
-- breach -> automatic claim + reroute" are commitments the platform makes.
-- Storing them as data means they can be shown to a farmer, audited, and
-- changed deliberately rather than being buried in code.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS handling_engines (
    engine_code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS handling_engine_rules (
    id SERIAL PRIMARY KEY,
    engine_code VARCHAR(20) NOT NULL REFERENCES handling_engines(engine_code) ON DELETE CASCADE,
    rule_order SMALLINT NOT NULL,
    rule_text TEXT NOT NULL,
    UNIQUE (engine_code, rule_order)
);

-- ---------------------------------------------------------------------------
-- 4. ORGANIC INPUT RATES — per-acre dressing
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organic_input_rates (
    id SERIAL PRIMARY KEY,
    input_name VARCHAR(80) UNIQUE NOT NULL,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(60) NOT NULL,
    -- Why it is applied, not just how much. A farmer told "220 kg neem cake"
    -- learns nothing; told it is slow-release nitrogen plus a pest deterrent,
    -- they can reason about substitutes.
    agronomic_role TEXT NOT NULL,
    basis VARCHAR(30) NOT NULL DEFAULT 'per_acre'
);

-- ---------------------------------------------------------------------------
-- 5. INSURANCE PLAN CATALOG
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS insurance_plan_catalog (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(120) UNIQUE NOT NULL,
    premium_basis VARCHAR(160),
    rate NUMERIC(8,4) CHECK (rate >= 0),
    covers TEXT NOT NULL,
    -- Exclusions are mandatory. A policy that lists only what it covers is how
    -- a farmer discovers at claim time that they were never insured.
    excludes TEXT NOT NULL,
    required_documents TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- 6. COMMERCE — promotions, returns, disputes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(40) UNIQUE NOT NULL,
    discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('pct','flat')),
    value NUMERIC(10,4) NOT NULL CHECK (value > 0),
    min_order_value NUMERIC(12,2) DEFAULT 0 CHECK (min_order_value >= 0),
    gi_only BOOLEAN DEFAULT FALSE,
    label VARCHAR(160),
    valid_from DATE,
    valid_to DATE,
    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    -- A percentage discount above 1.0 would mean paying the customer to buy.
    CONSTRAINT promo_pct_sane CHECK (discount_type <> 'pct' OR value <= 1.0)
);

CREATE TABLE IF NOT EXISTS return_reasons (
    id SERIAL PRIMARY KEY,
    reason VARCHAR(120) UNIQUE NOT NULL,
    -- Whether this reason implies the platform (not the customer) bears cost.
    platform_liable BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dispute_kinds (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(120) UNIQUE NOT NULL,
    default_sla_hours INTEGER DEFAULT 72,
    is_active BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- 7. ACCESSIBILITY MODES — recovered from v42 A11Y
--
-- {simple, kiosk, voice, sms}. These are not cosmetic preferences. A farmer
-- on a feature phone with no data reaches the platform by SMS or not at all,
-- and a shared village kiosk needs a different session model than a personal
-- phone. Storing the mode per user lets the API adapt its response, not just
-- the CSS.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS accessibility_modes (
    mode_code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    -- Whether this mode implies a bandwidth-constrained or shared device.
    low_bandwidth BOOLEAN DEFAULT FALSE,
    shared_device BOOLEAN DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- 8. VIEWS
-- ---------------------------------------------------------------------------

-- Remaining bookable space, with the FPO reservation shown separately so the
-- guarantee is visible rather than merely implemented.
CREATE OR REPLACE VIEW v_freight_slot_availability AS
SELECT
    fs.slot_code,
    fl.lane_code,
    fl.origin,
    fl.destination,
    fl.distance_km,
    fs.departure_at,
    fs.total_capacity_kg,
    fs.fpo_capacity_kg - fs.fpo_used_kg          AS fpo_available_kg,
    fs.general_capacity_kg - fs.general_used_kg  AS general_available_kg,
    CASE WHEN fs.released
         THEN (fs.fpo_capacity_kg - fs.fpo_used_kg) + (fs.general_capacity_kg - fs.general_used_kg)
         ELSE fs.general_capacity_kg - fs.general_used_kg
    END AS bookable_by_general_kg,
    fs.released,
    fs.status
FROM freight_slots fs
JOIN freight_lanes fl ON fl.lane_code = fs.lane_code
WHERE fs.status IN ('open','closing');

-- ---------------------------------------------------------------------------
-- 9. INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_crop_terms_norm ON crop_concept_terms (term_norm);
CREATE INDEX IF NOT EXISTS idx_crop_terms_concept ON crop_concept_terms (concept_key);
CREATE INDEX IF NOT EXISTS idx_crop_terms_lang ON crop_concept_terms (lang);
CREATE INDEX IF NOT EXISTS idx_freight_slots_lane ON freight_slots (lane_code, status);
CREATE INDEX IF NOT EXISTS idx_freight_slots_departure ON freight_slots (departure_at);
CREATE INDEX IF NOT EXISTS idx_engine_rules_engine ON handling_engine_rules (engine_code);
CREATE INDEX IF NOT EXISTS idx_promo_active ON promo_codes (code) WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- 10. SEED DATA (extracted verbatim from v42 — not invented)
-- ---------------------------------------------------------------------------
INSERT INTO crop_concepts (concept_key, label, scientific_name) VALUES
('chilli','Chilli','Capsicum spp.'),
('turmeric','Turmeric','Curcuma longa'),
('ginger','Ginger','Zingiber officinale'),
('rice','Rice','Oryza sativa'),
('honey','Honey','Apis / Tetragonula spp.'),
('citrus','Citrus & Lemon','Citrus spp.'),
('cardamom','Large Cardamom','Amomum subulatum'),
('bamboo','Bamboo Shoot','Bambusa / Dendrocalamus spp.'),
('tea','Tea','Camellia sinensis'),
('millet','Millets & Minor Grains','Poaceae (various)'),
('perilla','Perilla / Oilseeds','Perilla frutescens'),
('pepper','Pepper & Sichuan Pepper','Piper / Zanthoxylum spp.'),
('mushroom','Mushrooms','Fungi (various)'),
('banana','Banana & Plantain','Musa spp.'),
('potato','Roots & Tubers','Solanum / Dioscorea spp.'),
('pulse','Pulses & Beans','Fabaceae'),
('leafy','Greens & Leafy Vegetables','Various'),
('silk','Silk & Handloom','Bombyx / Antheraea spp.'),
('bay','Bay Leaf & Aromatic Leaves','Cinnamomum tamala'),
('pineapple','Pineapple','Ananas comosus')
ON CONFLICT (concept_key) DO NOTHING;

INSERT INTO crop_concept_terms (concept_key, lang, term) VALUES
('chilli','en','chilli'),
('chilli','en','chili'),
('chilli','en','chile'),
('chilli','en','hot pepper'),
('chilli','en','chilli pepper'),
('chilli','en','red chilli'),
('chilli','en','chilli powder'),
('chilli','Hindi','mirch'),
('chilli','Hindi','mirchi'),
('chilli','Hindi','lal mirch'),
('chilli','Hindi','mircha'),
('chilli','Assamese','jolokia'),
('chilli','Assamese','bhut jolokia'),
('chilli','Bengali','lonka'),
('chilli','Bengali','lanka'),
('chilli','Nepali','khursani'),
('chilli','Meitei','umorok'),
('chilli','Meitei','morok'),
('chilli','variety','Naga Mircha'),
('chilli','variety','Bhut Jolokia'),
('chilli','variety','Dalle Khursani'),
('chilli','variety','Bird''s Eye Chilli'),
('chilli','variety','Umorok'),
('turmeric','en','turmeric'),
('turmeric','en','curcumin'),
('turmeric','en','yellow root'),
('turmeric','Hindi','haldi'),
('turmeric','Assamese','halodhi'),
('turmeric','Bengali','holud'),
('turmeric','Nepali','besar'),
('turmeric','Meitei','yaingang'),
('turmeric','variety','Lakadong Turmeric'),
('turmeric','variety','Lakadong Turmeric Powder'),
('ginger','en','ginger'),
('ginger','en','dry ginger'),
('ginger','Hindi','adrak'),
('ginger','Hindi','sonth'),
('ginger','Assamese','ada'),
('ginger','Bengali','ada'),
('ginger','Nepali','aduwa'),
('ginger','Meitei','sing'),
('ginger','variety','Karbi Anglong Ginger'),
('ginger','variety','Nadia Ginger'),
('rice','en','rice'),
('rice','en','paddy'),
('rice','en','grain'),
('rice','en','black rice'),
('rice','en','red rice'),
('rice','en','sticky rice'),
('rice','en','aromatic rice'),
('rice','Hindi','chawal'),
('rice','Hindi','chaval'),
('rice','Assamese','chaul'),
('rice','Assamese','saul'),
('rice','Bengali','chal'),
('rice','Nepali','chamal'),
('rice','Meitei','chak'),
('rice','Meitei','phou'),
('rice','variety','Chak-Hao'),
('rice','variety','Chak-Hao Black Rice'),
('rice','variety','Joha Rice'),
('rice','variety','Boka Chaul'),
('rice','variety','Chokuwa Rice'),
('rice','variety','Bao Rice'),
('rice','variety','Keradapini'),
('honey','en','honey'),
('honey','en','raw honey'),
('honey','en','forest honey'),
('honey','en','wild honey'),
('honey','Hindi','shahad'),
('honey','Hindi','madhu'),
('honey','Assamese','mou'),
('honey','Bengali','modhu'),
('honey','Nepali','mahuri'),
('honey','variety','Wild Forest Honey'),
('honey','variety','Stingless Bee Honey'),
('honey','variety','Orange Blossom Honey'),
('honey','variety','Lychee Honey'),
('honey','variety','Mustard Honey'),
('citrus','en','lemon'),
('citrus','en','lime'),
('citrus','en','orange'),
('citrus','en','mandarin'),
('citrus','en','citrus'),
('citrus','en','tangerine'),
('citrus','Hindi','nimbu'),
('citrus','Hindi','santra'),
('citrus','Assamese','nemu'),
('citrus','Assamese','kamala'),
('citrus','Bengali','lebu'),
('citrus','Bengali','kamala'),
('citrus','Nepali','kagati'),
('citrus','Nepali','suntala'),
('citrus','Meitei','champra'),
('citrus','variety','Kaji Nemu'),
('citrus','variety','Kachai Lemon'),
('citrus','variety','Khasi Mandarin'),
('citrus','variety','Memang Narang'),
('citrus','variety','Arunachal Orange'),
('cardamom','en','cardamom'),
('cardamom','en','black cardamom'),
('cardamom','en','large cardamom'),
('cardamom','Hindi','badi elaichi'),
('cardamom','Hindi','elaichi'),
('cardamom','Nepali','alainchi'),
('cardamom','Bengali','boro elach'),
('cardamom','variety','Large Cardamom'),
('bamboo','en','bamboo'),
('bamboo','en','bamboo shoot'),
('bamboo','en','fermented bamboo'),
('bamboo','Hindi','bans'),
('bamboo','Assamese','bah gaj'),
('bamboo','Assamese','khorisa'),
('bamboo','Nepali','tama'),
('bamboo','Meitei','soibum'),
('bamboo','Meitei','soidon'),
('bamboo','variety','Mesu (Fermented Bamboo)'),
('bamboo','variety','Soibum'),
('bamboo','variety','Soidon'),
('bamboo','variety','Bamboo Shoot Chutney'),
('tea','en','tea'),
('tea','en','chai'),
('tea','en','black tea'),
('tea','en','green tea'),
('tea','en','orthodox'),
('tea','en','ctc'),
('tea','Hindi','chai'),
('tea','Assamese','sah'),
('tea','Bengali','cha'),
('tea','Nepali','chiya'),
('tea','variety','Assam Orthodox Tea'),
('tea','variety','Assam CTC Tea'),
('tea','variety','Assam Green Tea'),
('tea','variety','Assam White Tea'),
('millet','en','millet'),
('millet','en','millets'),
('millet','en','job''s tears'),
('millet','en','coix'),
('millet','en','foxtail'),
('millet','en','finger millet'),
('millet','Hindi','bajra'),
('millet','Hindi','ragi'),
('millet','Hindi','kodo'),
('millet','Nepali','kodo'),
('millet','Assamese','kaguni'),
('millet','variety','Wild Job''s Tears'),
('millet','variety','Millets mix'),
('perilla','en','perilla'),
('perilla','en','sesame'),
('perilla','en','oilseed'),
('perilla','en','cold pressed oil'),
('perilla','Hindi','til'),
('perilla','Hindi','bhangira'),
('perilla','Nepali','silam'),
('perilla','Assamese','til'),
('perilla','variety','Perilla seed'),
('pepper','en','pepper'),
('pepper','en','black pepper'),
('pepper','en','long pepper'),
('pepper','en','sichuan pepper'),
('pepper','en','peppercorn'),
('pepper','Hindi','kali mirch'),
('pepper','Hindi','pippali'),
('pepper','Hindi','timur'),
('pepper','Assamese','jaluk'),
('pepper','Bengali','golmorich'),
('pepper','Nepali','timur'),
('pepper','Nepali','marich'),
('pepper','variety','Piper longum'),
('pepper','variety','Piper thomsonii'),
('pepper','variety','Piper wallichii'),
('pepper','variety','Piper attenuatum'),
('pepper','variety','Zanthoxylum'),
('mushroom','en','mushroom'),
('mushroom','en','mushrooms'),
('mushroom','en','oyster mushroom'),
('mushroom','en','shiitake'),
('mushroom','en','button mushroom'),
('mushroom','Hindi','khumb'),
('mushroom','Hindi','kukurmutta'),
('mushroom','Assamese','chatu'),
('mushroom','Bengali','chatu'),
('mushroom','Nepali','chyau'),
('mushroom','variety','Oyster Mushroom'),
('mushroom','variety','Shiitake'),
('banana','en','banana'),
('banana','en','plantain'),
('banana','en','banana flower'),
('banana','Hindi','kela'),
('banana','Assamese','kol'),
('banana','Bengali','kola'),
('banana','Nepali','kera'),
('banana','Meitei','laphu'),
('banana','variety','Malbhog Banana'),
('banana','variety','Jahaji Banana'),
('potato','en','potato'),
('potato','en','yam'),
('potato','en','tapioca'),
('potato','en','sweet potato'),
('potato','en','colocasia'),
('potato','en','taro'),
('potato','en','arbi'),
('potato','Hindi','aloo'),
('potato','Hindi','ratalu'),
('potato','Hindi','arbi'),
('potato','Assamese','alu'),
('potato','Assamese','kosu'),
('potato','Bengali','alu'),
('potato','Bengali','kochu'),
('potato','Nepali','aloo'),
('potato','Nepali','tarul'),
('potato','variety','Tapioca'),
('potato','variety','Sweet Potato'),
('potato','variety','Colocasia'),
('pulse','en','pulse'),
('pulse','en','pulses'),
('pulse','en','dal'),
('pulse','en','lentil'),
('pulse','en','bean'),
('pulse','en','beans'),
('pulse','en','soybean'),
('pulse','en','rajma'),
('pulse','en','pea'),
('pulse','Hindi','dal'),
('pulse','Hindi','rajma'),
('pulse','Hindi','matar'),
('pulse','Hindi','chana'),
('pulse','Assamese','dail'),
('pulse','Assamese','mah'),
('pulse','Bengali','dal'),
('pulse','Nepali','dal'),
('pulse','Nepali','simi'),
('pulse','variety','Rice Bean'),
('pulse','variety','King Chilli Bean'),
('pulse','variety','Soybean'),
('pulse','variety','Naga Dal'),
('leafy','en','greens'),
('leafy','en','leafy'),
('leafy','en','spinach'),
('leafy','en','mustard leaf'),
('leafy','en','fern'),
('leafy','en','herb'),
('leafy','en','herbs'),
('leafy','Hindi','saag'),
('leafy','Hindi','palak'),
('leafy','Hindi','methi'),
('leafy','Assamese','xaak'),
('leafy','Bengali','shak'),
('leafy','Nepali','saag'),
('leafy','variety','Seasonal greens bundle'),
('leafy','variety','Fiddlehead Fern'),
('leafy','variety','Roselle'),
('silk','en','silk'),
('silk','en','handloom'),
('silk','en','textile'),
('silk','en','shawl'),
('silk','en','stole'),
('silk','en','weave'),
('silk','en','eri'),
('silk','en','muga'),
('silk','Hindi','resham'),
('silk','Assamese','pat'),
('silk','Assamese','muga'),
('silk','Assamese','eri'),
('silk','Bengali','resham'),
('silk','Nepali','resham'),
('silk','variety','Muga Silk'),
('silk','variety','Eri Silk'),
('silk','variety','Pat Silk'),
('silk','variety','Tangsa Textile'),
('bay','en','bay leaf'),
('bay','en','tejpat'),
('bay','en','tejpatta'),
('bay','en','cinnamon leaf'),
('bay','Hindi','tejpatta'),
('bay','Assamese','tejpat'),
('bay','Bengali','tejpata'),
('bay','Nepali','tejpat'),
('bay','variety','Tejpat'),
('bay','variety','Bay Leaf'),
('pineapple','en','pineapple'),
('pineapple','Hindi','ananas'),
('pineapple','Assamese','anaras'),
('pineapple','Bengali','anarosh'),
('pineapple','Nepali','bhuin katahar'),
('pineapple','variety','Queen Pineapple')
ON CONFLICT DO NOTHING;

INSERT INTO freight_lanes (lane_code, origin, destination, distance_km, modes) VALUES
('imw-ncr','Iewduh/Shillong hub','Azadpur Mandi, Delhi',2050,ARRAY['road','rail','air']),
('imp-ncr','Imphal collection node','Azadpur Mandi, Delhi',2400,ARRAY['road','air']),
('dim-ncr','Dimapur railhead','Ghazipur Mandi, Delhi',2200,ARRAY['road','rail']),
('gau-ncr','Guwahati hub','Okhla, Delhi',1900,ARRAY['road','rail','air'])
ON CONFLICT (lane_code) DO NOTHING;

INSERT INTO transport_modes (mode_code, icon, name, use_case, rate_per_kg_factor, speed_factor) VALUES
('bike','🛵','2-Wheeler','Hyperlocal <15 km',1.2,0.5),
('auto','🛺','3-Wheeler','City & feeder loads',1.6,0.8),
('truck','🚚','Truck (dry/reefer)','Bulk & cold-chain',2.4,1.0),
('rail','🚂','Rail','Long-haul bulk, low ₹/kg',1.1,2.5),
('courier','📦','Courier','Small parcels, fast',4.5,1.2),
('speedpost','🏣','Speed Post','India Post nationwide reach',3.0,2.0),
('air','✈️','Air Cargo','Perishable, premium speed',9.0,0.3)
ON CONFLICT (mode_code) DO NOTHING;

INSERT INTO handling_engines (engine_code, name) VALUES
('perishable','Perishable Engine'),
('ambient','Non-Perishable Engine')
ON CONFLICT (engine_code) DO NOTHING;
INSERT INTO handling_engine_rules (engine_code, rule_order, rule_text) VALUES
('perishable',1,'Priority dispatch — perishables jump the queue'),
('perishable',2,'FEFO everywhere: first-expiry-first-out picking'),
('perishable',3,'Cold chain mandatory; pre-cool before loading'),
('perishable',4,'Shelf-life clock drives dynamic markdown near expiry'),
('perishable',5,'Temperature breach → automatic claim + reroute'),
('perishable',6,'Expiry prediction feeds Glut Watch and processing diversion'),
('perishable',7,'Emergency rerouting to nearest demand on delay'),
('ambient',1,'Cost-first: rail and container pooling beat speed'),
('ambient',2,'Bulk storage at hub; ABC classification by turnover'),
('ambient',3,'Full-Truck Window consolidation to crush per-kg freight'),
('ambient',4,'Cycle counting, not panic counting'),
('ambient',5,'Dock scheduling around rail slots'),
('ambient',6,'Carbon-lighter modes preferred at equal cost')
ON CONFLICT DO NOTHING;

INSERT INTO promo_codes (code, discount_type, value, min_order_value, gi_only, label) VALUES
('NEHARVEST10','pct',0.10,0,FALSE,'10% off your order'),
('GI15','pct',0.15,0,TRUE,'15% off GI-registered items'),
('FARM50','flat',50,500,FALSE,'₹50 off orders over ₹500'),
('FESTIVE20','pct',0.20,1000,FALSE,'20% off orders over ₹1000')
ON CONFLICT (code) DO NOTHING;

INSERT INTO shipment_statuses (status_code, step_order, is_terminal) VALUES
('Draft',1,FALSE),
('Quoted',2,FALSE),
('Booked',3,FALSE),
('Ready',4,FALSE),
('PickedUp',5,FALSE),
('HubReceived',6,FALSE),
('InTransit',7,FALSE),
('OutForDelivery',8,FALSE),
('Delivered',9,FALSE),
('PODConfirmed',10,FALSE),
('Settled',11,TRUE)
ON CONFLICT (status_code) DO NOTHING;

INSERT INTO organic_input_rates (input_name, quantity, unit, agronomic_role) VALUES
('Vermicompost',2.2,'tonnes','Base soil conditioner — builds organic carbon over seasons'),
('Neem cake',220,'kg','Slow-release nitrogen + natural pest deterrent'),
('Jeevamrut',200,'litres (as liquid feed, split over 3-4 applications)','Microbial activator — improves nutrient uptake'),
('Biopesticide (Trichoderma)',4,'kg (seed/soil treatment)','Root-rot and wilt suppression')
ON CONFLICT (input_name) DO NOTHING;

INSERT INTO insurance_plan_catalog (plan_name, premium_basis, rate, covers, excludes, required_documents) VALUES
('PMFBY Crop Cover','% of sum insured (Kharif 2%)',0.02,'Yield loss: drought, flood, pests, hail','Negligence, unnotified crops','Land record, sowing proof, bank passbook'),
('Transit & Cold-Chain Cover','₹1/kg or ~1% of value',0.01,'Damage, theft, temperature breach (logged)','Improper packing, undeclared value','Invoice, POD, temperature log'),
('Equipment Breakdown','~1.5% of asset value / yr',0.015,'Machine failure, electrical damage','Wear & tear, unauthorised repair','Purchase record, repair estimate'),
('FPO Group Health','per-member slab',0.012,'Hospitalisation for member families','Pre-existing (waiting period)','ID, discharge summary, bills')
ON CONFLICT (plan_name) DO NOTHING;

INSERT INTO return_reasons (reason, platform_liable) VALUES
('Damaged in transit',TRUE),
('Wrong product',TRUE),
('Late delivery',TRUE),
('Spoiled / quality',FALSE),
('Temperature failure (cold chain)',TRUE),
('Partial shortage',TRUE)
ON CONFLICT (reason) DO NOTHING;

INSERT INTO dispute_kinds (kind) VALUES
('Payment delay/shortfall'),
('Quality rejection'),
('Return / refund'),
('Transit damage or temperature excursion'),
('Weight/quantity shortage')
ON CONFLICT (kind) DO NOTHING;

INSERT INTO accessibility_modes (mode_code, name, description, low_bandwidth, shared_device) VALUES
('simple','Simple view','Larger type, fewer choices per screen, no dense tables. For users who find the full interface overwhelming.',FALSE,FALSE),
('kiosk','Shared kiosk','Village or CSC shared terminal: no persistent login, session auto-clears, no stored payment details.',FALSE,TRUE),
('voice','Voice-assisted','Screen content is readable aloud; primary actions reachable without reading. For low-literacy and low-vision users.',FALSE,FALSE),
('sms','SMS fallback','Feature-phone access over SMS with no data connection. The only channel some farmers have.',TRUE,FALSE)
ON CONFLICT (mode_code) DO NOTHING;

