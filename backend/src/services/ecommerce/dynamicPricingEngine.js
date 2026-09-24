/**
 * Strategic Dynamic Pricing Engine (Ecommerce layer)
 *
 * Layers (deep search stack):
 *  1. Cost / floor (never sell below)
 *  2. Mandi reference (APMC / market yard proxies by commodity + geo)
 *  3. Ecommerce competitive band (on-platform + external reference feeds)
 *  4. Geofence multipliers (demand, logistics cost, cold-chain premium)
 *  5. Policy guards (max markup, anti-gouging, farmer-fair optional floor)
 *
 * Honesty: seed mandi + competitor tables are structured for live AGMARKNET /
 * marketplace feeds. Without credentials, engine uses last-known reference
 * snapshots and marks source freshness.
 */

'use strict';

// --- Geofence zones (approx centres; radius_km) ---
const GEOFENCES = [
  {
    id: 'gz-delhi-ncr',
    name: 'Delhi NCR',
    lat: 28.61,
    lng: 77.21,
    radius_km: 50,
    demand_index: 1.15,
    logistics_index: 1.05,
    cold_premium: 1.08,
    mandi_hubs: ['Azadpur', 'Ghazipur'],
  },
  {
    id: 'gz-mumbai',
    name: 'Mumbai Metro',
    lat: 19.08,
    lng: 72.88,
    radius_km: 40,
    demand_index: 1.2,
    logistics_index: 1.12,
    cold_premium: 1.1,
    mandi_hubs: ['Vashi', 'APMC Navi Mumbai'],
  },
  {
    id: 'gz-bangalore',
    name: 'Bengaluru',
    lat: 12.97,
    lng: 77.59,
    radius_km: 35,
    demand_index: 1.12,
    logistics_index: 1.08,
    cold_premium: 1.06,
    mandi_hubs: ['Yeshwanthpur', 'KR Market'],
  },
  {
    id: 'gz-lucknow',
    name: 'Lucknow / Central UP',
    lat: 26.85,
    lng: 80.95,
    radius_km: 45,
    demand_index: 0.95,
    logistics_index: 1.0,
    cold_premium: 1.04,
    mandi_hubs: ['Lucknow Mandi'],
  },
  {
    id: 'gz-nagpur',
    name: 'Nagpur / Vidarbha',
    lat: 21.15,
    lng: 79.09,
    radius_km: 40,
    demand_index: 0.92,
    logistics_index: 0.98,
    cold_premium: 1.03,
    mandi_hubs: ['Kalamna'],
  },
  {
    id: 'gz-default-india',
    name: 'Default India',
    lat: 22.0,
    lng: 79.0,
    radius_km: 2500,
    demand_index: 1.0,
    logistics_index: 1.0,
    cold_premium: 1.05,
    mandi_hubs: ['National avg'],
  },
];

/** Mandi reference snapshots (INR/kg unless noted) — replace via ingestMandiFeed */
const MANDI_REF = {
  tomato: [
    { mandi: 'Azadpur', state: 'Delhi', modal: 22, min: 18, max: 28, unit: 'kg', as_of: '2026-09-20', source: 'seed' },
    { mandi: 'Vashi', state: 'Maharashtra', modal: 24, min: 20, max: 30, unit: 'kg', as_of: '2026-09-20', source: 'seed' },
    { mandi: 'Yeshwanthpur', state: 'Karnataka', modal: 20, min: 16, max: 26, unit: 'kg', as_of: '2026-09-20', source: 'seed' },
    { mandi: 'Lucknow Mandi', state: 'UP', modal: 18, min: 14, max: 22, unit: 'kg', as_of: '2026-09-20', source: 'seed' },
  ],
  milk_a2: [
    { mandi: 'National dairy proxy', state: 'IN', modal: 65, min: 55, max: 80, unit: 'L', as_of: '2026-09-20', source: 'seed' },
  ],
  rice_basmati: [
    { mandi: 'Karnal proxy', state: 'Haryana', modal: 95, min: 85, max: 110, unit: 'kg', as_of: '2026-09-20', source: 'seed' },
  ],
  wheat: [
    { mandi: 'Indore', state: 'MP', modal: 28, min: 25, max: 32, unit: 'kg', as_of: '2026-09-20', source: 'seed' },
  ],
};

/** Ecommerce competitive references (on-platform + external channel proxies) */
const ECOM_COMP = {
  'TOM-ORG-1KG': [
    { channel: 'on_platform', price: 48, url: null, as_of: '2026-09-24', source: 'catalog' },
    { channel: 'competitor_a_proxy', price: 52, url: null, as_of: '2026-09-20', source: 'seed_scrape_proxy' },
    { channel: 'competitor_b_proxy', price: 45, url: null, as_of: '2026-09-20', source: 'seed_scrape_proxy' },
  ],
  'MILK-A2-1L': [
    { channel: 'on_platform', price: 75, url: null, as_of: '2026-09-24', source: 'catalog' },
    { channel: 'competitor_a_proxy', price: 78, url: null, as_of: '2026-09-20', source: 'seed_scrape_proxy' },
  ],
  'RICE-BAS-5KG': [
    { channel: 'on_platform', price: 520, url: null, as_of: '2026-09-24', source: 'catalog' },
    { channel: 'competitor_a_proxy', price: 540, url: null, as_of: '2026-09-20', source: 'seed_scrape_proxy' },
  ],
};

/** SKU → commodity mapping for mandi layer */
const SKU_COMMODITY = {
  'TOM-ORG-1KG': { commodity: 'tomato', pack_kg: 1, cost_floor: 30, list_price: 48 },
  'MILK-A2-1L': { commodity: 'milk_a2', pack_kg: 1, cost_floor: 55, list_price: 75 },
  'RICE-BAS-5KG': { commodity: 'rice_basmati', pack_kg: 5, cost_floor: 400, list_price: 520 },
  'SEED-WHEAT-10KG': { commodity: 'wheat', pack_kg: 10, cost_floor: 320, list_price: 450 },
};

const POLICY = {
  max_markup_vs_cost: 2.5,
  min_margin_pct: 0.08,
  max_premium_vs_mandi_pack: 1.8,
  anti_gouge_vs_comp_median: 1.25,
  match_comp_within_pct: 0.03,
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function resolveGeofence(lat, lng) {
  if (lat == null || lng == null) {
    return { fence: GEOFENCES.find((g) => g.id === 'gz-default-india'), distance_km: null };
  }
  let best = null;
  let bestDist = Infinity;
  for (const g of GEOFENCES) {
    if (g.id === 'gz-default-india') continue;
    const d = haversineKm(lat, lng, g.lat, g.lng);
    if (d <= g.radius_km && d < bestDist) {
      best = g;
      bestDist = d;
    }
  }
  if (!best) {
    return { fence: GEOFENCES.find((g) => g.id === 'gz-default-india'), distance_km: null };
  }
  return { fence: best, distance_km: Math.round(bestDist * 10) / 10 };
}

function searchMandi(commodity, fence) {
  const rows = MANDI_REF[commodity] || [];
  if (!rows.length) {
    return { hits: [], modal: null, source: 'none', freshness: null };
  }
  // Prefer mandis named in fence hubs, else average
  const hubs = (fence && fence.mandi_hubs) || [];
  const preferred = rows.filter((r) => hubs.some((h) => r.mandi.toLowerCase().includes(String(h).toLowerCase().split(' ')[0])));
  const use = preferred.length ? preferred : rows;
  const modal = use.reduce((s, r) => s + r.modal, 0) / use.length;
  const newest = use.map((r) => r.as_of).sort().slice(-1)[0];
  return {
    hits: use,
    modal: Math.round(modal * 100) / 100,
    min: Math.min(...use.map((r) => r.min)),
    max: Math.max(...use.map((r) => r.max)),
    source: preferred.length ? 'geofence_mandi_hub' : 'national_mandi_blend',
    freshness: newest,
  };
}

function searchEcommerceCompetitors(sku) {
  const rows = ECOM_COMP[sku] || [];
  if (!rows.length) {
    return { hits: [], median: null, source: 'none' };
  }
  const prices = rows.map((r) => r.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  return {
    hits: rows,
    median: Math.round(median * 100) / 100,
    min: prices[0],
    max: prices[prices.length - 1],
    source: 'ecommerce_competitive_layer',
  };
}

/**
 * Deep-layer price computation for one SKU at a geo point
 */
function priceSku(sku, opts = {}) {
  const meta = SKU_COMMODITY[sku];
  if (!meta) {
    const err = new Error(`Unknown SKU for pricing: ${sku}`);
    err.code = 'SKU_NOT_FOUND';
    throw err;
  }

  const { fence, distance_km } = resolveGeofence(opts.lat, opts.lng);
  const mandi = searchMandi(meta.commodity, fence);
  const ecom = searchEcommerceCompetitors(sku);

  const costFloor = meta.cost_floor;
  const list = meta.list_price;

  // Layer A: mandi-based pack price
  const mandiPack =
    mandi.modal != null ? Math.round(mandi.modal * meta.pack_kg * 100) / 100 : null;

  // Layer B: start from competitive median or list
  let candidate = ecom.median != null ? ecom.median : list;

  // Layer C: pull toward mandi + retail spread (farm-to-retail gap proxy ~1.4–1.8x)
  if (mandiPack != null) {
    const retailFromMandi = mandiPack * 1.55;
    candidate = candidate * 0.55 + retailFromMandi * 0.45;
  }

  // Layer D: geofence indices
  const demand = fence.demand_index || 1;
  const logistics = fence.logistics_index || 1;
  let geoMult = demand * 0.6 + logistics * 0.4;
  if (opts.cold_chain || meta.commodity === 'milk_a2') {
    geoMult *= fence.cold_premium || 1;
  }
  candidate *= geoMult;

  // Layer E: optional strategy
  const strategy = opts.strategy || 'balanced'; // balanced | match_comp | premium | penetration
  if (strategy === 'match_comp' && ecom.median != null) {
    candidate = ecom.median * (1 - POLICY.match_comp_within_pct);
  } else if (strategy === 'premium') {
    candidate *= 1.08;
  } else if (strategy === 'penetration') {
    candidate *= 0.94;
  }

  // Guards
  const minByMargin = costFloor * (1 + POLICY.min_margin_pct);
  let floor = Math.max(costFloor, minByMargin);
  let ceiling = costFloor * POLICY.max_markup_vs_cost;
  if (mandiPack != null) {
    ceiling = Math.min(ceiling, mandiPack * POLICY.max_premium_vs_mandi_pack);
  }
  if (ecom.median != null) {
    ceiling = Math.min(ceiling, ecom.median * POLICY.anti_gouge_vs_comp_median);
  }

  let finalPrice = Math.round(Math.min(ceiling, Math.max(floor, candidate)) * 100) / 100;

  const layers = {
    cost_floor: costFloor,
    list_price: list,
    mandi_pack: mandiPack,
    ecom_median: ecom.median,
    geofence_mult: Math.round(geoMult * 1000) / 1000,
    strategy,
    floor_applied: floor,
    ceiling_applied: Math.round(ceiling * 100) / 100,
    raw_candidate: Math.round(candidate * 100) / 100,
  };

  return {
    layer: 'ecommerce',
    sku,
    commodity: meta.commodity,
    price: finalPrice,
    currency: 'INR',
    geofence: {
      id: fence.id,
      name: fence.name,
      distance_km,
      demand_index: fence.demand_index,
      logistics_index: fence.logistics_index,
    },
    mandi_search: mandi,
    ecommerce_search: ecom,
    layers,
    policy: POLICY,
    confidence: mandi.modal && ecom.median ? 0.82 : mandi.modal || ecom.median ? 0.7 : 0.55,
    advisory: true,
    basis:
      'Weighted mandi pack + ecommerce competitive median × geofence demand/logistics; guarded by cost floor, margin, anti-gouge ceiling.',
    safety_floor:
      'Reference mandi/competitor rows are seed snapshots until live AGMARKNET/marketplace feeds are connected. Not a manipulated dark-pattern price.',
    data_freshness: {
      mandi: mandi.freshness,
      ecommerce: (ecom.hits[0] && ecom.hits[0].as_of) || null,
    },
  };
}

function priceBasket(lines, opts = {}) {
  const priced = (lines || []).map((l) => {
    const unit = priceSku(l.sku, opts);
    const qty = Number(l.qty) || 1;
    return {
      ...unit,
      qty,
      line_total: Math.round(unit.price * qty * 100) / 100,
    };
  });
  const subtotal = priced.reduce((s, x) => s + x.line_total, 0);
  return {
    layer: 'ecommerce',
    geofence: priced[0] ? priced[0].geofence : null,
    lines: priced,
    subtotal: Math.round(subtotal * 100) / 100,
    strategy: opts.strategy || 'balanced',
    confidence: priced.length
      ? priced.reduce((s, x) => s + x.confidence, 0) / priced.length
      : 0,
  };
}

function listGeofences() {
  return { geofences: GEOFENCES, count: GEOFENCES.length };
}

function deepSearch(opts = {}) {
  const { lat, lng, sku, commodity } = opts;
  const { fence, distance_km } = resolveGeofence(lat, lng);
  const c = commodity || (sku && SKU_COMMODITY[sku] && SKU_COMMODITY[sku].commodity);
  return {
    layer: 'ecommerce',
    geofence: { ...fence, distance_km },
    mandi_layer: c ? searchMandi(c, fence) : { note: 'pass commodity or sku' },
    ecommerce_layer: sku ? searchEcommerceCompetitors(sku) : { note: 'pass sku' },
    skus_known: Object.keys(SKU_COMMODITY),
    commodities_known: Object.keys(MANDI_REF),
  };
}

/** Ingest live mandi row (from AGMARKNET job / scraper adapter) */
function ingestMandiFeed(commodity, row) {
  if (!MANDI_REF[commodity]) MANDI_REF[commodity] = [];
  MANDI_REF[commodity].push({
    mandi: row.mandi,
    state: row.state || '',
    modal: Number(row.modal),
    min: Number(row.min != null ? row.min : row.modal),
    max: Number(row.max != null ? row.max : row.modal),
    unit: row.unit || 'kg',
    as_of: row.as_of || new Date().toISOString().slice(0, 10),
    source: row.source || 'ingest',
  });
  return { ok: true, commodity, count: MANDI_REF[commodity].length };
}

function ingestEcomFeed(sku, row) {
  if (!ECOM_COMP[sku]) ECOM_COMP[sku] = [];
  ECOM_COMP[sku].push({
    channel: row.channel || 'external',
    price: Number(row.price),
    url: row.url || null,
    as_of: row.as_of || new Date().toISOString().slice(0, 10),
    source: row.source || 'ingest',
  });
  return { ok: true, sku, count: ECOM_COMP[sku].length };
}

async function operate(data = {}) {
  const action = data.action || 'price';
  switch (action) {
    case 'price':
      return priceSku(data.sku, data);
    case 'basket':
      return priceBasket(data.lines, data);
    case 'geofences':
      return listGeofences();
    case 'deep_search':
      return deepSearch(data);
    case 'ingest_mandi':
      return ingestMandiFeed(data.commodity, data.row || data);
    case 'ingest_ecom':
      return ingestEcomFeed(data.sku, data.row || data);
    case 'resolve_geofence':
      return resolveGeofence(data.lat, data.lng);
    default:
      return { error: 'Unknown action', action };
  }
}

module.exports = {
  operate,
  priceSku,
  priceBasket,
  resolveGeofence,
  searchMandi,
  searchEcommerceCompetitors,
  deepSearch,
  listGeofences,
  ingestMandiFeed,
  ingestEcomFeed,
  GEOFENCES,
  POLICY,
  SKU_COMMODITY,
};
