/**
 * Solar PV first-pass sizing.
 *
 *   optimalTilt   fixed-tilt angle from latitude
 *   rowSpacing    winter-solstice shadow-free pitch
 *   annualYield   PR model with NOCT cell-temperature derating and degradation
 *   batterySizing autonomy-based storage capacity
 *
 * IRRADIATION IS CALLER-SUPPLIED. There is no TMY, satellite or ground-station
 * irradiation feed connected in this deployment, so this engine cannot tell a
 * caller what the resource at a site actually is -- it can only work out the
 * consequences of the figure it is given. Every yield result says so.
 */

'use strict';

const {
  build, InputError, num, round,
} = require('./advisory');

const SOLAR_DECLINATION_SOLSTICE = 23.45; // degrees
const DEG = Math.PI / 180;

/**
 * Fixed-tilt angle for maximum annual energy.
 *
 * The widely used rule is tilt ~ |latitude|, adjusted down slightly in the
 * tropics where a flatter panel collects more of a near-overhead sun and sheds
 * less to soiling. Reported with the rule named, because it IS a rule of
 * thumb: an hour-by-hour irradiance model would give a different optimum, and
 * this engine has no such model.
 */
function optimalTilt(input = {}) {
  const latitude = num(input.latitude, 'latitude', { positive: false });
  if (latitude < -90 || latitude > 90) {
    throw new InputError('latitude must be between -90 and 90 degrees');
  }
  const absLat = Math.abs(latitude);

  let tilt;
  let rule;
  if (absLat <= 25) {
    tilt = absLat * 0.87;
    rule = 'tilt = 0.87 x |latitude| for |lat| <= 25 deg';
  } else if (absLat <= 50) {
    tilt = absLat * 0.76 + 3.1;
    rule = 'tilt = 0.76 x |latitude| + 3.1 for 25 < |lat| <= 50 deg';
  } else {
    tilt = absLat * 0.5 + 16.3;
    rule = 'tilt = 0.50 x |latitude| + 16.3 for |lat| > 50 deg';
  }

  // Below about 10 degrees a panel does not self-clean in rain.
  const minimumTilt = 10;
  const recommendedTilt = Math.max(tilt, minimumTilt);

  return build({
    basis: `Latitude-based fixed-tilt rule of thumb (${rule})`,
    output: {
      latitude,
      annualOptimumTiltDeg: round(tilt, 2),
      recommendedTiltDeg: round(recommendedTilt, 2),
      azimuthDeg: latitude >= 0 ? 180 : 0,
      azimuthNote: latitude >= 0 ? 'Due south (northern hemisphere)' : 'Due north (southern hemisphere)',
      summerOptimumTiltDeg: round(Math.max(absLat - 15, 0), 2),
      winterOptimumTiltDeg: round(absLat + 15, 2),
    },
    assumptions: {
      minimumTiltDeg: minimumTilt,
      minimumTiltReason: 'Below about 10 degrees rain does not clear soiling, and the soiling '
        + 'loss outweighs the geometric gain.',
      mounting: 'Fixed tilt. Single- and dual-axis tracking are not modelled.',
    },
    warnings: [
      'Rule of thumb, not an optimisation. A real optimum depends on the hourly irradiance '
      + 'and the diffuse fraction at the site, neither of which this engine has.',
    ],
  });
}

/**
 * Shadow-free row pitch, sized on the winter solstice -- the worst case, when
 * the sun is lowest and shadows longest.
 *
 * Solar altitude at solar noon on the winter solstice:
 *   alpha = 90 - |latitude| - 23.45
 * Refuses rather than returns a number when alpha <= 0: above roughly 66.5
 * degrees latitude the sun does not clear the horizon at the solstice, so no
 * finite pitch is shadow-free and any figure returned would be a fiction.
 */
function rowSpacing(input = {}) {
  const latitude = num(input.latitude, 'latitude', { positive: false });
  const moduleLengthM = num(input.moduleLengthM, 'moduleLengthM');
  const tiltDeg = num(input.tiltDeg, 'tiltDeg', { positive: false });
  if (tiltDeg < 0 || tiltDeg > 90) throw new InputError('tiltDeg must be between 0 and 90');

  const absLat = Math.abs(latitude);
  const solarAltitudeDeg = 90 - absLat - SOLAR_DECLINATION_SOLSTICE;

  if (solarAltitudeDeg <= 0) {
    throw new InputError(
      `At latitude ${latitude} the sun does not clear the horizon at solar noon on the winter `
      + 'solstice, so no finite row pitch is shadow-free on that day. Size the array on a '
      + 'shorter shadow-free window (for example 9am-3pm at the equinox) instead; this engine '
      + 'does not model that case.',
    );
  }

  const moduleHeightM = moduleLengthM * Math.sin(tiltDeg * DEG);
  const moduleBaseM = moduleLengthM * Math.cos(tiltDeg * DEG);
  const shadowLengthM = moduleHeightM / Math.tan(solarAltitudeDeg * DEG);
  const rowPitchM = moduleBaseM + shadowLengthM;
  const groundCoverageRatio = moduleLengthM / rowPitchM;

  return build({
    basis: 'Winter-solstice solar-noon shadow geometry: altitude = 90 - |lat| - 23.45, '
      + 'pitch = L*cos(tilt) + L*sin(tilt)/tan(altitude)',
    output: {
      latitude,
      tiltDeg,
      moduleLengthM,
      winterSolsticeSolarAltitudeDeg: round(solarAltitudeDeg, 3),
      moduleVerticalRiseM: round(moduleHeightM, 4),
      moduleHorizontalBaseM: round(moduleBaseM, 4),
      shadowLengthM: round(shadowLengthM, 4),
      minimumRowPitchM: round(rowPitchM, 4),
      interRowGapM: round(shadowLengthM, 4),
      groundCoverageRatio: round(groundCoverageRatio, 4),
    },
    assumptions: {
      criticalDay: 'Winter solstice at solar noon -- the longest shadow of the year',
      terrain: 'Flat and level. A slope changes the required pitch and is not modelled.',
      orientation: 'Rows running east-west, facing the equator',
    },
    warnings: [
      'Solar-noon only. Rows are still mutually shaded early and late in the day; sizing for '
      + 'a full shadow-free day needs a far larger pitch than this.',
    ],
  });
}

/**
 * Annual energy yield with temperature derating.
 *
 * Cell temperature by the NOCT model:
 *   Tc = Tamb + (NOCT - 20)/800 * G
 * Output derate:
 *   factor = 1 + gamma * (Tc - 25)     gamma negative, %/degC as a fraction
 *
 * Energy:
 *   E = Pdc * (H / 1 kW/m^2) * PR * tempFactor    per year, then degraded
 */
function annualYield(input = {}) {
  const systemSizeKwp = num(input.systemSizeKwp, 'systemSizeKwp');
  const annualIrradiationKwhPerM2 = num(input.annualIrradiationKwhPerM2, 'annualIrradiationKwhPerM2');
  const ambientTempC = num(input.ambientTempC === undefined ? 25 : input.ambientTempC, 'ambientTempC', { positive: false });
  const noctC = num(input.noctC === undefined ? 45 : input.noctC, 'noctC');
  const irradianceWPerM2 = num(input.irradianceWPerM2 === undefined ? 800 : input.irradianceWPerM2, 'irradianceWPerM2');
  const tempCoefficientPerC = num(
    input.tempCoefficientPerC === undefined ? -0.004 : input.tempCoefficientPerC,
    'tempCoefficientPerC',
    { positive: false },
  );
  if (tempCoefficientPerC > 0) {
    throw new InputError('tempCoefficientPerC must be negative: PV output falls as cell temperature rises');
  }
  const performanceRatio = num(input.performanceRatio === undefined ? 0.78 : input.performanceRatio, 'performanceRatio');
  if (performanceRatio <= 0 || performanceRatio > 1) {
    throw new InputError('performanceRatio must be between 0 and 1');
  }
  const degradationRate = num(input.degradationRate === undefined ? 0.005 : input.degradationRate, 'degradationRate', { positive: false });
  const years = Math.trunc(num(input.years === undefined ? 25 : input.years, 'years'));

  // NOCT cell temperature
  const cellTempC = ambientTempC + ((noctC - 20) / 800) * irradianceWPerM2;
  const tempFactor = 1 + tempCoefficientPerC * (cellTempC - 25);
  const temperatureLossFraction = 1 - tempFactor;

  // Reference irradiance is 1 kW/m^2, so annual kWh/m^2 maps directly to
  // peak-sun-hours.
  const peakSunHours = annualIrradiationKwhPerM2;
  const year1Kwh = systemSizeKwp * peakSunHours * performanceRatio * tempFactor;

  const schedule = [];
  let lifetimeKwh = 0;
  for (let year = 1; year <= years; year += 1) {
    const kwh = year1Kwh * (1 - degradationRate) ** (year - 1);
    lifetimeKwh += kwh;
    schedule.push({ year, energyKwh: round(kwh, 2) });
  }

  return build({
    basis: 'NOCT cell-temperature model Tc = Tamb + (NOCT-20)/800*G, with E = Pdc * H * PR * '
      + '(1 + gamma*(Tc-25)) and linear annual degradation',
    output: {
      systemSizeKwp,
      annualIrradiationKwhPerM2,
      ambientTempC,
      cellTemperatureC: round(cellTempC, 2),
      temperatureDerateFactor: round(tempFactor, 4),
      temperatureLossPercent: round(temperatureLossFraction * 100, 2),
      performanceRatio,
      year1EnergyKwh: round(year1Kwh, 2),
      year1SpecificYieldKwhPerKwp: round(year1Kwh / systemSizeKwp, 2),
      finalYearEnergyKwh: round(schedule[schedule.length - 1].energyKwh, 2),
      lifetimeEnergyKwh: round(lifetimeKwh, 2),
      years,
      degradationRate,
      schedule,
    },
    assumptions: {
      irradiationSource: 'CALLER-SUPPLIED. No TMY, satellite or ground-station irradiation feed '
        + 'is connected in this deployment.',
      noctC,
      irradianceWPerM2,
      tempCoefficientPerC,
      performanceRatioNote: 'PR covers soiling, wiring, inverter, mismatch and availability losses '
        + 'as a single lumped factor -- it is not broken down here.',
    },
    warnings: [
      'Annual-energy model. It cannot show seasonal or hourly shape, so it cannot be used to '
      + 'size an inverter clipping ratio or a self-consumption fraction.',
      'Shading losses are not modelled beyond whatever the caller folded into PR.',
    ],
  });
}

/**
 * Battery bank sizing for a required autonomy.
 *
 *   usable = load * autonomy days
 *   nominal = usable / (DoD * round-trip efficiency)
 */
function batterySizing(input = {}) {
  const dailyLoadKwh = num(input.dailyLoadKwh, 'dailyLoadKwh');
  const autonomyDays = num(input.autonomyDays === undefined ? 1 : input.autonomyDays, 'autonomyDays');
  const depthOfDischarge = num(input.depthOfDischarge === undefined ? 0.80 : input.depthOfDischarge, 'depthOfDischarge');
  if (depthOfDischarge <= 0 || depthOfDischarge > 1) {
    throw new InputError('depthOfDischarge must be between 0 and 1');
  }
  const roundTripEfficiency = num(input.roundTripEfficiency === undefined ? 0.90 : input.roundTripEfficiency, 'roundTripEfficiency');
  if (roundTripEfficiency <= 0 || roundTripEfficiency > 1) {
    throw new InputError('roundTripEfficiency must be between 0 and 1');
  }
  const systemVoltageV = num(input.systemVoltageV === undefined ? 48 : input.systemVoltageV, 'systemVoltageV');

  const usableEnergyKwh = dailyLoadKwh * autonomyDays;
  const nominalCapacityKwh = usableEnergyKwh / (depthOfDischarge * roundTripEfficiency);
  const capacityAh = (nominalCapacityKwh * 1000) / systemVoltageV;

  return build({
    basis: 'Autonomy sizing: nominal capacity = load x autonomy / (depth of discharge x round-trip efficiency)',
    output: {
      dailyLoadKwh,
      autonomyDays,
      usableEnergyRequiredKwh: round(usableEnergyKwh, 3),
      nominalCapacityKwh: round(nominalCapacityKwh, 3),
      systemVoltageV,
      nominalCapacityAh: round(capacityAh, 2),
      depthOfDischarge,
      roundTripEfficiency,
    },
    assumptions: {
      temperatureDerating: 'None applied. Lead-acid loses roughly 1%/degC of capacity below '
        + '25 degC and a cold site needs a larger bank than this.',
      ageing: 'Beginning-of-life capacity. Size for end-of-life by adding the chemistry\'s '
        + 'retention loss over the design term.',
      chargeController: 'Not sized here.',
    },
    warnings: [
      'Energy sizing only. Peak power draw, C-rate limits and inverter surge are not checked, '
      + 'and any of them can govern the bank size over autonomy.',
    ],
  });
}

module.exports = {
  optimalTilt, rowSpacing, annualYield, batterySizing,
};
