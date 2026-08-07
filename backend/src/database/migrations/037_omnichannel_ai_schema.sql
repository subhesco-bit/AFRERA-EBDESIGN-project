-- Omnichannel AI Platform Database Schema
-- CAP-236 to CAP-246: Web AI Integration, Android AI Integration, iOS AI Integration,
-- WhatsApp AI Integration, SMS AI Integration, Telegram AI Integration, Email AI Integration,
-- Voice AI Integration, IVR AI Integration, Kiosk AI Integration, Omnichannel Orchestration

-- Enable UUID extension if needed
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.

-- ============================================================================
-- OMNICHANNEL SESSIONS (CAP-246)
-- ============================================================================

CREATE TABLE IF NOT EXISTS omnichannel_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    channel_type VARCHAR(50) NOT NULL,
    channel_identifier VARCHAR(255),
    device_info JSONB,
    session_context JSONB,
    capabilities JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_omnichannel_sessions_user ON omnichannel_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_omnichannel_sessions_channel ON omnichannel_sessions(channel_type);
CREATE INDEX IF NOT EXISTS idx_omnichannel_sessions_status ON omnichannel_sessions(status);
CREATE INDEX IF NOT EXISTS idx_omnichannel_sessions_identifier ON omnichannel_sessions(channel_identifier);

-- ============================================================================
-- OMNICHANNEL MESSAGES (CAP-246)
-- ============================================================================

CREATE TABLE IF NOT EXISTS omnichannel_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    channel_type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_session ON omnichannel_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_channel ON omnichannel_messages(channel_type);
CREATE INDEX IF NOT EXISTS idx_omnichannel_messages_created ON omnichannel_messages(created_at DESC);

-- ============================================================================
-- OMNICHANNEL CONFIG (CAP-246)
-- ============================================================================

CREATE TABLE IF NOT EXISTS omnichannel_config (
    id SERIAL PRIMARY KEY,
    channel_type VARCHAR(50) UNIQUE NOT NULL,
    capabilities JSONB,
    settings JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_omnichannel_config_type ON omnichannel_config(channel_type);

-- ============================================================================
-- WEB AI INTEGRATION (CAP-236)
-- ============================================================================

CREATE TABLE IF NOT EXISTS web_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    session_id INTEGER,
    interaction_type VARCHAR(50),
    user_agent TEXT,
    browser_info JSONB,
    screen_resolution VARCHAR(50),
    interaction_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_web_ai_user ON web_ai_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_web_ai_session ON web_ai_integration(session_id);

-- ============================================================================
-- ANDROID AI INTEGRATION (CAP-237)
-- ============================================================================

CREATE TABLE IF NOT EXISTS android_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    device_id VARCHAR(255),
    app_version VARCHAR(50),
    os_version VARCHAR(50),
    push_notification_id INTEGER,
    notification_data JSONB,
    interaction_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_android_ai_user ON android_ai_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_android_ai_device ON android_ai_integration(device_id);

-- ============================================================================
-- ANDROID PUSH NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS android_push_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSONB,
    status VARCHAR(50) DEFAULT 'queued',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_android_push_user ON android_push_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_android_push_status ON android_push_notifications(status);

-- ============================================================================
-- IOS AI INTEGRATION (CAP-238)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ios_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    device_id VARCHAR(255),
    app_version VARCHAR(50),
    os_version VARCHAR(50),
    push_notification_id INTEGER,
    notification_data JSONB,
    interaction_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ios_ai_user ON ios_ai_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_ios_ai_device ON ios_ai_integration(device_id);

-- ============================================================================
-- IOS PUSH NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ios_push_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    body TEXT,
    data JSONB,
    badge INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'queued',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ios_push_user ON ios_push_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ios_push_status ON ios_push_notifications(status);

-- ============================================================================
-- WHATSAPP AI INTEGRATION (CAP-239)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    phone_number VARCHAR(20),
    message_id VARCHAR(255),
    template_name VARCHAR(255),
    template_data JSONB,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_ai_user ON whatsapp_ai_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_ai_phone ON whatsapp_ai_integration(phone_number);

-- ============================================================================
-- WHATSAPP TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) UNIQUE NOT NULL,
    language VARCHAR(10),
    components JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON whatsapp_templates(template_name);

-- ============================================================================
-- SMS AI INTEGRATION (CAP-240)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    phone_number VARCHAR(20),
    message TEXT,
    unicode BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'queued',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_ai_user ON sms_ai_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_ai_phone ON sms_ai_integration(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_ai_status ON sms_ai_integration(status);

-- ============================================================================
-- TELEGRAM AI INTEGRATION (CAP-241)
-- ============================================================================

CREATE TABLE IF NOT EXISTS telegram_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    chat_id BIGINT,
    update_type VARCHAR(50),
    message_data JSONB,
    status VARCHAR(50) DEFAULT 'received',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_ai_user ON telegram_ai_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_ai_chat ON telegram_ai_integration(chat_id);

-- ============================================================================
-- EMAIL AI INTEGRATION (CAP-242)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    to_address TEXT,
    from_address TEXT,
    subject VARCHAR(500),
    body TEXT,
    attachments JSONB,
    is_html BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'queued',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_ai_user ON email_ai_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_email_ai_status ON email_ai_integration(status);

-- ============================================================================
-- VOICE AI INTEGRATION (CAP-243)
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_ai_integration (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    audio_file TEXT,
    language VARCHAR(10),
    transcript TEXT,
    confidence DECIMAL(5,2),
    processing_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voice_ai_user ON voice_ai_integration(user_id);

-- ============================================================================
-- IVR AI INTEGRATION (CAP-244)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ivr_ai_integration (
    id SERIAL PRIMARY KEY,
    call_id VARCHAR(255),
    phone_number VARCHAR(20),
    call_flow_id INTEGER,
    dtmf_input VARCHAR(50),
    voice_input TEXT,
    call_duration INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ivr_ai_call ON ivr_ai_integration(call_id);
CREATE INDEX IF NOT EXISTS idx_ivr_ai_phone ON ivr_ai_integration(phone_number);

-- ============================================================================
-- IVR CALL FLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ivr_call_flows (
    id SERIAL PRIMARY KEY,
    flow_name VARCHAR(255) NOT NULL,
    nodes JSONB,
    entry_point VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ivr_flows_name ON ivr_call_flows(flow_name);

-- ============================================================================
-- KIOSK AI INTEGRATION (CAP-245)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kiosk_ai_integration (
    id SERIAL PRIMARY KEY,
    kiosk_id VARCHAR(100),
    screen_id INTEGER,
    user_interaction JSONB,
    session_duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_ai_kiosk ON kiosk_ai_integration(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_ai_screen ON kiosk_ai_integration(screen_id);

-- ============================================================================
-- KIOSK SCREENS
-- ============================================================================

CREATE TABLE IF NOT EXISTS kiosk_screens (
    id SERIAL PRIMARY KEY,
    kiosk_id VARCHAR(100) NOT NULL,
    screen_name VARCHAR(255) NOT NULL,
    content JSONB,
    navigation JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kiosk_screens_kiosk ON kiosk_screens(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_screens_name ON kiosk_screens(screen_name);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS update_omnichannel_sessions_updated_at ON omnichannel_sessions;
CREATE TRIGGER update_omnichannel_sessions_updated_at BEFORE UPDATE ON omnichannel_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_omnichannel_config_updated_at ON omnichannel_config;
CREATE TRIGGER update_omnichannel_config_updated_at BEFORE UPDATE ON omnichannel_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ivr_call_flows_updated_at ON ivr_call_flows;
CREATE TRIGGER update_ivr_call_flows_updated_at BEFORE UPDATE ON ivr_call_flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kiosk_screens_updated_at ON kiosk_screens;
CREATE TRIGGER update_kiosk_screens_updated_at BEFORE UPDATE ON kiosk_screens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
