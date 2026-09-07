-- Wearable / Fitness Integration Schema
--
-- ARCHITECTURE NOTE (read before "fixing" this to look more symmetric):
-- Fitbit has a real, public, server-side OAuth2 REST API — a backend can poll
-- it directly once a user authorizes via FITBIT_CLIENT_ID/FITBIT_CLIENT_SECRET
-- (see wearableIntegrationService.js). Apple HealthKit and Samsung Health do
-- NOT offer an equivalent public cloud REST API for third-party backends —
-- that data lives on-device and is only reachable from a native app via the
-- HealthKit / Samsung Health SDK. AFRERA already has a real Capacitor Android
-- shell (frontend/android/, built this session), so the honest integration
-- shape for those two is: the mobile client reads local health data via a
-- native plugin and PUSHES it to POST /wearable-integration/sync — the
-- backend never claims to pull from Apple/Samsung itself. `provider` below
-- is intentionally a free enum covering all three; `sync_method` records
-- which of the two real architectures produced a given row.

CREATE TABLE IF NOT EXISTS wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL CHECK (provider IN ('fitbit', 'apple_health', 'samsung_health')),
    sync_method VARCHAR(20) NOT NULL CHECK (sync_method IN ('server_oauth', 'device_push')),
    -- Only populated for sync_method = 'server_oauth' (Fitbit today).
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_synced_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS wearable_activity_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL CHECK (provider IN ('fitbit', 'apple_health', 'samsung_health')),
    activity_date DATE NOT NULL,
    steps INTEGER,
    calories_burned NUMERIC(8,2),
    active_minutes INTEGER,
    resting_heart_rate INTEGER,
    sleep_minutes INTEGER,
    raw_payload JSONB,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, provider, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_wearable_connections_user ON wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_activity_user_date ON wearable_activity_data(user_id, activity_date DESC);
