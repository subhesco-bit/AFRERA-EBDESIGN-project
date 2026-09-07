/**
 * Wearable / Fitness Integration Service
 *
 * See migration 9999_zzzzzzzzzzz_wearable_integration_schema.sql for the
 * architecture note this file follows: Fitbit has a real public OAuth2 REST
 * API, so it is a genuine server-side adapter (same honest not_configured
 * discipline as aiBackboneService/productMediaAIService — no live call
 * placed unless FITBIT_CLIENT_ID/FITBIT_CLIENT_SECRET are actually set).
 * Apple HealthKit and Samsung Health have no equivalent third-party cloud
 * API; those two are handled as device_push — the mobile client (AFRERA's
 * real Capacitor Android shell) reads local health data via a native plugin
 * and calls ingestDeviceActivity() itself. This file does not, and cannot
 * honestly, pull from Apple/Samsung directly.
 */

const fetch = require('node-fetch');
const { getPostgreSQL } = require('../database/connection');
const { logger } = require('../utils/logger');

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI;
const FITBIT_AUTH_BASE = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_BASE = 'https://api.fitbit.com/1';

function fitbitConfigured() {
  return Boolean(FITBIT_CLIENT_ID && FITBIT_CLIENT_SECRET && FITBIT_REDIRECT_URI);
}

/** Real connection status per provider — never fabricates a "connected" state. */
async function getConnectionStatus(userId) {
  const pg = getPostgreSQL();
  const { rows } = await pg.query(
    `SELECT provider, sync_method, status, connected_at, last_synced_at
     FROM wearable_connections WHERE user_id = $1`,
    [userId]
  );
  const byProvider = Object.fromEntries(rows.map((r) => [r.provider, r]));
  return {
    fitbit: {
      configured: fitbitConfigured(),
      sync_method: 'server_oauth',
      connection: byProvider.fitbit || null,
    },
    apple_health: {
      configured: true, // device_push has no server credential to configure — always "available" if the mobile client implements it
      sync_method: 'device_push',
      connection: byProvider.apple_health || null,
      note: 'No cloud API exists for Apple HealthKit; data arrives only when the mobile app pushes it via /sync.',
    },
    samsung_health: {
      configured: true,
      sync_method: 'device_push',
      connection: byProvider.samsung_health || null,
      note: 'No general-purpose cloud API exists for Samsung Health; data arrives only when the mobile app pushes it via /sync.',
    },
  };
}

/** Step 1 of Fitbit OAuth2 — real authorization URL, or an honest not_configured error. */
function getFitbitAuthUrl(state) {
  if (!fitbitConfigured()) {
    const err = new Error('Fitbit is not configured (set FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, FITBIT_REDIRECT_URI)');
    err.code = 'not_configured';
    throw err;
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: FITBIT_CLIENT_ID,
    redirect_uri: FITBIT_REDIRECT_URI,
    scope: 'activity heartrate sleep profile',
    state,
  });
  return `${FITBIT_AUTH_BASE}?${params.toString()}`;
}

/** Step 2 — real token exchange with Fitbit, then persists the connection. */
async function handleFitbitCallback(userId, code) {
  if (!fitbitConfigured()) {
    const err = new Error('Fitbit is not configured');
    err.code = 'not_configured';
    throw err;
  }
  const basicAuth = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      client_id: FITBIT_CLIENT_ID,
      grant_type: 'authorization_code',
      redirect_uri: FITBIT_REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fitbit token exchange failed: ${response.status} - ${errorText}`);
  }

  const tokenData = await response.json();
  const pg = getPostgreSQL();
  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 28800) * 1000);

  await pg.query(
    `INSERT INTO wearable_connections (user_id, provider, sync_method, access_token, refresh_token, token_expires_at, status)
     VALUES ($1, 'fitbit', 'server_oauth', $2, $3, $4, 'active')
     ON CONFLICT (user_id, provider) DO UPDATE SET
       access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
       token_expires_at = EXCLUDED.token_expires_at, status = 'active', connected_at = CURRENT_TIMESTAMP`,
    [userId, tokenData.access_token, tokenData.refresh_token, expiresAt]
  );

  logger.info('Fitbit connected', { userId });
  return { provider: 'fitbit', status: 'active' };
}

/** Real pull from Fitbit's activity summary API for today, using the stored token. */
async function syncFitbitActivity(userId) {
  const pg = getPostgreSQL();
  const { rows } = await pg.query(
    `SELECT access_token FROM wearable_connections WHERE user_id = $1 AND provider = 'fitbit' AND status = 'active'`,
    [userId]
  );
  if (rows.length === 0) {
    const err = new Error('No active Fitbit connection for this user');
    err.code = 'not_connected';
    throw err;
  }

  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(`${FITBIT_API_BASE}/user/-/activities/date/${today}.json`, {
    headers: { Authorization: `Bearer ${rows[0].access_token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fitbit activity fetch failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const summary = data.summary || {};

  await pg.query(
    `INSERT INTO wearable_activity_data (user_id, provider, activity_date, steps, calories_burned, active_minutes, resting_heart_rate, raw_payload)
     VALUES ($1, 'fitbit', $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, provider, activity_date) DO UPDATE SET
       steps = EXCLUDED.steps, calories_burned = EXCLUDED.calories_burned,
       active_minutes = EXCLUDED.active_minutes, resting_heart_rate = EXCLUDED.resting_heart_rate,
       raw_payload = EXCLUDED.raw_payload, synced_at = CURRENT_TIMESTAMP`,
    [
      userId, today, summary.steps ?? null, summary.caloriesOut ?? null,
      (summary.fairlyActiveMinutes || 0) + (summary.veryActiveMinutes || 0),
      summary.restingHeartRate ?? null, JSON.stringify(data),
    ]
  );

  await pg.query(`UPDATE wearable_connections SET last_synced_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND provider = 'fitbit'`, [userId]);

  return { provider: 'fitbit', activity_date: today, steps: summary.steps ?? null, calories_burned: summary.caloriesOut ?? null };
}

/**
 * Device-push ingest for Apple Health / Samsung Health — the mobile client
 * calls this after reading local HealthKit / Samsung Health SDK data. This
 * is the only honest way this backend ever receives data from either.
 */
async function ingestDeviceActivity(userId, provider, activityDate, activity = {}) {
  if (!['apple_health', 'samsung_health'].includes(provider)) {
    throw new Error(`ingestDeviceActivity only accepts apple_health or samsung_health, got: ${provider}`);
  }
  const pg = getPostgreSQL();

  await pg.query(
    `INSERT INTO wearable_connections (user_id, provider, sync_method, status, connected_at, last_synced_at)
     VALUES ($1, $2, 'device_push', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, provider) DO UPDATE SET status = 'active', last_synced_at = CURRENT_TIMESTAMP`,
    [userId, provider]
  );

  await pg.query(
    `INSERT INTO wearable_activity_data (user_id, provider, activity_date, steps, calories_burned, active_minutes, resting_heart_rate, sleep_minutes, raw_payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, provider, activity_date) DO UPDATE SET
       steps = EXCLUDED.steps, calories_burned = EXCLUDED.calories_burned,
       active_minutes = EXCLUDED.active_minutes, resting_heart_rate = EXCLUDED.resting_heart_rate,
       sleep_minutes = EXCLUDED.sleep_minutes, raw_payload = EXCLUDED.raw_payload, synced_at = CURRENT_TIMESTAMP`,
    [
      userId, provider, activityDate,
      activity.steps ?? null, activity.caloriesBurned ?? null, activity.activeMinutes ?? null,
      activity.restingHeartRate ?? null, activity.sleepMinutes ?? null, JSON.stringify(activity),
    ]
  );

  logger.info('Device wearable activity ingested', { userId, provider, activityDate });
  return { provider, activity_date: activityDate, status: 'recorded' };
}

/**
 * Real aggregate over recorded activity — used to let nutrition
 * recommendations factor in actual recent activity level rather than a
 * static assumption. Returns null (not a fabricated default) when nothing
 * has been synced.
 */
async function getRecentActivitySummary(userId, days = 7) {
  const pg = getPostgreSQL();
  const { rows } = await pg.query(
    `SELECT AVG(steps)::int AS avg_steps, AVG(calories_burned)::numeric(8,2) AS avg_calories_burned,
            AVG(active_minutes)::int AS avg_active_minutes, COUNT(*) AS days_with_data
     FROM wearable_activity_data
     WHERE user_id = $1 AND activity_date >= CURRENT_DATE - $2::int`,
    [userId, days]
  );
  const row = rows[0];
  if (!row || Number(row.days_with_data) === 0) return null;
  return {
    window_days: days,
    days_with_data: Number(row.days_with_data),
    avg_steps: row.avg_steps,
    avg_calories_burned: row.avg_calories_burned ? Number(row.avg_calories_burned) : null,
    avg_active_minutes: row.avg_active_minutes,
  };
}

async function disconnectProvider(userId, provider) {
  const pg = getPostgreSQL();
  await pg.query(
    `UPDATE wearable_connections SET status = 'revoked' WHERE user_id = $1 AND provider = $2`,
    [userId, provider]
  );
  return { provider, status: 'revoked' };
}

module.exports = {
  getConnectionStatus,
  getFitbitAuthUrl,
  handleFitbitCallback,
  syncFitbitActivity,
  ingestDeviceActivity,
  getRecentActivitySummary,
  disconnectProvider,
};
