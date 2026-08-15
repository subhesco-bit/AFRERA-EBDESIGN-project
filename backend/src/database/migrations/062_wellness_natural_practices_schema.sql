-- Wellness Natural Practices Reference Schema
-- Small reference table of nutrition-adjacent traditional/natural wellness
-- practices (herbs, Ayurveda, nutrition therapy) relevant to AFRERA's
-- product catalog. Extends the nutrition intelligence layer.
--
-- Discipline note: this table mirrors the evidence-labelling discipline this
-- codebase already applies to the veterinary "Natural Therapy Layer"
-- (see AFRERA_CLAUDE_BUILD_DIRECTIVE.md PART 5.8) — every row MUST carry an
-- evidence_level and a requires_consultation flag, and callers must render
-- both next to the recommendation, not bury them. This table is reference/
-- educational content only: it does not diagnose, interpret symptoms, or
-- read lab results. See nutritionIntelligenceService.js.

CREATE TABLE IF NOT EXISTS wellness_natural_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'herbal', 'ayurveda', 'nutrition_therapy', 'traditional_practice'
    common_name VARCHAR(150),
    botanical_name VARCHAR(150),
    traditional_use TEXT,
    related_product_tags TEXT[], -- cross-links to products.tags / food_nutrition_profiles.food_group
    evidence_level VARCHAR(30) NOT NULL
        CHECK (evidence_level IN ('traditional_use', 'preliminary_evidence', 'well_established')),
    requires_consultation BOOLEAN NOT NULL DEFAULT TRUE,
    contraindications TEXT,
    source_reference TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wellness_practices_category ON wellness_natural_practices(category);
CREATE INDEX IF NOT EXISTS idx_wellness_practices_tags ON wellness_natural_practices USING gin(related_product_tags);
CREATE INDEX IF NOT EXISTS idx_wellness_practices_evidence_level ON wellness_natural_practices(evidence_level);

-- Reuses update_updated_at_column(), already defined in
-- 020_consumer_health_schema.sql / 036_nutrition_intelligence_schema.sql.
DROP TRIGGER IF EXISTS update_wellness_natural_practices_updated_at ON wellness_natural_practices;
CREATE TRIGGER update_wellness_natural_practices_updated_at BEFORE UPDATE ON wellness_natural_practices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- Real, well-known traditional/nutrition practices relevant to AFRERA's
-- catalog. Evidence levels are intentionally conservative and sources are
-- described generically (recognized bodies / trial registries / traditional
-- pharmacopoeia) rather than as specific invented study citations.
-- ============================================================================

INSERT INTO wellness_natural_practices
    (practice_name, category, common_name, botanical_name, traditional_use,
     related_product_tags, evidence_level, requires_consultation, contraindications, source_reference)
VALUES
('Turmeric / Curcumin', 'herbal', 'Turmeric', 'Curcuma longa',
 'Used traditionally as a culinary spice and in Ayurvedic practice to support digestion; its active compound curcumin has been studied for inflammatory and joint conditions.',
 ARRAY['spices', 'turmeric', 'curcumin'], 'preliminary_evidence', TRUE,
 'May interact with blood-thinning medication; high doses can cause GI upset. Avoid therapeutic doses during pregnancy without medical guidance.',
 'NCCIH herb factsheet (Turmeric); trials registered on ClinicalTrials.gov'),

('Ginger', 'herbal', 'Ginger', 'Zingiber officinale',
 'Traditionally used to ease digestive discomfort and nausea.',
 ARRAY['spices', 'ginger'], 'well_established', FALSE,
 'Can interact with anticoagulant medication at high doses.',
 'NCCIH herb factsheet (Ginger)'),

('Tulsi (Holy Basil)', 'ayurveda', 'Tulsi', 'Ocimum tenuiflorum',
 'Used in Ayurvedic tradition as a daily tea/adaptogen for general wellness and stress support.',
 ARRAY['herbal-tea', 'tulsi'], 'traditional_use', TRUE,
 'Limited human trial data; avoid therapeutic doses in pregnancy and alongside blood-sugar or blood-thinning medication without medical guidance.',
 'Traditional Ayurvedic pharmacopoeia; preliminary human studies only'),

('Ashwagandha', 'ayurveda', 'Ashwagandha', 'Withania somnifera',
 'Used in Ayurveda as a rasayana (rejuvenative) herb, commonly for stress and sleep support.',
 ARRAY['ayurveda', 'ashwagandha'], 'preliminary_evidence', TRUE,
 'Not recommended in pregnancy; may interact with thyroid, sedative, and immunosuppressant medication.',
 'NCCIH herb factsheet (Ashwagandha); small-scale RCTs on stress/sleep outcomes'),

('Moringa', 'nutrition_therapy', 'Moringa', 'Moringa oleifera',
 'Leaves used traditionally as a nutrient-dense food source, rich in vitamins and minerals.',
 ARRAY['moringa', 'superfood'], 'preliminary_evidence', FALSE,
 'May lower blood sugar; caution if on diabetes medication.',
 'Nutritional composition studies; limited clinical trial data'),

('Fenugreek', 'nutrition_therapy', 'Fenugreek', 'Trigonella foenum-graecum',
 'Seeds used traditionally in cooking and, in some communities, to support lactation and blood-sugar balance.',
 ARRAY['spices', 'fenugreek'], 'preliminary_evidence', TRUE,
 'Can lower blood sugar and interact with diabetes/anticoagulant medication; avoid medicinal doses in pregnancy.',
 'NCCIH herb factsheet (Fenugreek); small clinical studies on glycemic response'),

('Amla (Indian Gooseberry)', 'nutrition_therapy', 'Amla', 'Phyllanthus emblica',
 'Traditionally consumed as a food source of vitamin C and as an Ayurvedic rasayana.',
 ARRAY['amla', 'vitamin-c'], 'traditional_use', FALSE,
 'Generally recognized as safe as a food; therapeutic-dose evidence is limited.',
 'Traditional Ayurvedic pharmacopoeia; nutritional composition data')
ON CONFLICT (practice_name) DO NOTHING;
