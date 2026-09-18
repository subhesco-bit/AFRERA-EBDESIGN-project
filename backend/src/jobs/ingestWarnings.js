#!/usr/bin/env node
/**
 * Pull the national and international warning and prediction feeds.
 *
 * Usage:
 *   node src/jobs/ingestWarnings.js                      # every provider
 *   node src/jobs/ingestWarnings.js --only ndma_sachet   # one, or a comma list
 *   node src/jobs/ingestWarnings.js --dry-run            # fetch and report, write nothing
 *   node src/jobs/ingestWarnings.js --days 365           # ERA5 backfill window
 *   node src/jobs/ingestWarnings.js --health             # what has run, and how stale
 *
 * Cadence, if scheduled: alerts every 30-60 minutes (Sachet windows are often
 * only three hours long, so a daily pull would deliver most of them expired);
 * forecasts once a day; the ERA5 backfill once, then weekly to close the
 * five-day reanalysis lag.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);

(async () => {
  const db = require('../database/connection');
  if (db.initialize) await db.initialize();

  const sources = require('../services/agriculture/warningSources');

  if (flag('health')) {
    const h = await sources.health();
    console.log('\n  FEED HEALTH\n');
    for (const p of h.providers) {
      console.log(`  ${String(p.provider).padEnd(14)} ${String(p.scope || '').padEnd(14)} `
        + `${String(p.outcome).padEnd(12)} ${p.minutes_since_run != null ? `${p.minutes_since_run}m ago` : ''}`
        + `${p.last_error ? `  — ${p.last_error}` : ''}`);
    }
    if (h.warning) console.log(`\n  ${h.warning}`);
    console.log('');
    process.exit(0);
  }

  const opts = { dryRun: flag('dry-run'), only: val('only', null) };
  if (val('days', null)) opts.days = Number(val('days'));

  const t0 = Date.now();
  const r = await sources.ingestAll(opts);

  console.log(`\n  ${opts.dryRun ? 'DRY RUN — nothing written' : 'INGEST'}   ${Math.round((Date.now() - t0) / 1000)}s\n`);
  for (const p of r.results) {
    const line = `  ${p.provider.padEnd(14)} ${p.scope.padEnd(14)} ${p.kind.padEnd(12)} ${String(p.outcome).padEnd(12)}`;
    if (p.outcome === 'unavailable' || p.outcome === 'failed') {
      console.log(`${line} ${p.reason || p.error}`);
    } else {
      console.log(`${line} seen ${p.seen ?? 0}, written ${p.written ?? 0}, skipped ${p.skipped ?? 0}`
        + `${p.unmapped && Object.keys(p.unmapped).length ? `  unmapped: ${JSON.stringify(p.unmapped)}` : ''}`
        + `${p.note ? `  — ${p.note}` : ''}`);
    }
  }
  console.log(`\n  total written: ${r.written}\n`);
  process.exit(0);
})().catch((e) => { console.error(`ingest failed: ${e.message}`); process.exit(1); });
