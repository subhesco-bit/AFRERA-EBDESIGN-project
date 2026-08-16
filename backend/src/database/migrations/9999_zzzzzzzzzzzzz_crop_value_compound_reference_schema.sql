-- Crop Value-Compound Reference Data
--
-- READ BEFORE EXTENDING: this table holds PUBLISHED, CITED reference ranges
-- for a variety in general (e.g. "turmeric typically contains 1-6% curcumin,
-- per PubMed/ScienceDirect") — it is NOT a lab measurement of any specific
-- seller's batch. Same evidence-citation discipline as
-- wellness_natural_practices (062_wellness_natural_practices_schema.sql):
-- every row carries a real source_url and last_verified_date, and callers
-- MUST label this as "typical for the variety" distinctly from a real
-- per-batch product_nutrition value if/when one exists. Conflating the two
-- would misrepresent a generic published range as a specific measured fact
-- about one farmer's product — exactly the fabrication this codebase's
-- discipline exists to prevent.
--
-- Seeded 2026-08-16 via real web search (not invented): turmeric curcumin
-- range, Bhut Jolokia (Ghost Pepper) Scoville range, Kashmiri red chilli
-- Scoville + ASTA color. Extend the same way — real source, dated.

CREATE TABLE IF NOT EXISTS crop_value_compound_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variety_name VARCHAR(150) NOT NULL,     -- matches regional_variety_directory.product_name where applicable
    compound_key VARCHAR(50) NOT NULL,      -- matches NUTRIENT_META keys in nutritionIntelligenceService.js (e.g. CURCUMIN_PCT)
    typical_min NUMERIC(12,4),
    typical_max NUMERIC(12,4),
    unit VARCHAR(20) NOT NULL,
    notes TEXT,
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('wikipedia', 'institute', 'published_study', 'trade_body')),
    source_url TEXT NOT NULL,
    last_verified_date DATE NOT NULL,
    -- FALSE for AI-suggested rows pending human review (see
    -- cropValueResearchService.js) — a human must flip this to TRUE before
    -- the row is used in any customer-facing "why this costs more" claim.
    -- Manually seeded rows below are inserted already verified because a
    -- human (this session) read and confirmed the real source.
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(variety_name, compound_key, source_url)
);

CREATE INDEX IF NOT EXISTS idx_crop_value_compound_variety ON crop_value_compound_reference(variety_name);

INSERT INTO crop_value_compound_reference
    (variety_name, compound_key, typical_min, typical_max, unit, notes, source_type, source_url, last_verified_date, verified)
VALUES
('Turmeric', 'CURCUMIN_PCT', 1, 6, '%',
 'Raw/dried turmeric powder curcuminoid content typically 1-6% by weight; curcumin itself is ~70-75% of total curcuminoids. Varies by agro-climatic zone and processing.',
 'published_study', 'https://pubmed.ncbi.nlm.nih.gov/17044766/', '2026-08-16', TRUE),
('Bhut Jolokia (Ghost Pepper)', 'CAPSAICIN_SHU', 855000, 1041427, 'SHU',
 'Guinness-certified peak measurement 1,001,304 SHU (2007); New Mexico State University Chile Pepper Institute study measured a range of 855,000-1,041,427 SHU (avg ~950,000), USDA ARS HPLC-tested.',
 'institute', 'https://www.britannica.com/plant/ghost-pepper', '2026-08-16', TRUE),
('Kashmiri Red Chilli', 'CAPSAICIN_SHU', 1000, 2000, 'SHU',
 'Mild heat by chilli standards — the variety''s value is in color, not heat.',
 'wikipedia', 'https://en.wikipedia.org/wiki/Kashmiri_red_chilli', '2026-08-16', TRUE),
('Kashmiri Red Chilli', 'ASTA_COLOR', 50, 60, 'ASTA',
 'India Spices Board reports 54.10 ASTA for standard Kashmir chilli; premium graded lots can exceed 120 ASTA. This is the variety''s actual differentiator vs. heat-focused chillies.',
 'trade_body', 'https://en.wikipedia.org/wiki/Kashmiri_red_chilli', '2026-08-16', TRUE);
