#!/usr/bin/env node
/**
 * Load daily mandi prices from the Government of India open data platform.
 *
 * SOURCE
 *   Ministry of Agriculture & Farmers Welfare
 *   "Current Daily Price of Various Commodities from Various Markets (Mandi)"
 *   https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
 *
 * This is the official Agmarknet feed, republished as an open API. It is a
 * public government dataset with a documented API — not a scrape — so
 * `collection_method` is recorded as `public_api` and no terms review is needed.
 *
 * WHAT THIS JOB LEARNED ON ITS FIRST RUN, AND WHY IT MATTERS
 *
 * The feed carried 54 records nationally that day. NOT ONE was from a North
 * East state. That is not a bug in this loader; it is the single most important
 * fact about the market this platform serves.
 *
 * A farmer in Meghalaya has no published price to check. When a trader offers
 * them Rs 25/kg, there is no public number to argue against. Every downstream
 * feature that assumes "look up the mandi rate" silently fails for exactly the
 * users the platform exists for — and it fails by returning nothing, which a
 * naive UI renders as a flat market rather than as an absence.
 *
 * So this job reports NE coverage explicitly on every run. A zero there is a
 * finding to surface, not an empty result to skip past.
 *
 * Usage:
 *   node src/jobs/loadMandiPrices.js                  # today, all states
 *   node src/jobs/loadMandiPrices.js --state Assam    # filtered
 *   node src/jobs/loadMandiPrices.js --dry-run        # fetch and report, no write
 */

'use strict';

const marketData = require('../services/legacy/marketDataService');
const { logger } = require('../utils/logger');

const RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';
// data.gov.in publishes a shared sample key for public datasets. A deployment
// should set DATA_GOV_IN_KEY to its own — the shared one is rate-limited and
// will start returning empty pages under any real load, which looks exactly
// like "no market data today".
const SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

const NE_STATES = ['Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'];

/** DD/MM/YYYY -> YYYY-MM-DD. Getting this backwards silently shifts data by months. */
function toIsoDate(ddmmyyyy) {
  const m = String(ddmmyyyy || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

async function fetchPage({ offset = 0, limit = 100, state, apiKey }) {
  const params = new URLSearchParams({
    'api-key': apiKey || process.env.DATA_GOV_IN_KEY || SAMPLE_KEY,
    format: 'json',
    limit: String(limit),
    offset: String(offset),
  });
  if (state) params.set('filters[state]', state);

  const url = `https://api.data.gov.in/resource/${RESOURCE}?${params}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`data.gov.in returned ${res.status}`);
  const body = await res.json();
  if (body.status !== 'ok') throw new Error(`Feed status: ${body.status}`);
  return body;
}

/**
 * Fetch every page for the current publication and ingest.
 *
 * Prices are per QUINTAL in this feed, and `mandi_prices` stores them per
 * quintal too — the column names carry the unit precisely so nobody divides by
 * 100 twice or not at all.
 */
async function run({ state, dryRun = false, maxPages = 30 } = {}) {
  const all = [];
  let offset = 0;
  let total = null;

  for (let page = 0; page < maxPages; page += 1) {
    const body = await fetchPage({ offset, state });
    total = body.total;
    const records = body.records || [];
    all.push(...records);
    if (records.length === 0 || all.length >= Number(total || 0)) break;
    offset += records.length;
  }

  const normalised = all.map((r) => ({
    market: r.market,
    state: r.state,
    district: r.district,
    commodity: r.commodity,
    variety: r.variety,
    grade: r.grade,
    date: toIsoDate(r.arrival_date),
    minPrice: r.min_price,
    modalPrice: r.modal_price,
    maxPrice: r.max_price,
  })).filter((r) => r.date);

  const neRecords = normalised.filter((r) => NE_STATES.includes(r.state));
  const states = [...new Set(normalised.map((r) => r.state))].sort();

  const summary = {
    fetched: all.length,
    usable: normalised.length,
    reportedTotal: total,
    states: states.length,
    neRecords: neRecords.length,
    neStatesReporting: [...new Set(neRecords.map((r) => r.state))],
    // The finding, stated on every run.
    neCoverageNote: neRecords.length === 0
      ? 'ZERO North East records in this publication. A farmer in the NE has no published '
      + 'price to check, so every feature that assumes "look up the mandi rate" returns '
      + 'nothing for them. Treat that as missing data, never as a flat market.'
      : `${neRecords.length} NE record(s) from ${[...new Set(neRecords.map((r) => r.state))].join(', ')}.`,
  };

  if (dryRun) return { ...summary, dryRun: true, sample: normalised.slice(0, 3) };

  const result = await marketData.ingestMandiPrices(normalised, 'agmarknet');
  logger.info('mandi load complete', { ...summary, inserted: result.inserted });
  return { ...summary, ...result };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const state = args.includes('--state') ? args[args.indexOf('--state') + 1] : undefined;
  run({ state, dryRun: args.includes('--dry-run') })
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error('mandi load failed:', e.message);
      process.exit(1);
    });
}

module.exports = { run, fetchPage, toIsoDate, NE_STATES };
