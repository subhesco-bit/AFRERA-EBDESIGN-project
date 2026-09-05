'use strict';

const crypto = require('crypto');
const { URL } = require('url');
const pool = require('../database/pool');

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_RECORDS = 10000;

function assertSourceUrl(sourceUrl, allowedHosts) {
  const parsed = new URL(sourceUrl);
  if (parsed.protocol !== 'https:') throw new Error('Public data sources must use HTTPS');
  if (!Array.isArray(allowedHosts) || !allowedHosts.includes(parsed.hostname)) {
    throw new Error('Source host is not approved for this dataset');
  }
  return parsed;
}

function stableRecordHash(record) {
  return crypto.createHash('sha256').update(JSON.stringify(record, Object.keys(record).sort())).digest('hex');
}

function filterRecords(records, filter = {}) {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) throw new Error('filter must be an object');
  return records.filter((record) => Object.entries(filter).every(([field, expected]) => {
    const actual = record?.[field];
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if (expected.equals !== undefined && actual !== expected.equals) return false;
      if (expected.contains !== undefined && !String(actual ?? '').toLowerCase().includes(String(expected.contains).toLowerCase())) return false;
      if (expected.gte !== undefined && Number(actual) < Number(expected.gte)) return false;
      if (expected.lte !== undefined && Number(actual) > Number(expected.lte)) return false;
      return true;
    }
    return actual === expected;
  }));
}

async function readJsonResponse(response) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) throw new Error('Source response exceeds the maximum allowed size');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_RESPONSE_BYTES) throw new Error('Source response exceeds the maximum allowed size');
  const payload = JSON.parse(buffer.toString('utf8'));
  if (!Array.isArray(payload)) throw new Error('Public data source must return a JSON array');
  return payload.slice(0, MAX_RECORDS);
}

async function listSources() {
  const result = await pool.query(`SELECT id, name, publisher, dataset_key, source_url, format, license,
    refresh_interval_minutes, filter_schema, active, created_at, updated_at
    FROM public_data_sources ORDER BY name`);
  return result.rows;
}

async function registerSource(input, userId) {
  const { name, publisher, dataset_key, source_url, allowed_hosts, format = 'json', license, refresh_interval_minutes, filter_schema } = input || {};
  if (!name || !publisher || !dataset_key || !source_url) throw new Error('name, publisher, dataset_key, and source_url are required');
  assertSourceUrl(source_url, allowed_hosts);
  const result = await pool.query(`INSERT INTO public_data_sources
    (name, publisher, dataset_key, source_url, allowed_hosts, format, license, refresh_interval_minutes, filter_schema, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
  [name, publisher, dataset_key, source_url, allowed_hosts, format, license || null, refresh_interval_minutes || 1440, filter_schema || {}, userId || null]);
  return result.rows[0];
}

async function extractDataset(sourceId, filter = {}, userId) {
  const sourceResult = await pool.query('SELECT * FROM public_data_sources WHERE id = $1 AND active = true', [sourceId]);
  const source = sourceResult.rows[0];
  if (!source) throw new Error('Active public data source not found');
  const sourceUrl = assertSourceUrl(source.source_url, source.allowed_hosts).toString();
  const runResult = await pool.query(`INSERT INTO public_data_extraction_runs (source_id, requested_by, status, filter_expression)
    VALUES ($1,$2,'running',$3) RETURNING id`, [source.id, userId || null, filter]);
  const runId = runResult.rows[0].id;
  const retrievedAt = new Date();
  try {
    const response = await fetch(sourceUrl, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Source request failed with status ${response.status}`);
    const records = await readJsonResponse(response);
    const selected = filterRecords(records, filter);
    for (const record of selected) {
      await pool.query(`INSERT INTO public_data_records
        (source_id, extraction_run_id, record_hash, record, source_url, publisher, license, source_retrieved_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (source_id, record_hash) DO NOTHING`,
      [source.id, runId, stableRecordHash(record), record, source.source_url, source.publisher, source.license || null, retrievedAt]);
    }
    await pool.query(`UPDATE public_data_extraction_runs SET status='completed', http_status=$1,
      records_seen=$2, records_loaded=$3, source_retrieved_at=$4, completed_at=NOW() WHERE id=$5`,
    [response.status, records.length, selected.length, retrievedAt, runId]);
    return { run_id: runId, source_id: source.id, status: 'completed', records_seen: records.length, records_loaded: selected.length, retrieved_at: retrievedAt.toISOString() };
  } catch (error) {
    await pool.query('UPDATE public_data_extraction_runs SET status=\'failed\', error_message=$1, completed_at=NOW() WHERE id=$2', [error.message, runId]);
    throw error;
  }
}

module.exports = { assertSourceUrl, stableRecordHash, filterRecords, listSources, registerSource, extractDataset };
