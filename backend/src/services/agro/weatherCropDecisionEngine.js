/**
 * Geofenced multi-source weather → crop decision (what / why / when / avoid)
 * Sources are blended with explicit weights; live APIs plug into ingest.
 */

'use strict';

const { randomUUID } = require('crypto');

function tryReq(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

const weatherAlert = tryReq('../weather/weatherAlertService');
const pricing = tryReq('../ecommerce/dynamicPricingEngine');

/** Geofence agro-climatic zones (approx) */
const AGRO_ZONES = [
  {
    id: 'gz-punjab-haryana',
    name: 'Indo-Gangetic NW (Punjab/Haryana)',
    lat: 30.7,
    lng: 76.8,
    radius_km: 200,
    season_primary: ['rabi', 'kharif'],
    soil_hint: 'alluvial',
    rainfall_mm_yr_typ: 600,
  },
  {
    id: 'gz-gangetic-up-bihar',
    name: 'Middle Gangetic (UP/Bihar)',
    lat: 26.5,
    lng: 82.0,
    radius_km: 250,
    season_primary: ['rabi', 'kharif'],
    soil_hint: 'alluvial',
    rainfall_mm_yr_typ: 1000,
  },
  {
    id: 'gz-vidarbha',
    name: 'Vidarbha / Central',
    lat: 21.1,
    lng: 79.1,
    radius_km: 180,
    season_primary: ['kharif', 'rabi'],
    soil_hint: 'black',
    rainfall_mm_yr_typ: 900,
  },
  {
    id: 'gz-saurashtra',
    name: 'Saurashtra / dry west',
    lat: 22.3,
    lng: 70.8,
    radius_km: 150,
    season_primary: ['kharif', 'rabi'],
    soil_hint: 'medium_black',
    rainfall_mm_yr_typ: 550,
  },
  {
    id: 'gz-coastal-konkan',
    name: 'Konkan / coastal high rain',
    lat: 18.5,
    lng: 73.0,
    radius_km: 120,
    season_primary: ['kharif'],
    soil_hint: 'laterite',
    rainfall_mm_yr_typ: 2500,
  },
  {
    id: 'gz-tn-delta',
    name: 'Cauvery / TN delta',
    lat: 10.8,
    lng: 79.2,
    radius_km: 120,
    season_primary: ['kharif', 'rabi', 'zaid'],
    soil_hint: 'deltaic',
    rainfall_mm_yr_typ: 1100,
  },
  {
    id: 'gz-default',
    name: 'Default India',
    lat: 22,
    lng: 79,
    radius_km: 2500,
    season_primary: ['kharif', 'rabi'],
    soil_hint: 'mixed',
    rainfall_mm_yr_typ: 1000,
  },
];

/** Crop cards: climate needs + season */
const CROPS = [
  {
    id: 'wheat',
    name: 'Wheat',
    seasons: ['rabi'],
    temp_opt_c: [15, 25],
    rain_mm_season: [300, 600],
    soils: ['alluvial', 'black', 'mixed'],
    water: 'medium',
    notes: 'Cool dry grain fill preferred; frost at flowering is risk',
  },
  {
    id: 'rice',
    name: 'Rice / paddy',
    seasons: ['kharif', 'rabi'],
    temp_opt_c: [22, 32],
    rain_mm_season: [1000, 2000],
    soils: ['alluvial', 'deltaic', 'laterite', 'mixed'],
    water: 'high',
    notes: 'Needs reliable water or irrigation; coastal/high-rain zones favored',
  },
  {
    id: 'cotton',
    name: 'Cotton',
    seasons: ['kharif'],
    temp_opt_c: [25, 35],
    rain_mm_season: [500, 900],
    soils: ['black', 'medium_black', 'mixed'],
    water: 'medium',
    notes: 'Black soils ideal; excess late rain hurts quality',
  },
  {
    id: 'soybean',
    name: 'Soybean',
    seasons: ['kharif'],
    temp_opt_c: [22, 32],
    rain_mm_season: [450, 800],
    soils: ['black', 'medium_black', 'mixed'],
    water: 'medium',
    notes: 'Avoid prolonged waterlogging',
  },
  {
    id: 'maize',
    name: 'Maize',
    seasons: ['kharif', 'rabi', 'zaid'],
    temp_opt_c: [18, 32],
    rain_mm_season: [400, 800],
    soils: ['alluvial', 'black', 'mixed'],
    water: 'medium',
    notes: 'Flexible; heat stress at tasseling reduces yield',
  },
  {
    id: 'chickpea',
    name: 'Chickpea (gram)',
    seasons: ['rabi'],
    temp_opt_c: [15, 25],
    rain_mm_season: [250, 450],
    soils: ['black', 'medium_black', 'alluvial', 'mixed'],
    water: 'low',
    notes: 'Prefers residual moisture; excess humidity → disease',
  },
  {
    id: 'mustard',
    name: 'Mustard',
    seasons: ['rabi'],
    temp_opt_c: [12, 25],
    rain_mm_season: [250, 400],
    soils: ['alluvial', 'mixed'],
    water: 'low',
    notes: 'Frost and aphids are key risks',
  },
  {
    id: 'groundnut',
    name: 'Groundnut',
    seasons: ['kharif', 'rabi'],
    temp_opt_c: [24, 33],
    rain_mm_season: [400, 700],
    soils: ['medium_black', 'mixed', 'laterite'],
    water: 'medium',
    notes: 'Well-drained soils; Saurashtra classic belt',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    seasons: ['kharif', 'rabi'],
    temp_opt_c: [20, 35],
    rain_mm_season: [1000, 1500],
    soils: ['alluvial', 'black', 'deltaic', 'mixed'],
    water: 'high',
    notes: 'Long duration; needs irrigation backup',
  },
  {
    id: 'millet_bajra',
    name: 'Pearl millet (bajra)',
    seasons: ['kharif'],
    temp_opt_c: [25, 35],
    rain_mm_season: [250, 500],
    soils: ['medium_black', 'mixed'],
    water: 'low',
    notes: 'Drought resilient — dry zones',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    seasons: ['rabi', 'zaid', 'kharif'],
    temp_opt_c: [18, 28],
    rain_mm_season: [400, 700],
    soils: ['alluvial', 'mixed'],
    water: 'medium',
    notes: 'Market crop; excess humidity → blight; needs plant protection',
  },
];

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

function resolveZone(lat, lng) {
  if (lat == null || lng == null) {
    return { zone: AGRO_ZONES.find((z) => z.id === 'gz-default'), distance_km: null };
  }
  let best = null;
  let bestD = Infinity;
  for (const z of AGRO_ZONES) {
    if (z.id === 'gz-default') continue;
    const d = haversineKm(lat, lng, z.lat, z.lng);
    if (d <= z.radius_km && d < bestD) {
      best = z;
      bestD = d;
    }
  }
  if (!best) return { zone: AGRO_ZONES.find((z) => z.id === 'gz-default'), distance_km: null };
  return { zone: best, distance_km: Math.round(bestD * 10) / 10 };
}

/** Multi-source weather blend */
function blendWeatherSources(location = {}, overrides = {}) {
  const sources = [];

  // Source A: internal weather alert forecast
  let internal = null;
  if (weatherAlert) {
    internal = weatherAlert.forecast(location);
    sources.push({
      id: 'internal_heuristic',
      weight: overrides.live ? 0.25 : 0.45,
      days: internal.days,
      confidence: internal.confidence,
    });
  }

  // Source B: IMD-style proxy (caller can pass imd_days)
  if (overrides.imd_days) {
    sources.push({
      id: 'imd_feed',
      weight: 0.4,
      days: overrides.imd_days,
      confidence: 0.85,
    });
  } else {
    // synthetic IMD-like mild variation
    const base = internal?.days || [];
    sources.push({
      id: 'imd_proxy_seed',
      weight: 0.3,
      days: base.map((d) => ({
        ...d,
        rain_mm: Math.round(d.rain_mm * 0.9),
        temp_max_c: d.temp_max_c - 0.5,
      })),
      confidence: 0.5,
    });
  }

  // Source C: Open-Meteo / global model proxy
  if (overrides.open_meteo_days) {
    sources.push({
      id: 'open_meteo',
      weight: 0.35,
      days: overrides.open_meteo_days,
      confidence: 0.8,
    });
  } else {
    const base = internal?.days || [];
    sources.push({
      id: 'open_meteo_proxy_seed',
      weight: 0.25,
      days: base.map((d) => ({
        ...d,
        rain_mm: Math.round(d.rain_mm * 1.1),
        wind_kmh: d.wind_kmh + 2,
      })),
      confidence: 0.5,
    });
  }

  // Normalize weights
  const wsum = sources.reduce((s, x) => s + x.weight, 0);
  sources.forEach((s) => {
    s.weight = s.weight / wsum;
  });

  // Blend day 0..6
  const blended = [];
  for (let i = 0; i < 7; i++) {
    let rain = 0;
    let tMax = 0;
    let tMin = 0;
    let wind = 0;
    let hum = 0;
    for (const s of sources) {
      const d = s.days[i] || s.days[0] || {
        rain_mm: 0,
        temp_max_c: 30,
        temp_min_c: 20,
        wind_kmh: 10,
        humidity_pct: 60,
      };
      rain += (d.rain_mm || 0) * s.weight;
      tMax += (d.temp_max_c || 30) * s.weight;
      tMin += (d.temp_min_c || 20) * s.weight;
      wind += (d.wind_kmh || 10) * s.weight;
      hum += (d.humidity_pct || 60) * s.weight;
    }
    blended.push({
      day_offset: i,
      date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
      rain_mm: Math.round(rain * 10) / 10,
      temp_max_c: Math.round(tMax * 10) / 10,
      temp_min_c: Math.round(tMin * 10) / 10,
      wind_kmh: Math.round(wind * 10) / 10,
      humidity_pct: Math.round(hum),
      condition: rain > 20 ? 'heavy_rain' : rain > 0 ? 'light_rain' : 'clear',
    });
  }

  const seasonRain = blended.reduce((s, d) => s + d.rain_mm, 0) * (90 / 7); // rough 90-day projection from week rate
  const avgMax = blended.reduce((s, d) => s + d.temp_max_c, 0) / blended.length;
  const avgMin = blended.reduce((s, d) => s + d.temp_min_c, 0) / blended.length;

  return {
    sources: sources.map((s) => ({
      id: s.id,
      weight: Math.round(s.weight * 1000) / 1000,
      confidence: s.confidence,
    })),
    blended_days: blended,
    climate_signal: {
      week_rain_mm: Math.round(blended.reduce((s, d) => s + d.rain_mm, 0) * 10) / 10,
      projected_season_rain_mm: Math.round(seasonRain),
      avg_temp_max_c: Math.round(avgMax * 10) / 10,
      avg_temp_min_c: Math.round(avgMin * 10) / 10,
    },
  };
}

function currentSeason(month = new Date().getMonth() + 1) {
  // India agro seasons rough
  if (month >= 6 && month <= 10) return 'kharif';
  if (month >= 10 || month <= 3) return 'rabi';
  return 'zaid';
}

function scoreCrop(crop, zone, climate, season) {
  let score = 40;
  const reasons = [];
  const risks = [];

  if (crop.seasons.includes(season)) {
    score += 20;
    reasons.push(`Fits ${season} season`);
  } else {
    score -= 15;
    risks.push(`Not typical for ${season}`);
  }

  if (crop.soils.includes(zone.soil_hint) || crop.soils.includes('mixed')) {
    score += 12;
    reasons.push(`Soil affinity: ${zone.soil_hint}`);
  } else {
    score -= 8;
    risks.push(`Soil ${zone.soil_hint} not ideal`);
  }

  const rain = climate.projected_season_rain_mm || zone.rainfall_mm_yr_typ * 0.4;
  const [r0, r1] = crop.rain_mm_season;
  if (rain >= r0 && rain <= r1) {
    score += 15;
    reasons.push(`Projected moisture ${Math.round(rain)} mm in band ${r0}–${r1}`);
  } else if (rain < r0) {
    score -= 12;
    risks.push(`Moisture shortfall vs crop need (${Math.round(rain)} < ${r0}) — irrigation critical`);
  } else {
    score -= 8;
    risks.push(`Excess moisture risk (${Math.round(rain)} > ${r1})`);
  }

  const t = (climate.avg_temp_max_c + climate.avg_temp_min_c) / 2;
  const [t0, t1] = crop.temp_opt_c;
  if (t >= t0 && t <= t1) {
    score += 10;
    reasons.push(`Temperature regime suitable (~${t.toFixed(1)}°C)`);
  } else {
    score -= 10;
    risks.push(`Temperature ${t.toFixed(1)}°C outside opt ${t0}–${t1}°C`);
  }

  // Water demand vs zone rain
  if (crop.water === 'high' && zone.rainfall_mm_yr_typ < 800) {
    score -= 10;
    risks.push('High water crop in relatively dry zone');
  }
  if (crop.water === 'low' && zone.rainfall_mm_yr_typ < 700) {
    score += 5;
    reasons.push('Drought-resilient crop matches drier zone');
  }

  score = Math.max(0, Math.min(100, score));
  return { score, reasons, risks };
}

function decide(input = {}) {
  const lat = input.lat;
  const lng = input.lng;
  const { zone, distance_km } = resolveZone(lat, lng);
  const season = input.season || currentSeason(input.month);
  const blend = blendWeatherSources(
    {
      lat,
      lng,
      district: input.district,
      state: input.state,
      base_temp_c: input.base_temp_c,
      rain_mm_day: input.rain_mm_day,
    },
    {
      imd_days: input.imd_days,
      open_meteo_days: input.open_meteo_days,
      live: input.live,
    },
  );

  const ranked = CROPS.map((crop) => {
    const { score, reasons, risks } = scoreCrop(crop, zone, blend.climate_signal, season);
    return {
      crop_id: crop.id,
      name: crop.name,
      score,
      recommendation:
        score >= 70 ? 'strongly_suitable' : score >= 55 ? 'suitable' : score >= 40 ? 'marginal' : 'avoid',
      what: crop.name,
      why: reasons,
      risks,
      when: {
        season,
        seasons_supported: crop.seasons,
      },
      water_need: crop.water,
      agronomy_note: crop.notes,
    };
  }).sort((a, b) => b.score - a.score);

  const top = ranked.filter((r) => r.recommendation === 'strongly_suitable' || r.recommendation === 'suitable');
  const avoid = ranked.filter((r) => r.recommendation === 'avoid');

  // Optional market signal
  let market_hint = null;
  if (pricing && top[0]) {
    try {
      const skuMap = { tomato: 'TOM-ORG-1KG', wheat: 'SEED-WHEAT-10KG' };
      const sku = skuMap[top[0].crop_id];
      if (sku) {
        const p = pricing.priceSku(sku, { lat, lng });
        market_hint = { sku, indicative_price: p.price, geofence: p.geofence?.name };
      }
    } catch {
      /* */
    }
  }

  let ops = null;
  if (weatherAlert) {
    const alerts = weatherAlert.deriveAlerts(
      { days: blend.blended_days, location: { district: input.district } },
      { crop: top[0]?.name },
    );
    ops = weatherAlert.adviseOperations(alerts);
  }

  return {
    decision_id: `CD-${randomUUID().slice(0, 8)}`,
    geofence: {
      zone_id: zone.id,
      zone_name: zone.name,
      distance_km,
      soil_hint: zone.soil_hint,
      typical_annual_rain_mm: zone.rainfall_mm_yr_typ,
    },
    season,
    weather: {
      multi_source: blend.sources,
      climate_signal: blend.climate_signal,
      next_7_days: blend.blended_days,
    },
    what_to_grow: top.slice(0, 5),
    why_summary: top[0]
      ? `${top[0].name} leads because: ${(top[0].why || []).join('; ')}`
      : 'No strongly suitable crop — review irrigation and season',
    avoid: avoid.slice(0, 5),
    all_ranked: ranked,
    operations: ops,
    market_hint,
    confidence: Math.min(
      0.92,
      0.5 +
        blend.sources.reduce((s, x) => s + x.confidence * x.weight, 0) * 0.45 +
        (distance_km != null ? 0.05 : 0),
    ),
    advisory: true,
    basis:
      'Geofence agro-zone + blended multi-source weather (internal/IMD/Open-Meteo proxies) + crop climate envelopes',
    safety_floor:
      'Advisory only. Local soil test, irrigation reality, and extension officer / agronomist prevail. Seed sources are not certified variety advice.',
  };
}

async function operate(data = {}) {
  const action = data.action || 'decide';
  if (action === 'zones') return { zones: AGRO_ZONES };
  if (action === 'crops') return { crops: CROPS };
  if (action === 'weather_blend') {
    return blendWeatherSources(data.location || data, data);
  }
  if (action === 'resolve_zone') return resolveZone(data.lat, data.lng);
  return decide(data);
}

module.exports = {
  operate,
  decide,
  resolveZone,
  blendWeatherSources,
  scoreCrop,
  AGRO_ZONES,
  CROPS,
};
