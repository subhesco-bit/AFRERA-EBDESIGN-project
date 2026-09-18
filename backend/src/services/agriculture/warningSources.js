/**
 * Advance-warning ingestion — the national and international feeds the
 * platform's warning system was designed around.
 *
 * WHAT WAS HERE BEFORE: nothing. `climate_alerts` carried `source` and
 * `source_ref` columns and a dispatch-blocking view reading from it, and
 * `weather_forecasts` carried a `provider` column scored against observation —
 * a pipeline built to consume external feeds, with no code that fetched one.
 * Every table downstream held zero rows: 0 stations, 0 observations,
 * 0 forecasts, 0 alerts. The ARP forward-pricing engine therefore priced every
 * district off a hard-coded fallback constant.
 *
 * This module is the missing half. Each provider is an adapter that fetches,
 * normalises into the shapes `weatherService` already accepts, and records a
 * run row so the system can tell "quiet day" from "the feed has been down for
 * nine hours". That distinction is the whole point: a warning system that
 * cannot see its own silence is worse than none, because people stop watching
 * the sky themselves.
 *
 * PROVIDERS, and why each one:
 *
 *   ndma_sachet    NATIONAL. India's Common Alerting Protocol feed, operated by
 *                  the National Disaster Management Authority. This is the
 *                  authoritative civil warning source for the country and the
 *                  one a district officer acts on. Keyless and public.
 *   gdacs          INTERNATIONAL. Global Disaster Alert and Coordination System
 *                  (EC JRC / UN OCHA). Catches basin-scale floods and cyclones
 *                  earlier than a district bulletin, and keeps reporting during
 *                  an event when national infrastructure is degraded. Keyless.
 *   ecmwf_ifs      INTERNATIONAL. ECMWF's operational model via Open-Meteo.
 *                  Numerical forecast, not a warning — it is what lets
 *                  scoreForecasts() build a provider track record, which is
 *                  what the calibration gates upstream need. Keyless.
 *   era5_archive   INTERNATIONAL. ERA5 reanalysis, also via Open-Meteo. This is
 *                  the one that actually unblocks ARP: it backfills the
 *                  observed rainfall and heat-stress history weatherForArp()
 *                  looks for and never found.
 *   openweather    INTERNATIONAL, keyed. Registered but reports `unavailable`
 *                  until OPENWEATHER_API_KEY is set. It does not pretend.
 *   imd_mausam     NATIONAL, keyed. The IMD's own feed. Its public endpoints
 *                  are undocumented and change without notice, so this adapter
 *                  refuses to guess a URL: it stays `unavailable` until
 *                  IMD_MAUSAM_ENDPOINT names one. Fabricating an endpoint here
 *                  would produce a provider that silently returns nothing,
 *                  which reads identically to a calm week.
 *
 * A provider that cannot run says so. It never returns an empty result that
 * could be mistaken for good news.
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const weather = require('./weatherService');

const HTTP_TIMEOUT_MS = Number(process.env.WARNING_FETCH_TIMEOUT_MS || 30000);

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

async function getJson(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${new URL(url).host} returned ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sachet stamps times as "Sun Sep 13 19:48:00 IST 2026". Date.parse does not
 * understand the IST abbreviation on every platform, so pin the offset rather
 * than letting the runtime guess — an alert window silently shifted by five
 * and a half hours would expire before anyone saw it.
 */
function parseIstStamp(s) {
  if (!s) return null;
  const m = String(s).match(/^\w{3} (\w{3}) (\d{1,2}) (\d{2}):(\d{2}):(\d{2}) IST (\d{4})$/);
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const utcMs = Date.UTC(Number(m[6]), months[m[1]], Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
  return new Date(utcMs - (5.5 * 3600 * 1000)); // IST is UTC+5:30
}

async function alertExists(alertCode) {
  const { rows } = await pool.query('SELECT 1 FROM climate_alerts WHERE alert_code = $1 LIMIT 1', [alertCode]);
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// hazard vocabulary
// ---------------------------------------------------------------------------

/**
 * Map a free-text hazard description onto the alert_type vocabulary.
 *
 * Ordered, most specific first. Returns null rather than a fallback when
 * nothing matches: an unmapped hazard is recorded in the run's `unmapped`
 * column so the vocabulary can be extended deliberately. Guessing a type here
 * would attach the wrong recommended action to a real hazard.
 */
const HAZARD_PATTERNS = [
  ['cyclone', /cyclon|depression|typhoon|hurricane/i],
  ['tsunami', /tsunami/i],
  ['earthquake', /earthquake|seismic/i],
  ['volcano', /volcan/i],
  ['wildfire', /wildfire|forest fire/i],
  ['landslide', /landslide|landslip|mudslide/i],
  ['flood', /flood|inundat|water ?logging/i],
  ['hailstorm', /hail/i],
  ['heat_wave', /heat ?wave/i],
  ['cold_wave', /cold ?wave|cold ?day/i],
  ['frost', /frost/i],
  ['dust_storm', /dust ?storm|duststorm/i],
  ['fog', /\bfog\b|mist/i],
  // Rain before thunderstorm: "Heavy Rain with thunderstorm" is a rain event
  // whose action is about drainage and harvest timing, not shelter.
  ['heavy_rain', /(very heavy|extremely heavy|heavy|moderate) rain|rainfall|thunder ?shower/i],
  ['lightning', /lightning/i],
  ['thunderstorm', /thunder/i],
  ['high_wind', /gusty|squall|surface wind|high wind|strong wind/i],
];

function classifyHazard(text) {
  const found = HAZARD_PATTERNS.find(([, re]) => re.test(String(text || '')));
  return found ? found[0] : null;
}

/**
 * What should someone actually DO. raiseAlert() rejects an alert without this,
 * on the reasoning that an actionless alert trains people to ignore the next
 * one — so these are written per hazard and per severity, not templated.
 */
const ACTIONS = {
  heavy_rain: 'Clear field drainage channels and check bund overflow. Delay harvest and any open-air drying; move already-harvested produce onto raised platforms under cover. Do not apply fertiliser or spray — it will wash off and reach the water.',
  flood: 'Move livestock, stored grain and inputs to higher ground now. Do not attempt to cross flowing water on foot or by vehicle. Record standing water depth and duration with photographs — insurance and relief claims will need it.',
  landslide: 'Avoid cut slopes, hillside roads and terrace edges. Do not shelter below a slope showing fresh cracks, tilting trees or seeping water. Suspend all hill-road transport until the alert lifts.',
  thunderstorm: 'Stop field work and move indoors or into a solid building. Do not shelter under trees, on tractors, or beside metal fencing. Secure polyhouse sheeting and loose covers before the wind arrives.',
  lightning: 'Go indoors immediately and stay away from trees, open fields, water bodies and metal implements. Wait 30 minutes after the last thunder before returning to work.',
  high_wind: 'Stake and tie standing crops where possible. Secure polyhouse and shade-net sheeting, empty crates and loose roofing. Move vehicles out from under trees.',
  hailstorm: 'Cover nurseries, seedbeds and high-value horticulture with netting if it can be done safely before onset. Move livestock under shelter. Photograph damage immediately afterwards for claims.',
  cyclone: 'Follow district evacuation instructions without waiting for confirmation. Harvest anything mature enough now. Secure or move livestock, stored produce and machinery. Suspend all dispatch.',
  heat_wave: 'Irrigate in the early morning or after sunset only. Provide shade and continuous water for livestock. Stop field labour between 11:00 and 16:00. Check cold-storage load and backup power.',
  cold_wave: 'Irrigate before the coldest night — wet soil holds heat. Cover nurseries and young horticulture. Shelter livestock and check that young animals are dry.',
  frost: 'Irrigate the evening before, and cover nurseries and seedbeds. Light smoke fires on the upwind edge of orchards where locally permitted.',
  drought: 'Switch to alternate-furrow or deficit irrigation and prioritise the crop closest to a critical growth stage. Mulch exposed soil. Talk to the extension officer about a contingency short-duration variety before the window closes.',
  dust_storm: 'Move indoors and cover water sources and stored feed. Shelter livestock. Secure loose sheeting and delay spraying.',
  fog: 'Delay road dispatch until visibility clears. Watch for downy mildew and blight in dense-canopy crops in the days after.',
  earthquake: 'Check stored-produce stacks, cold-storage racking and any masonry for cracks before re-entering. Do not run generators or gas in a structure you have not inspected.',
  wildfire: 'Clear a firebreak around stores and homesteads. Move livestock away from the fire front, not ahead of it. Follow forest-department instructions.',
  volcano: 'Follow national civil-protection instructions. Cover water sources and protect livestock from ashfall.',
  tsunami: 'Move inland and to high ground immediately. Do not wait for a second confirmation and do not return for property.',
  pest_outbreak: 'Scout the field and confirm the pest before spraying. Contact the KVK or extension officer for the approved control and dose for this crop and stage.',
};

// ---------------------------------------------------------------------------
// area parsing
// ---------------------------------------------------------------------------

const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Andaman and Nicobar Islands', 'Lakshadweep',
  'Dadra and Nagar Haveli and Daman and Diu'];

/**
 * Sachet's area_description comes in three shapes, and the first version of
 * this parser handled only one of them. The other two produced real damage in
 * the first live run, so all three are handled explicitly:
 *
 *   "Kamrup, Nalbari districts of Assam"     -> district list, state named
 *   "8 districts of Mizoram"                 -> a COUNT, not a name. The naive
 *                                               parser recorded a district
 *                                               literally called "8".
 *   "Beki, Beki NH Crossing, Barpeta, Assam" -> the flood-warning shape:
 *                                               river, gauge station, district,
 *                                               state. The naive parser stored
 *                                               the whole sentence as one
 *                                               district name, so no dispatch
 *                                               check or district lookup could
 *                                               ever match it.
 *
 * That last one matters most: Assam's river-gauge flood warnings are the most
 * operationally useful alerts in the whole feed, and they were the ones being
 * mangled.
 */
function parseSachetArea(areaDescription) {
  const raw = String(areaDescription || '').trim();
  if (!raw) return { state: null, districts: [] };

  const m = raw.match(/^(.*?)\s+districts?\s+of\s+(.+)$/i);
  if (m) {
    const state = m[2].trim();
    // "8 districts of Mizoram" names a count, not a district. Record it as a
    // state-wide alert rather than inventing a district called "8".
    if (/^\d+$/.test(m[1].trim())) return { state, districts: [] };
    const districts = m[1].split(',').map((d) => d.trim()).filter(Boolean);
    return { state, districts: districts.length ? districts : [] };
  }

  // Trailing-state form. Match the longest state name first so "Dadra and
  // Nagar Haveli and Daman and Diu" is not clipped to something shorter.
  const parts = raw.split(',').map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const state = INDIAN_STATES.find((st) => st.toLowerCase() === last.toLowerCase());
    if (state) {
      // Second-to-last is the district in the river-gauge shape; anything
      // before it is river and gauge-station name, which belongs in the detail
      // text, not in the district array.
      return { state, districts: [parts[parts.length - 2]] };
    }
  }
  return { state: null, districts: [raw] };
}

// ---------------------------------------------------------------------------
// severity
// ---------------------------------------------------------------------------

/**
 * India's warning colour code is the reliable signal in the Sachet payload:
 * yellow = be aware, orange = be prepared, red = take action. The `severity`
 * word field is inconsistent across state agencies (it carries ALERT, WARNING,
 * WATCH, Yellow and Orange in the same feed), so colour leads and the word
 * only fills gaps.
 */
function sachetSeverity(alert) {
  const colour = String(alert.severity_color || '').toLowerCase();
  if (colour === 'red') return 'severe';
  if (colour === 'orange') return 'warning';
  if (colour === 'yellow') return 'watch';
  const word = String(alert.severity || '').toLowerCase();
  if (word === 'warning') return 'warning';
  if (word === 'watch') return 'watch';
  if (word === 'alert') return 'warning';
  return 'advisory';
}

/**
 * Does this stop a consignment? Only hazards that make a road or a loading
 * yard genuinely unsafe, and only at real severity. Blocking dispatch on a
 * yellow thunderstorm watch would have the platform crying wolf at the
 * logistics layer within a week, and the block would then be routed around
 * out of habit on the day it mattered.
 */
function blocksDispatch(alertType, severity) {
  const grave = severity === 'severe' || severity === 'extreme';
  const roadHazard = ['flood', 'landslide', 'cyclone', 'tsunami'].includes(alertType);
  if (roadHazard && (grave || severity === 'warning')) return true;
  return grave && ['heavy_rain', 'high_wind', 'dust_storm', 'wildfire'].includes(alertType);
}

// ---------------------------------------------------------------------------
// run bookkeeping
// ---------------------------------------------------------------------------

async function startRun(provider, scope, kind) {
  const { rows } = await pool.query(
    `INSERT INTO warning_source_runs (provider, scope, kind) VALUES ($1,$2,$3) RETURNING id`,
    [provider, scope, kind]
  );
  return rows[0].id;
}

async function finishRun(id, { outcome, seen = 0, written = 0, skipped = 0, unmapped = null, error = null }) {
  await pool.query(
    `UPDATE warning_source_runs
        SET finished_at = CURRENT_TIMESTAMP, outcome = $2, records_seen = $3,
            records_written = $4, records_skipped = $5, unmapped = $6, error = $7
      WHERE id = $1`,
    [id, outcome, seen, written, skipped, unmapped ? JSON.stringify(unmapped) : null, error]
  );
}

// ---------------------------------------------------------------------------
// providers
// ---------------------------------------------------------------------------

const SACHET_URL = process.env.NDMA_SACHET_URL
  || 'https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails';

/**
 * NDMA Sachet — India's national CAP feed.
 *
 * Filtered to the states the platform serves unless WARNING_ALL_INDIA is set.
 * The feed is national and runs to dozens of live alerts at any hour; ingesting
 * Gujarat thunderstorms into a Northeast platform would bury the ones that
 * matter to its users.
 */
async function fetchSachet({ states, dryRun }) {
  const payload = await getJson(SACHET_URL);
  const list = Array.isArray(payload) ? payload : [];
  const unmapped = new Map();
  let written = 0;
  let skipped = 0;

  for (const a of list) {
    const { state, districts } = parseSachetArea(a.area_description);
    if (states && states.length) {
      const inScope = states.some((s) => new RegExp(s, 'i').test(`${state || ''} ${a.area_description || ''}`));
      if (!inScope) { skipped += 1; continue; }
    }

    const hazardText = `${a.disaster_type || ''} ${a.warning_message || ''}`;
    const alertType = classifyHazard(hazardText);
    if (!alertType) {
      unmapped.set(a.disaster_type || 'unknown', (unmapped.get(a.disaster_type || 'unknown') || 0) + 1);
      skipped += 1;
      continue;
    }

    const alertCode = `NDMA-SACHET-${a.identifier}`;
    if (await alertExists(alertCode)) { skipped += 1; continue; }

    const from = parseIstStamp(a.effective_start_time);
    const until = parseIstStamp(a.effective_end_time);
    if (!from || !until || until < from) { skipped += 1; continue; }

    const severity = sachetSeverity(a);
    if (dryRun) { written += 1; continue; }

    await weather.raiseAlert({
      alertCode,
      alertType,
      severity,
      state,
      districts,
      headline: `${a.disaster_type || alertType} — ${a.area_description || 'India'}`.slice(0, 255),
      detail: a.warning_message || null,
      recommendedAction: ACTIONS[alertType],
      effectiveFrom: from.toISOString(),
      effectiveUntil: until.toISOString(),
      source: 'ndma_sachet',
      sourceRef: String(a.identifier),
      blocksDispatch: blocksDispatch(alertType, severity),
    });
    written += 1;
  }

  return { seen: list.length, written, skipped, unmapped: Object.fromEntries(unmapped) };
}

const GDACS_URL = process.env.GDACS_URL
  || 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?country=India';

/** GDACS event-type codes. Anything not here is reported unmapped, not guessed. */
const GDACS_TYPES = { FL: 'flood', TC: 'cyclone', EQ: 'earthquake', DR: 'drought', WF: 'wildfire', VO: 'volcano', TS: 'tsunami' };
const GDACS_LEVELS = { Green: 'advisory', Orange: 'warning', Red: 'severe' };

/**
 * GDACS — international. Its events are basin- or country-scale and run for
 * weeks, so they arrive as a standing advisory over the whole served region
 * rather than a district alert. Green events are skipped: GDACS emits them
 * constantly and they carry no action.
 */
async function fetchGdacs({ states, dryRun }) {
  const payload = await getJson(GDACS_URL);
  const features = (payload && payload.features) || [];
  const unmapped = new Map();
  let written = 0;
  let skipped = 0;

  for (const f of features) {
    const p = f.properties || {};
    const alertType = GDACS_TYPES[p.eventtype] || classifyHazard(p.name || p.description);
    if (!alertType) {
      unmapped.set(p.eventtype || 'unknown', (unmapped.get(p.eventtype || 'unknown') || 0) + 1);
      skipped += 1;
      continue;
    }

    const severity = GDACS_LEVELS[p.alertlevel] || 'advisory';
    if (severity === 'advisory') { skipped += 1; continue; }

    // GDACS serves its archive from the same endpoint. The first live run
    // ingested five events from 2025 as though they were current. Only events
    // whose window has not closed are warnings; the rest are history.
    if (p.todate && new Date(p.todate) < new Date()) { skipped += 1; continue; }

    const alertCode = `GDACS-${p.eventtype}-${p.eventid}-${p.episodeid || 0}`;
    if (await alertExists(alertCode)) { skipped += 1; continue; }

    const from = p.fromdate ? new Date(p.fromdate) : null;
    let until = p.todate ? new Date(p.todate) : null;
    if (!from || !until || until < from) { skipped += 1; continue; }
    // An earthquake has one instant, not a window, and GDACS reports fromdate
    // == todate for it. Stored as-is the alert is expired the moment it is
    // written and nobody ever sees it. Give instantaneous events a day, which
    // is roughly how long the aftermath actually matters for.
    if (until.getTime() === from.getTime()) until = new Date(from.getTime() + 86400000);

    if (dryRun) { written += 1; continue; }

    await weather.raiseAlert({
      alertCode,
      alertType,
      severity,
      state: null,
      districts: states && states.length ? states : [],
      headline: `${p.name || p.eventname || alertType} (GDACS ${p.alertlevel})`.slice(0, 255),
      detail: `${p.description || ''}\nSource: GDACS event ${p.eventid}. ${p.url && p.url.report ? p.url.report : ''}`.trim(),
      recommendedAction: ACTIONS[alertType],
      effectiveFrom: from.toISOString(),
      effectiveUntil: until.toISOString(),
      source: 'gdacs',
      sourceRef: String(p.eventid),
      // Deliberately never blocks dispatch. GDACS events are country- or
      // basin-scale and run for weeks: the first live run produced a 55-day
      // "Flood in India" that would have blocked every consignment across all
      // eight states for two months. A block nobody can comply with gets
      // routed around out of habit, and is then ignored on the day a district
      // alert genuinely means it. GDACS is early situational awareness; the
      // district-scoped national feed is what stops a truck.
      blocksDispatch: false,
    });
    written += 1;
  }

  return { seen: features.length, written, skipped, unmapped: Object.fromEntries(unmapped) };
}

async function activeGridStations(states) {
  const params = [];
  let where = 'active = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL';
  if (states && states.length) { params.push(states); where += ' AND state = ANY($1::text[])'; }
  const { rows } = await pool.query(
    `SELECT id, station_code, state, district, latitude, longitude FROM weather_stations WHERE ${where}`, params
  );
  return rows;
}

/**
 * ECMWF IFS via Open-Meteo — numerical forecast per grid point.
 *
 * Recorded with provider 'ecmwf' so scoreForecasts() can build a track record
 * against what was actually observed. Until that record exists,
 * forecastAccuracy() correctly reports the provider as unknown rather than
 * good, and the calibration gates upstream treat it accordingly.
 */
async function fetchEcmwf({ states, dryRun, days = 7 }) {
  const stations = await activeGridStations(states);
  if (!stations.length) {
    return { seen: 0, written: 0, skipped: 0, note: 'no active grid stations — run the station seed migration' };
  }
  let seen = 0;
  let written = 0;
  let skipped = 0;

  for (const s of stations) {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + `?latitude=${s.latitude}&longitude=${s.longitude}`
      + '&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min'
      + `&forecast_days=${Math.min(Number(days) || 7, 16)}&timezone=Asia%2FKolkata&models=ecmwf_ifs025`;
    let d;
    try { d = (await getJson(url)).daily; } catch (e) { skipped += 1; logger.warn(`ecmwf ${s.station_code}: ${e.message}`); continue; }
    if (!d || !d.time) { skipped += 1; continue; }

    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < d.time.length; i += 1) {
      seen += 1;
      const validFor = d.time[i];
      const horizon = Math.round((new Date(validFor) - new Date(today)) / 86400000);
      if (horizon < 0) { skipped += 1; continue; }
      if (dryRun) { written += 1; continue; }
      await weather.recordForecast({
        stationId: s.id,
        district: s.district,
        state: s.state,
        validFor,
        horizonDays: horizon,
        rainfallMm: d.precipitation_sum ? d.precipitation_sum[i] : null,
        rainfallProbabilityPct: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null,
        tempMaxC: d.temperature_2m_max ? d.temperature_2m_max[i] : null,
        tempMinC: d.temperature_2m_min ? d.temperature_2m_min[i] : null,
        conditions: null,
        provider: 'ecmwf',
        // Deliberately null. Open-Meteo publishes no confidence figure for a
        // deterministic IFS run, and inventing one would put a number the
        // gates read on a value nobody computed.
        statedConfidencePct: null,
      });
      written += 1;
    }
  }
  return { seen, written, skipped, stations: stations.length };
}

/**
 * ERA5 reanalysis via Open-Meteo — the observation backfill.
 *
 * This is the one that unblocks forward pricing. weatherForArp() looks back
 * 120 days for rainfall, mean temperature and heat-stress days; with no
 * observations it falls back to a constant and reports the price uncalibrated.
 * ERA5 is reanalysis, not instrument data, so source is recorded as 'era5' and
 * quality_flag as 'reanalysis' — a district reading its own history should be
 * able to see that no gauge stood in that field.
 *
 * ERA5 lags roughly five days behind real time; the window ends there rather
 * than today so the tail is not silently empty.
 */
async function fetchEra5({ states, dryRun, days = 180 }) {
  const stations = await activeGridStations(states);
  if (!stations.length) {
    return { seen: 0, written: 0, skipped: 0, note: 'no active grid stations — run the station seed migration' };
  }
  const end = new Date(Date.now() - (5 * 86400000));
  const start = new Date(end.getTime() - (Number(days) * 86400000));
  const iso = (d) => d.toISOString().slice(0, 10);
  let seen = 0;
  let written = 0;
  let skipped = 0;

  for (const s of stations) {
    const url = 'https://archive-api.open-meteo.com/v1/archive'
      + `?latitude=${s.latitude}&longitude=${s.longitude}`
      + `&start_date=${iso(start)}&end_date=${iso(end)}`
      + '&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,temperature_2m_mean'
      + '&timezone=Asia%2FKolkata';
    let d;
    try { d = (await getJson(url)).daily; } catch (e) { skipped += 1; logger.warn(`era5 ${s.station_code}: ${e.message}`); continue; }
    if (!d || !d.time) { skipped += 1; continue; }

    for (let i = 0; i < d.time.length; i += 1) {
      seen += 1;
      if (dryRun) { written += 1; continue; }
      try {
        await weather.recordObservation({
          stationId: s.id,
          observedOn: d.time[i],
          rainfallMm: d.precipitation_sum ? d.precipitation_sum[i] : null,
          tempMaxC: d.temperature_2m_max ? d.temperature_2m_max[i] : null,
          tempMinC: d.temperature_2m_min ? d.temperature_2m_min[i] : null,
          tempMeanC: d.temperature_2m_mean ? d.temperature_2m_mean[i] : null,
          source: 'era5',
          qualityFlag: 'reanalysis',
        });
        written += 1;
      } catch (e) {
        // Duplicate (station, date) on a re-run is expected and not a failure.
        if (/duplicate key/i.test(e.message)) skipped += 1;
        else throw e;
      }
    }
  }
  return { seen, written, skipped, stations: stations.length };
}

// ---------------------------------------------------------------------------
// registry
// ---------------------------------------------------------------------------

const PROVIDERS = {
  ndma_sachet: {
    scope: 'national',
    kind: 'alert',
    label: 'NDMA Sachet (National Disaster Management Authority, CAP feed)',
    available: () => ({ ok: true }),
    run: fetchSachet,
  },
  gdacs: {
    scope: 'international',
    kind: 'alert',
    label: 'GDACS (EC JRC / UN OCHA global disaster alerts)',
    available: () => ({ ok: true }),
    run: fetchGdacs,
  },
  ecmwf_ifs: {
    scope: 'international',
    kind: 'forecast',
    label: 'ECMWF IFS via Open-Meteo',
    available: () => ({ ok: true }),
    run: fetchEcmwf,
  },
  era5_archive: {
    scope: 'international',
    kind: 'observation',
    label: 'ERA5 reanalysis via Open-Meteo',
    available: () => ({ ok: true }),
    run: fetchEra5,
  },
  openweather: {
    scope: 'international',
    kind: 'forecast',
    label: 'OpenWeather',
    available: () => (process.env.OPENWEATHER_API_KEY
      ? { ok: true }
      : { ok: false, reason: 'OPENWEATHER_API_KEY is not set' }),
    run: async () => { throw new Error('openweather adapter not implemented — ECMWF covers this need keylessly'); },
  },
  imd_mausam: {
    scope: 'national',
    kind: 'forecast',
    label: 'IMD Mausam',
    available: () => (process.env.IMD_MAUSAM_ENDPOINT
      ? { ok: true }
      : {
        ok: false,
        reason: 'IMD_MAUSAM_ENDPOINT is not set. The IMD public endpoints are '
              + 'undocumented and change without notice; this adapter will not '
              + 'guess a URL, because a provider that silently returns nothing '
              + 'is indistinguishable from a calm week.',
      }),
    run: async () => { throw new Error('imd_mausam adapter awaits a confirmed endpoint'); },
  },
};

const DEFAULT_STATES = ['Assam', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland',
  'Tripura', 'Arunachal Pradesh', 'Sikkim'];

function servedStates() {
  if (process.env.WARNING_ALL_INDIA === 'true') return null;
  if (process.env.WARNING_STATES) return process.env.WARNING_STATES.split(',').map((s) => s.trim());
  return DEFAULT_STATES;
}

/**
 * Run one provider, recording the attempt whatever happens. A provider that
 * throws is recorded as failed with its error rather than skipped quietly.
 */
async function runProvider(name, opts = {}) {
  const p = PROVIDERS[name];
  if (!p) throw new Error(`unknown warning provider: ${name}`);

  const avail = p.available();
  const runId = await startRun(name, p.scope, p.kind);
  if (!avail.ok) {
    await finishRun(runId, { outcome: 'unavailable', error: avail.reason });
    return { provider: name, scope: p.scope, kind: p.kind, outcome: 'unavailable', reason: avail.reason };
  }

  try {
    const r = await p.run({ states: servedStates(), ...opts });
    const unmapped = r.unmapped && Object.keys(r.unmapped).length ? r.unmapped : null;
    const outcome = unmapped || (r.skipped && !r.written) ? 'partial' : 'ok';
    await finishRun(runId, { outcome, seen: r.seen, written: r.written, skipped: r.skipped, unmapped });
    return { provider: name, scope: p.scope, kind: p.kind, outcome, ...r };
  } catch (e) {
    await finishRun(runId, { outcome: 'failed', error: e.message });
    logger.error(`warning provider ${name} failed: ${e.message}`);
    return { provider: name, scope: p.scope, kind: p.kind, outcome: 'failed', error: e.message };
  }
}

/** Run every provider. Alerts first — they are the time-critical half. */
async function ingestAll(opts = {}) {
  const order = ['ndma_sachet', 'gdacs', 'ecmwf_ifs', 'era5_archive', 'openweather', 'imd_mausam'];
  const only = opts.only ? String(opts.only).split(',').map((s) => s.trim()) : null;
  const results = [];
  for (const name of order) {
    if (only && !only.includes(name)) continue;
    results.push(await runProvider(name, opts));
  }
  return {
    ran: results.length,
    written: results.reduce((a, r) => a + (r.written || 0), 0),
    results,
  };
}

/**
 * Feed health. Answers the question an empty alert table cannot: is it quiet,
 * or is nobody looking?
 */
async function health() {
  const { rows } = await pool.query('SELECT * FROM v_warning_source_health');
  const seen = new Set(rows.map((r) => r.provider));
  const never = Object.entries(PROVIDERS)
    .filter(([n]) => !seen.has(n))
    .map(([n, p]) => ({ provider: n, scope: p.scope, kind: p.kind, outcome: 'never_run', label: p.label }));

  const stale = rows.filter((r) => r.outcome === 'ok' && r.minutes_since_run > 180);
  return {
    providers: [...rows.map((r) => ({ ...r, label: (PROVIDERS[r.provider] || {}).label })), ...never],
    national: rows.filter((r) => r.scope === 'national' && r.outcome === 'ok').length,
    international: rows.filter((r) => r.scope === 'international' && r.outcome === 'ok').length,
    warning: never.length || stale.length
      ? `${never.length} provider(s) have never run and ${stale.length} are stale by more than 3 hours. `
        + 'Quiet alerting cannot be trusted while this is true.'
      : null,
  };
}

module.exports = {
  ingestAll, runProvider, health,
  PROVIDERS, classifyHazard, parseSachetArea, sachetSeverity, blocksDispatch, parseIstStamp,
};
