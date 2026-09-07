-- ============================================================================
-- 9999_zz_product_media_ai_schema.sql
--
-- WHY THIS EXISTS
-- Two real gaps confirmed absent from the codebase this session: AI product-
-- image generation and text-to-video generation. Neither has a live provider
-- configured in this environment (no API keys for any image/video generation
-- service exist in .env.example), so this schema tracks generation STATE
-- honestly — a product's images/video are never presented as ready until a
-- real provider call actually completes. See productMediaAIService.js.
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_generation_status VARCHAR(20)
    DEFAULT 'not_requested'
    CHECK (image_generation_status IN ('not_requested', 'pending', 'not_configured', 'completed', 'failed'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_generated_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_generation_status VARCHAR(20)
    DEFAULT 'not_requested'
    CHECK (video_generation_status IN ('not_requested', 'pending', 'not_configured', 'completed', 'failed'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_script JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_generated_at TIMESTAMP;

-- Seed one real, honestly-sourced entry for the "NE honey" example named this
-- session. Raw/wild honey's traditional use for coughs and sore throat in
-- Northeast India is well-documented, widely-recognized folk knowledge (not a
-- specific unverified medical claim) -- filed under 'traditional_use' evidence
-- level with consultation required, matching this table's existing convention
-- (see 062_wellness_natural_practices_schema.sql). No specific disease-cure
-- claim is made; contraindications are included precisely because a "natural"
-- product is not automatically risk-free (infant botulism risk for raw honey
-- under age 1, diabetic caution).
INSERT INTO wellness_natural_practices
    (practice_name, category, common_name, botanical_name, traditional_use,
     related_product_tags, evidence_level, requires_consultation, contraindications, source_reference)
VALUES
    ('Northeast Indian Forest Honey', 'traditional_practice', 'Wild/Forest Honey (NE India)', 'Apis dorsata / Apis cerana',
     'Raw, unprocessed honey sourced from forests of Northeast India is traditionally used across the region as a home remedy for soothing coughs and sore throats, and as a natural sweetener believed to carry regional floral antimicrobial properties. This is traditional/folk use, not a clinically validated treatment for any specific condition.',
     ARRAY['honey', 'raw_honey', 'forest_honey', 'ne_produce'],
     'traditional_use', TRUE,
     'Not recommended for infants under 12 months (botulism spore risk in raw honey). Diabetics should consult a physician before regular use due to sugar content. Not a substitute for medical treatment of persistent respiratory symptoms.',
     'Regional folk-medicine knowledge, Northeast India; general honey-safety guidance (infant botulism risk) is well-established public health knowledge, not specific to this product.')
ON CONFLICT (practice_name) DO NOTHING;
