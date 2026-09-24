/**
 * Weather forecasting alerts — decision-support for farm operations
 * Seed/heuristic when live IMD API not configured; structure ready for live feed.
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

const events = tryReq('../analytics/businessEventBus');

/** Generate forecast proxy from simple inputs or defaults */
function forecast(location = {}) {
  const days = [];
  const baseTemp = Number(location.base_temp_c) || 32;
  for (let i = 0; i < 7; i++) {
    const rain = Number(location.rain_mm_day?.[i]) || (i === 2 || i === 3 ? 25 : i === 4 ? 5 : 0);
    const wind = Number(location.wind_kmh) || 12 + (i % 3) * 4;
    days.push({
      day_offset: i,
      date: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
      temp_max_c: baseTemp + (i % 2),
      temp_min_c: baseTemp - 8,
      rain_mm: rain,
      wind_kmh: wind,
      humidity_pct: 60 + (rain > 0 ? 20 : 0),
      condition: rain > 20 ? 'heavy_rain' : rain > 0 ? 'light_rain' : 'clear',
    });
  }
  return {
    location: {
      district: location.district || 'unknown',
      state: location.state || 'IN',
      lat: location.lat,
      lng: location.lng,
    },
    days,
    source: location.live_source || 'heuristic_seed',
    note: 'Replace with IMD / Open-Meteo live fetch when credentials/network job configured',
    confidence: location.live_source ? 0.85 : 0.55,
  };
}

function deriveAlerts(fc, farm = {}) {
  const alerts = [];
  for (const d of fc.days) {
    if (d.rain_mm >= 20) {
      alerts.push({
        alert_id: `WA-${randomUUID().slice(0, 6)}`,
        type: 'heavy_rain',
        severity: d.rain_mm >= 40 ? 'high' : 'medium',
        date: d.date,
        message: `Heavy rain ~${d.rain_mm}mm expected — delay spraying; protect harvested stock.`,
        actions: ['postpone_spray', 'cover_produce', 'check_drainage'],
      });
    }
    if (d.wind_kmh >= 30) {
      alerts.push({
        alert_id: `WA-${randomUUID().slice(0, 6)}`,
        type: 'high_wind',
        severity: 'medium',
        date: d.date,
        message: `High wind ~${d.wind_kmh} km/h — avoid tall spray boom; secure polyhouse vents.`,
        actions: ['avoid_spray', 'secure_structures'],
      });
    }
    if (d.temp_max_c >= 42) {
      alerts.push({
        alert_id: `WA-${randomUUID().slice(0, 6)}`,
        type: 'heat_stress',
        severity: 'high',
        date: d.date,
        message: 'Heat stress risk for livestock and labour — shade, water, work early morning.',
        actions: ['livestock_shade', 'labour_shift', 'irrigation_evening'],
      });
    }
    if (d.temp_min_c <= 5 && (farm.crop || '').toLowerCase().includes('wheat') === false) {
      // mild frost hint
    }
    if (d.temp_min_c <= 4) {
      alerts.push({
        alert_id: `WA-${randomUUID().slice(0, 6)}`,
        type: 'cold',
        severity: 'medium',
        date: d.date,
        message: 'Low temperature — protect sensitive crops and young animals.',
        actions: ['cover_nursery', 'livestock_shelter'],
      });
    }
  }
  // Spray window: dry day + low wind
  const sprayDays = fc.days.filter((d) => d.rain_mm < 2 && d.wind_kmh < 20);
  if (sprayDays.length) {
    alerts.push({
      alert_id: `WA-${randomUUID().slice(0, 6)}`,
      type: 'spray_window',
      severity: 'info',
      date: sprayDays[0].date,
      message: `Possible spray window on ${sprayDays[0].date} (low rain & wind).`,
      actions: ['plan_plant_protection'],
    });
  }
  return alerts;
}

function adviseOperations(alerts = []) {
  const blocked = new Set();
  for (const a of alerts) {
    if (a.type === 'heavy_rain') blocked.add('spraying').add('harvest_open');
    if (a.type === 'high_wind') blocked.add('spraying');
    if (a.type === 'heat_stress') blocked.add('midday_labour');
  }
  return {
    avoid: [...blocked],
    prefer: alerts.filter((a) => a.type === 'spray_window').map((a) => a.date),
  };
}

async function operate(data = {}) {
  const action = data.action || 'forecast_alerts';
  if (action === 'forecast') {
    return forecast(data.location || data);
  }
  const fc = forecast(data.location || data);
  const alerts = deriveAlerts(fc, data.farm || {});
  const operations = adviseOperations(alerts);
  if (events && alerts.length) {
    events.emit('weather.alerts', { count: alerts.length, district: fc.location.district }, {
      source: 'weatherAlertService',
    });
  }
  return {
    forecast: fc,
    alerts,
    operations,
    advisory: true,
    safety_floor: 'Not a substitute for official IMD warnings during cyclones/floods.',
  };
}

module.exports = { operate, forecast, deriveAlerts, adviseOperations };
