/**
 * External market and benefit-transfer feeds: Agmarknet, e-NAM, DBT.
 *
 * NEW SERVICE, NOT A DUPLICATE. Checked before writing: no existing service
 * touches mandi prices or DBT. `iotIntegrationService` is sensor telemetry and
 * unrelated; `demandService` READS mandi_prices but does not fetch them. This
 * is the ingestion side and it is the only one.
 *
 * WHAT THIS FILE DOES AND DOES NOT DO
 *
 * It normalises and stores. It does NOT ship live API credentials or a scraper,
 * because Agmarknet's public interface changes without notice and e-NAM
 * requires a registered integration. `fetchAgmarknet()` therefore takes an
 * already-retrieved payload and normalises it — the transport is a deployment
 * concern, the normalisation is the part with business rules in it.
 *
 * THE RULE THAT MATTERS MOST HERE
 *
 * Every row records its `source`. `price_windows` has the same column for the
 * same reason: the platform generates synthetic prices for prototypes, and a
 * synthetic price that reaches a farmer wearing an Agmarknet label is worse
 * than no price at all. They must stay distinguishable in the table, not just
 * in whoever remembers which loader wrote the row.
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

// ---------------------------------------------------------------------------
// Agmarknet / e-NAM
// ---------------------------------------------------------------------------

/**
 * Normalise and store mandi price records.
 *
 * Agmarknet publishes prices per quintal. Anyone reading `min_price_inr_per_qtl`
 * as a per-kg figure is out by 100x, so the unit lives in the column name.
 */
async function ingestMandiPrices(records, source = 'agmarknet') {
  if (!Array.isArray(records)) throw new Error('records must be an array');
  if (!['agmarknet', 'enam', 'apmc_manual', 'trader_report', 'estimated'].includes(source)) {
    throw new Error(`Unknown price source: ${source}`);
  }

  const out = { inserted: 0, skipped: 0, rejected: [] };
  for (const r of records) {
    // Reject rather than coerce. A record whose band is inverted, or whose
    // modal sits outside its own min/max, is corrupt at the source; storing it
    // "fixed" hides a broken feed that will keep sending broken rows.
    const min = num(r.minPrice ?? r.min_price);
    const max = num(r.maxPrice ?? r.max_price);
    const modal = num(r.modalPrice ?? r.modal_price);
    if (min !== null && max !== null && min > max) {
      out.rejected.push({ record: r, reason: 'min above max — inverted band' });
      continue;
    }
    if (modal !== null && min !== null && max !== null && (modal < min || modal > max)) {
      out.rejected.push({ record: r, reason: 'modal price outside its own min/max band' });
      continue;
    }
    if (!r.commodity || !(r.market ?? r.market_name) || !(r.date ?? r.price_date)) {
      out.rejected.push({ record: r, reason: 'commodity, market and date are all required' });
      continue;
    }

    try {
      const res = await pool.query(
        `INSERT INTO mandi_prices
           (market_name, state, district, commodity, variety, grade,
            min_price_inr_per_qtl, modal_price_inr_per_qtl, max_price_inr_per_qtl,
            arrivals_tonnes, price_date, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (market_name, commodity, variety, price_date) DO NOTHING
         RETURNING id`,
        [r.market ?? r.market_name, r.state ?? null, r.district ?? null,
          r.commodity, r.variety ?? null, r.grade ?? null,
          min, modal, max, num(r.arrivals ?? r.arrivals_tonnes),
          r.date ?? r.price_date, source]
      );
      if (res.rows.length) out.inserted += 1; else out.skipped += 1;
    } catch (err) {
      out.rejected.push({ record: r, reason: err.message });
    }
  }

  logger.info('marketData:ingest', {
    source, inserted: out.inserted, skipped: out.skipped, rejected: out.rejected.length,
  });
  return {
    ...out,
    note: out.rejected.length
      ? `${out.rejected.length} record(s) rejected rather than corrected. An inverted or `
      + 'out-of-band price is a broken feed, and silently repairing it hides that.'
      : null,
  };
}

function num(v) {
  if (v === null || v === undefined || v === '' || v === 'NA' || v === '-') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Price trend for a commodity, per market.
 *
 * Returns per-market series rather than a national average. Averaging thin NE
 * hill markets with Azadpur produces a number that describes neither, and it
 * is the local one a farmer sells into.
 */
async function priceTrend({ commodity, state, days = 60 }) {
  if (!commodity) throw new Error('commodity is required');
  const { rows } = await pool.query(
    `SELECT market_name, district, price_date,
            modal_price_inr_per_qtl, arrivals_tonnes, source
       FROM mandi_prices
      WHERE commodity ILIKE $1
        AND ($2::text IS NULL OR state = $2)
        AND price_date >= CURRENT_DATE - ($3 || ' days')::interval
      ORDER BY market_name, price_date`,
    [`%${commodity}%`, state ?? null, Number(days)]
  );

  const byMarket = {};
  for (const r of rows) {
    (byMarket[r.market_name] = byMarket[r.market_name] || []).push(r);
  }
  return {
    commodity,
    markets: Object.entries(byMarket).map(([market, series]) => {
      const priced = series.filter((s) => s.modal_price_inr_per_qtl !== null);
      const first = priced[0]; const last = priced[priced.length - 1];
      const changePct = first && last && Number(first.modal_price_inr_per_qtl)
        ? ((Number(last.modal_price_inr_per_qtl) - Number(first.modal_price_inr_per_qtl))
           / Number(first.modal_price_inr_per_qtl)) * 100
        : null;
      return {
        market,
        district: series[0].district,
        observations: series.length,
        latestModalPerQtl: last ? Number(last.modal_price_inr_per_qtl) : null,
        changePct: changePct === null ? null : Math.round(changePct * 100) / 100,
        sources: [...new Set(series.map((s) => s.source))],
        series,
      };
    }),
    note: rows.length === 0
      ? 'No price records. The Agmarknet/e-NAM feed has not been ingested for this '
      + 'commodity — this is missing data, not a flat market.'
      : 'Reported per market, not averaged. Thin NE hill markets and Azadpur are not '
      + 'the same market and their mean describes neither.',
  };
}

// ---------------------------------------------------------------------------
// DBT — Direct Benefit Transfer
// ---------------------------------------------------------------------------

/**
 * Reconcile a claimed benefit against what was actually credited.
 *
 * The gap is the point. DBT failures are usually silent from the farmer's side:
 * an Aadhaar-bank seeding mismatch means the money is sanctioned, recorded as
 * paid at the scheme end, and never arrives. Nobody tells them.
 */
async function reconcileDbt({ schemeCode, farmerId, claimedAmountInr, creditedAmountInr, creditedOn, failureReason }) {
  const claimed = Number(claimedAmountInr || 0);
  const credited = creditedAmountInr === null || creditedAmountInr === undefined
    ? null : Number(creditedAmountInr);
  const gap = credited === null ? null : Math.round((claimed - credited) * 100) / 100;

  let status;
  if (credited === null) status = 'pending';
  else if (Math.abs(gap) < 1) status = 'reconciled';
  else if (credited === 0) status = 'not_received';
  else status = 'short_credited';

  const guidance = {
    pending: 'Sanctioned but not yet credited. Nothing to act on until the scheme cycle closes.',
    reconciled: null,
    not_received: 'Sanctioned and nothing arrived. The usual cause is an Aadhaar-to-bank '
                + 'seeding mismatch, which the scheme records as PAID. The farmer will not '
                + 'be told — someone has to check.',
    short_credited: `Short by Rs ${gap}. Check for a deduction at the scheme end or a `
                  + 'partial-instalment release before treating this as an error.',
  }[status];

  return {
    schemeCode, farmerId,
    claimedAmountInr: claimed,
    creditedAmountInr: credited,
    gapInr: gap,
    creditedOn: creditedOn ?? null,
    status,
    failureReason: failureReason ?? null,
    guidance,
  };
}

/**
 * Farmers whose unclaimed entitlements are worth chasing.
 *
 * Reads ne_organic_enrolment and scheme_funding_map, which already exist. This
 * is a query, not a new store — the entitlement data has a home.
 */
async function unclaimedEntitlements({ state, limit = 100 } = {}) {
  try {
    const { rows } = await pool.query(
      `SELECT e.farmer_id, s.scheme_code, s.scheme_name, s.subsidy_per_ha_inr,
              e.area_enrolled_ha, e.enrolled_on, e.status
         FROM ne_organic_enrolment e
         JOIN ne_organic_schemes s ON s.id = e.scheme_id
        WHERE e.status IN ('enrolled','converting')
          AND ($1::text IS NULL OR s.applicable_states IS NULL OR $1 = ANY(s.applicable_states))
        ORDER BY (COALESCE(s.subsidy_per_ha_inr,0) * COALESCE(e.area_enrolled_ha,0)) DESC
        LIMIT $2`,
      [state ?? null, Number(limit)]
    );
    return {
      candidates: rows.map((r) => ({
        ...r,
        estimatedEntitlementInr: r.subsidy_per_ha_inr && r.area_enrolled_ha
          ? Math.round(Number(r.subsidy_per_ha_inr) * Number(r.area_enrolled_ha))
          : null,
      })),
      count: rows.length,
      caveat: 'Estimated entitlement uses the scheme rate on record, which is unverified '
            + 'against a live portal. Treat as a shortlist to check, not an amount to promise.',
    };
  } catch (err) {
    logger.warn('unclaimedEntitlements: enrolment tables unavailable', { error: err.message });
    return { candidates: [], count: 0, error: err.message };
  }
}


// ---------------------------------------------------------------------------
// COMPETITOR PRICE INTELLIGENCE  (migration 059 + the orphaned 042 table)
//
// EXTENDED HERE. This service already owns external market data (Agmarknet,
// e-NAM, DBT); competitor retail prices are the same category of thing. A
// separate scraping service would end up with its own normalisation rules and
// the two would disagree about what a price means.
//
// `price_intelligence` (migration 042) has existed since then and NOTHING has
// ever read or written it. It is activated here rather than replaced.
//
// ON COLLECTION METHOD
//
// This module normalises and stores. It does not ship a scraper. That is a
// deliberate boundary, not an omission: many retailers prohibit automated
// collection in their terms of use, the legal position varies by jurisdiction
// and by whether data sits behind a login, and a scraper embedded in a service
// file is a decision nobody remembers making. The `collection_method` column
// is required and `automated_collection` will not insert without a reviewed
// terms flag — so however prices arrive, the platform can answer where a
// number came from when a competitor's lawyer asks.
// ---------------------------------------------------------------------------

/**
 * Record an observed competitor price into price_intelligence (042).
 *
 * CORRECTED. An earlier version of this function wrote to a table called
 * competitor_price_observations and MIRRORED into price_intelligence. That was
 * two homes for one fact with nothing keeping them equal — the exact
 * duplication this codebase has been cleaning up. price_intelligence is
 * authoritative; migration 059 added the columns it genuinely lacked.
 *
 * Normalises to per-kg. Most naive price comparisons go wrong here: Rs 180 for
 * a 250g pack is Rs 720/kg, not cheaper than a Rs 400 kilo.
 */
const COLLECTION_METHODS = ['public_api', 'licensed_feed', 'partner_share',
  'manual_observation', 'published_price_list', 'automated_collection'];

async function recordCompetitorPrice(obs) {
  for (const k of ['productName', 'competitor', 'observedPriceInr', 'collectionMethod']) {
    if (obs[k] === undefined || obs[k] === null) throw new Error(`${k} is required`);
  }
  if (!COLLECTION_METHODS.includes(obs.collectionMethod)) {
    throw new Error(`Unknown collectionMethod. One of: ${COLLECTION_METHODS.join(', ')}`);
  }
  if (obs.collectionMethod === 'automated_collection' && (!obs.termsReviewed || !obs.sourceUrl)) {
    throw new Error(
      'Automated collection requires termsReviewed=true and a sourceUrl. This is not a '
      + 'legal opinion — it is a prompt to have the conversation before the platform is '
      + 'collecting at volume and nobody remembers deciding to.'
    );
  }

  const price = Number(obs.observedPriceInr);
  const packG = obs.packSizeG === undefined || obs.packSizeG === null ? null : Number(obs.packSizeG);
  // Per-kg is computed here rather than as a generated column: rows written
  // before migration 059 have no pack size, and a generated column would make
  // those permanently NULL with no way to backfill them.
  const perKg = packG && packG > 0
    ? Math.round((price / (packG / 1000)) * 100) / 100
    : ((obs.unit ?? 'kg') === 'kg' ? price : null);

  const { rows } = await pool.query(
    `INSERT INTO price_intelligence
       (product_id, product_name, source_type, source_name, listed_price, effective_price,
        pack_size_g, unit, price_per_kg_inr, match_confidence, collection_method,
        source_url, terms_reviewed, collection_note, observed_by,
        is_organic, is_gi_tagged, in_stock, valid_from)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,CURRENT_DATE)
     RETURNING *`,
    [obs.matchedProductId ?? null, obs.productName, obs.channel ?? 'online', obs.competitor,
      price, price, packG, obs.unit ?? 'kg', perKg, obs.matchConfidence ?? null,
      obs.collectionMethod, obs.sourceUrl ?? null, Boolean(obs.termsReviewed),
      obs.collectionNote ?? null, obs.observedBy ?? null,
      obs.isOrganic ?? null, obs.isGiTagged ?? null, obs.inStock ?? null]
  );
  return {
    ...rows[0],
    pricePerKgInr: perKg,
    note: packG
      ? `Rs ${price} for ${packG}g normalises to Rs ${perKg}/kg. Comparing pack prices `
      + 'directly is the most common error in retail price comparison.'
      : null,
  };
}

/**
 * Where the platform sits against observed competitors.
 *
 * Refuses to recommend on stale or thin data. A repricing decision made against
 * a number that changed three weeks ago is worse than no decision, because it
 * feels informed.
 */
async function competitivePosition({ productId, productName, ourPricePerKg }) {
  const { rows } = await pool.query(
    `SELECT * FROM v_competitive_position
      WHERE ($1::text IS NULL OR product_id::text = $1)
        AND ($2::text IS NULL OR product_name ILIKE $2)`,
    [productId ?? null, productName ? `%${productName}%` : null]
  );
  if (!rows.length) {
    return {
      observations: 0,
      recommendation: null,
      note: 'No competitor observations. This is missing data, not evidence that the '
          + 'platform is priced competitively.',
    };
  }

  const p = rows[0];
  if (p.stale) {
    return { ...p, recommendation: null,
      note: 'Latest observation is over a week old. Declining to recommend a reprice — '
          + 'acting on stale competitor data feels informed and is not.' };
  }
  if (p.mean_match_confidence !== null && Number(p.mean_match_confidence) < 0.6) {
    return { ...p, recommendation: null,
      note: `Mean product-match confidence is ${p.mean_match_confidence}. These may not be `
          + 'the same product. Fuzzy name matching across retailers is unreliable, and a '
          + 'reprice against the wrong basket is a self-inflicted margin cut.' };
  }

  const ours = Number(ourPricePerKg);
  const mean = Number(p.mean_per_kg);
  const gapPct = mean ? ((ours - mean) / mean) * 100 : null;

  return {
    ...p,
    ourPricePerKg: ours,
    gapVsMeanPct: gapPct === null ? null : Math.round(gapPct * 100) / 100,
    position: gapPct === null ? 'unknown'
      : gapPct > 15 ? 'priced well above the observed market'
        : gapPct < -15 ? 'priced well below the observed market'
          : 'within the observed market range',
    recommendation: gapPct === null ? null
      : gapPct < -15
        ? 'Priced below comparable products. Before matching the market upward, check '
        + 'whether the gap is quality or certification the competitors do not have — '
        + 'lab-certified GI produce is not the same product as a generic listing.'
        : gapPct > 15
          ? 'Priced above the observed market. That may be correct for certified GI '
          + 'produce; it is only a problem if buyers cannot see what the premium buys.'
          : 'No repricing indicated.',
    caveat: 'Competitor prices are observations of a LISTING, not of a transaction. '
          + 'Listed and realised prices diverge, especially where discounting is heavy.',
  };
}

module.exports = {
  ingestMandiPrices, priceTrend,
  // Competitor intelligence (059) + activates the orphaned 042 table.
  recordCompetitorPrice, competitivePosition,
  reconcileDbt, unclaimedEntitlements,
};
