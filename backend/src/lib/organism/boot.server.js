'use strict';
/** Real Postgres persistence for the organism, adapted from pine-shadow
 * src/lib/organism/boot.server.ts (which used PGLite tables of the same
 * names: ai_pulses, organism_state, spine_events). This project uses
 * PostgreSQL via backend/src/database/connection.js (a `pg` Pool), not
 * PGLite, so table DDL and queries are rewritten for that driver rather
 * than copied verbatim — the table shapes and column names match
 * pine-shadow's originals exactly so the JS-level snapshot shape in
 * fns.js stays a faithful port. */

const { getPostgreSQL } = require('../../database/connection');

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const pool = getPostgreSQL();
  if (!pool) throw new Error('PostgreSQL pool not initialized — call database initialize() first.');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS organism_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      booted_at TIMESTAMPTZ,
      last_pulse_at TIMESTAMPTZ,
      last_error TEXT,
      CONSTRAINT organism_state_singleton CHECK (id = 1)
    );
    CREATE TABLE IF NOT EXISTS ai_pulses (
      id SERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      query TEXT NOT NULL,
      reading TEXT NOT NULL,
      card_ids JSONB NOT NULL DEFAULT '[]',
      organ_id TEXT,
      source TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS spine_events (
      id SERIAL PRIMARY KEY,
      signal TEXT NOT NULL,
      organ_id TEXT,
      ligament_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    INSERT INTO organism_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
  `);
  schemaReady = true;
}

async function readOrganismState() {
  await ensureSchema();
  const pool = getPostgreSQL();
  const { rows } = await pool.query('SELECT booted_at, last_pulse_at, last_error FROM organism_state WHERE id = 1');
  return rows[0] ?? { booted_at: null, last_pulse_at: null, last_error: null };
}

async function markBooted() {
  await ensureSchema();
  const pool = getPostgreSQL();
  await pool.query('UPDATE organism_state SET booted_at = COALESCE(booted_at, now()), last_error = NULL WHERE id = 1');
}

async function markBootError(message) {
  await ensureSchema();
  const pool = getPostgreSQL();
  await pool.query('UPDATE organism_state SET last_error = $1 WHERE id = 1', [message]);
}

async function publishEvent(signal, organId, ligamentId, payload = {}) {
  await ensureSchema();
  const pool = getPostgreSQL();
  await pool.query(
    'INSERT INTO spine_events (signal, organ_id, ligament_id, payload) VALUES ($1,$2,$3,$4::jsonb)',
    [signal, organId ?? null, ligamentId ?? null, JSON.stringify(payload)],
  );
  const { rows } = await pool.query('SELECT id, signal, organ_id AS "organId", ligament_id AS "ligamentId", created_at AS "createdAt" FROM spine_events ORDER BY id DESC LIMIT 50');
  return rows;
}

async function insertPulse(kind, query, reading, cardIds, organId, source) {
  await ensureSchema();
  const pool = getPostgreSQL();
  const { rows } = await pool.query(
    `INSERT INTO ai_pulses (kind, query, reading, card_ids, organ_id, source)
     VALUES ($1,$2,$3,$4::jsonb,$5,$6) RETURNING id`,
    [kind, query, reading, JSON.stringify(cardIds), organId, source],
  );
  await pool.query('UPDATE organism_state SET last_pulse_at = now() WHERE id = 1');
  return rows[0]?.id ?? 0;
}

async function recentPulses(limit = 50) {
  await ensureSchema();
  const pool = getPostgreSQL();
  const { rows } = await pool.query(
    'SELECT id, kind, query, reading, card_ids AS "cardIds", organ_id AS "organId", source, created_at AS "createdAt" FROM ai_pulses ORDER BY id DESC LIMIT $1',
    [limit],
  );
  return rows;
}

async function recentEvents(limit = 50) {
  await ensureSchema();
  const pool = getPostgreSQL();
  const { rows } = await pool.query(
    'SELECT id, signal, organ_id AS "organId", ligament_id AS "ligamentId", created_at AS "createdAt" FROM spine_events ORDER BY id DESC LIMIT $1',
    [limit],
  );
  return rows;
}

module.exports = { ensureSchema, readOrganismState, markBooted, markBootError, publishEvent, insertPulse, recentPulses, recentEvents };
