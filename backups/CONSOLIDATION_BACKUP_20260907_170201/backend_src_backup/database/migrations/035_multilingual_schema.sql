-- Multilingual Intelligence Platform Database Schema
-- Supports automatic language detection, translation memory, and multilingual content management

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pg_trgm function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- ============================================================================
-- LANGUAGE & LOCALE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    iso_code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'en', 'hi', 'as', 'bn', 'mni'
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    direction VARCHAR(10) DEFAULT 'ltr', -- 'ltr' or 'rtl'
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher priority for more common languages
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locales (
    id SERIAL PRIMARY KEY,
    language_id INTEGER REFERENCES languages(id),
    region_code VARCHAR(10), -- e.g., 'IN', 'US', 'GB'
    locale_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'en-IN', 'hi-IN'
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRANSLATION MEMORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS translation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text TEXT NOT NULL,
    source_language_id INTEGER REFERENCES languages(id) NOT NULL,
    target_language_id INTEGER REFERENCES languages(id) NOT NULL,
    target_text TEXT NOT NULL,
    context VARCHAR(255),
    domain VARCHAR(100), -- e.g., 'commerce', 'agriculture', 'finance'
    confidence_score DECIMAL(5, 2) DEFAULT 1.00,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_text, source_language_id, target_language_id)
);

CREATE INDEX IF NOT EXISTS idx_translation_memory_source ON translation_memory USING gin(to_tsvector('english', source_text));
CREATE INDEX IF NOT EXISTS idx_translation_memory_languages ON translation_memory(source_language_id, target_language_id);
CREATE INDEX IF NOT EXISTS idx_translation_memory_domain ON translation_memory(domain);

-- ============================================================================
-- MULTILINGUAL CONTENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_key VARCHAR(255) NOT NULL, -- e.g., 'product.name.123', 'button.submit'
    entity_type VARCHAR(50) NOT NULL, -- 'product', 'category', 'ui_element', 'message'
    entity_id UUID,
    language_id INTEGER REFERENCES languages(id) NOT NULL,
    translated_text TEXT NOT NULL,
    context TEXT,
    is_auto_translated BOOLEAN DEFAULT FALSE,
    auto_translation_confidence DECIMAL(5, 2),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_key, language_id)
);

CREATE INDEX IF NOT EXISTS idx_content_translations_key ON content_translations(content_key);
CREATE INDEX IF NOT EXISTS idx_content_translations_entity ON content_translations(entity_type, entity_id);

-- ============================================================================
-- LANGUAGE DETECTION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS language_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id VARCHAR(100),
    input_text TEXT NOT NULL,
    detected_language_id INTEGER REFERENCES languages(id),
    confidence_score DECIMAL(5, 2),
    detection_method VARCHAR(50), -- 'api', 'model', 'heuristic'
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detection_logs_user ON language_detection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_logs_session ON language_detection_logs(session_id);

-- ============================================================================
-- TRANSLATION REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS translation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    source_language_id INTEGER REFERENCES languages(id),
    target_language_id INTEGER REFERENCES languages(id) NOT NULL,
    source_text TEXT NOT NULL,
    translated_text TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    used_memory BOOLEAN DEFAULT FALSE,
    memory_match_id UUID REFERENCES translation_memory(id),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_translation_requests_user ON translation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_requests_status ON translation_requests(status);

-- ============================================================================
-- USER LANGUAGE PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    primary_language_id INTEGER REFERENCES languages(id),
    secondary_language_id INTEGER REFERENCES languages(id),
    auto_detect_language BOOLEAN DEFAULT TRUE,
    auto_translate_content BOOLEAN DEFAULT FALSE,
    preferred_translation_service VARCHAR(50), -- 'google', 'azure', 'amazon', 'internal'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NORTHEAST REGIONAL LANGUAGES
-- ============================================================================

-- Pre-populate with Indian languages
INSERT INTO languages (iso_code, name, native_name, direction, priority) VALUES
('en', 'English', 'English', 'ltr', 100),
('hi', 'Hindi', 'हिन्दी', 'ltr', 90),
('bn', 'Bengali', 'বাংলা', 'ltr', 80),
('as', 'Assamese', 'অসমীয়া', 'ltr', 70),
('mni', 'Manipuri', 'মৈতৈলোন্', 'ltr', 65),
('mte', 'Meitei Mayek', 'ꯃꯇꯩꯂꯣꯟ', 'ltr', 60),
('kha', 'Khasi', 'খাসি', 'ltr', 55),
('gar', 'Garo', 'A·chik', 'ltr', 50),
('nep', 'Nepali', 'नेपाली', 'ltr', 45),
('mizo', 'Mizo', 'Mizo ṭawng', 'ltr', 40),
('bho', 'Bhojpuri', 'भोजपुरी', 'ltr', 35),
('ori', 'Odia', 'ଓଡ଼ିଆ', 'ltr', 30),
('pun', 'Punjabi', 'ਪੰਜਾਬੀ', 'ltr', 25),
('guj', 'Gujarati', 'ગુજરાતી', 'ltr', 20),
('tam', 'Tamil', 'தமிழ்', 'ltr', 15),
('tel', 'Telugu', 'తెలుగు', 'ltr', 10),
('mal', 'Malayalam', 'മലയാളം', 'ltr', 5),
('kan', 'Kannada', 'ಕನ್ನಡ', 'ltr', 5),
('mar', 'Marathi', 'मराठी', 'ltr', 5),
('urd', 'Urdu', 'اردو', 'rtl', 5);

-- Pre-populate locales
INSERT INTO locales (language_id, region_code, locale_code, display_name) VALUES
(1, 'IN', 'en-IN', 'English (India)'),
(2, 'IN', 'hi-IN', 'Hindi (India)'),
(3, 'IN', 'bn-IN', 'Bengali (India)'),
(4, 'IN', 'as-IN', 'Assamese (India)'),
(5, 'IN', 'mni-IN', 'Manipuri (India)'),
(6, 'IN', 'mte-IN', 'Meitei Mayek (India)'),
(7, 'IN', 'kha-IN', 'Khasi (India)'),
(8, 'IN', 'gar-IN', 'Garo (India)'),
(9, 'IN', 'nep-IN', 'Nepali (India)'),
(10, 'IN', 'mizo-IN', 'Mizo (India)');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to detect language from text (placeholder - would integrate with ML model)
CREATE OR REPLACE FUNCTION detect_language(input_text TEXT)
RETURNS INTEGER AS $$
DECLARE
    detected_id INTEGER;
BEGIN
    -- Simple heuristic based on character ranges
    -- In production, this would call an ML model or external API
    IF input_text ~ '[\u0900-\u097F]' THEN
        -- Devanagari script (Hindi, Marathi, Nepali, etc.)
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'hi' LIMIT 1;
    ELSIF input_text ~ '[\u0980-\u09FF]' THEN
        -- Bengali script
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'bn' LIMIT 1;
    ELSIF input_text ~ '[\u0A00-\u0A7F]' THEN
        -- Gurmukhi script (Punjabi)
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'pun' LIMIT 1;
    ELSIF input_text ~ '[\u0B00-\u0B7F]' THEN
        -- Oriya script
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'ori' LIMIT 1;
    ELSIF input_text ~ '[\u0C00-\u0C7F]' THEN
        -- Telugu script
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'tel' LIMIT 1;
    ELSIF input_text ~ '[\u0C80-\u0CFF]' THEN
        -- Kannada script
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'kan' LIMIT 1;
    ELSIF input_text ~ '[\u0D00-\u0D7F]' THEN
        -- Malayalam script
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'mal' LIMIT 1;
    ELSIF input_text ~ '[\u0A80-\u0AFF]' THEN
        -- Gujarati script
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'guj' LIMIT 1;
    ELSIF input_text ~ '[\u0B80-\u0BFF]' THEN
        -- Tamil script
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'tam' LIMIT 1;
    ELSE
        -- Default to English
        SELECT id INTO detected_id FROM languages WHERE iso_code = 'en' LIMIT 1;
    END IF;
    
    RETURN COALESCE(detected_id, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get translation from memory or return null
CREATE OR REPLACE FUNCTION get_translation_from_memory(
    source_text TEXT,
    source_lang_id INTEGER,
    target_lang_id INTEGER,
    domain VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    memory_id UUID;
BEGIN
    SELECT id INTO memory_id 
    FROM translation_memory 
    WHERE source_text = source_text 
    AND source_language_id = source_lang_id 
    AND target_language_id = target_lang_id 
    AND (domain IS NULL OR translation_memory.domain = domain)
    ORDER BY confidence_score DESC, usage_count DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Update usage count
        UPDATE translation_memory 
        SET usage_count = usage_count + 1, 
            last_used_at = CURRENT_TIMESTAMP 
        WHERE id = memory_id;
    END IF;
    
    RETURN memory_id;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_translation_memory_updated_at ON translation_memory;
CREATE TRIGGER update_translation_memory_updated_at BEFORE UPDATE ON translation_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_translations_updated_at ON content_translations;
CREATE TRIGGER update_content_translations_updated_at BEFORE UPDATE ON content_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_language_preferences_updated_at ON user_language_preferences;
CREATE TRIGGER update_user_language_preferences_updated_at BEFORE UPDATE ON user_language_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CAP-084: VOICE PRONUNCIATION
-- Phonetic guidance + TTS hints for agricultural terms across supported
-- languages. Added 2026-08-03: this was the one capability from the original
-- EVGA Phase 13 list (CAP-076..CAP-288) genuinely absent from the codebase.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pronunciation_guides (
    id SERIAL PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    language_code VARCHAR(10) NOT NULL REFERENCES languages(iso_code) ON DELETE CASCADE,
    ipa VARCHAR(255),                       -- International Phonetic Alphabet
    phonetic_spelling VARCHAR(255),         -- human-readable, e.g. "hal-DEE"
    syllables VARCHAR(255),                 -- e.g. "hal|dee"
    audio_url TEXT,                         -- pre-recorded clip, if available
    tts_hint TEXT,                          -- SSML or engine hint for synthesis
    domain VARCHAR(50) DEFAULT 'agriculture',
    region VARCHAR(100),                    -- regional variant, if any
    is_verified BOOLEAN DEFAULT FALSE,      -- reviewed by a native speaker
    verified_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (term, language_code, region)
);

CREATE INDEX IF NOT EXISTS idx_pronunciation_term
    ON pronunciation_guides (LOWER(term));
CREATE INDEX IF NOT EXISTS idx_pronunciation_lang
    ON pronunciation_guides (language_code);
