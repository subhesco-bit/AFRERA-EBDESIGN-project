/**
 * Farming Systems Engine — same depth tier as vet/legal modules
 * Modes: home garden, roof garden, greenhouse, climate-controlled, open field
 */

const { randomUUID } = require('crypto');

const FARM_DISCLAIMER =
  'Farming systems guidance is educational decision-support. Not a substitute for local extension, structural engineering (roof load), licensed pesticide advice, or certified greenhouse design. Structural and electrical safety for roof/greenhouse is owner responsibility.';

const SYSTEMS = {
  home_garden: {
    id: 'home_garden',
    name: 'Home / kitchen gardening',
    scale: 'household',
    typical_crops: ['tomato', 'chilli', 'coriander', 'spinach', 'methi', 'okra', 'brinjal', 'mint'],
    soil_media: ['garden soil + compost', 'raised beds'],
    water: 'Can / drip bottle; morning irrigation preferred',
    risks: ['pet contamination', 'overwatering', 'shade deficit'],
    ai_focus: ['leaf yellowing', 'pest holes', 'spacing'],
  },
  roof_garden: {
    id: 'roof_garden',
    name: 'Roof / terrace gardening',
    scale: 'urban',
    typical_crops: ['leafy greens', 'tomato', 'chilli', 'herbs', 'strawberry_container', 'dwarf_citrus_pot'],
    soil_media: ['lightweight potting mix', 'cocopeat + compost + perlite', 'grow bags'],
    structure_critical: [
      'Verify terrace load capacity with civil engineer before soil beds',
      'Waterproofing membrane integrity',
      'Drainage to prevent seepage into building',
      'Wind exposure and pot anchoring',
      'Child/pet fall safety parapet',
    ],
    water: 'Drip preferred; avoid flooding waterproof layer',
    risks: ['structural overload', 'heat stress on terrace', 'wind throw', 'drainage block'],
    ai_focus: ['heat stress wilt', 'container root bound', 'drainage'],
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Greenhouse / polyhouse',
    scale: 'commercial_or_serious_hobby',
    typical_crops: ['capsicum', 'cucumber', 'tomato', 'gerbera', 'rose', 'nursery seedlings'],
    structure: ['GI / MS frame', 'UV polyfilm / polycarbonate', 'side vents', 'insect net'],
    climate_targets_indicative: {
      tomato_day_c: [21, 27],
      tomato_night_c: [16, 18],
      humidity_pct: [50, 70],
      note: 'Crop-specific; override with local agronomist',
    },
    risks: ['fungal under high RH', 'whitefly under net failure', 'film degradation UV'],
    ai_focus: ['condensation', 'nutrient deficiency colour', 'pest on underside leaf'],
  },
  climate_controlled: {
    id: 'climate_controlled',
    name: 'Climate-controlled / protected farming (pad-fan, HVAC, sensors)',
    scale: 'high_tech',
    subsystems: ['temperature', 'humidity', 'CO2_optional', 'light_supplement', 'fertigation'],
    control_loops: [
      { param: 'temperature', sensors: ['dry_bulb'], actuators: ['pad_fan', 'fogger', 'heater', 'shade_net'] },
      { param: 'humidity', sensors: ['RH'], actuators: ['fogger', 'vent', 'dehumidifier_rare'] },
      { param: 'irrigation', sensors: ['soil_moisture', 'EC', 'pH'], actuators: ['drip_fertigation'] },
    ],
    setpoints_policy: 'Never hard-code lethal ranges; use crop recipe + alarm bands',
    risks: ['sensor drift', 'power failure', 'EC burn', 'over-fogging disease'],
    ai_focus: ['sensor anomaly', 'stress pattern from images + telemetry'],
  },
  open_farming: {
    id: 'open_farming',
    name: 'Open-field farming',
    scale: 'field',
    typical_systems: ['kharif_rabi', 'rainfed', 'irrigated', 'orchard'],
    risks: ['monsoon failure', 'hail', 'market price', 'pest outbreaks', 'soil degradation'],
    ai_focus: ['stand density', 'weed pressure', 'deficiency patches', 'lodging'],
  },
};

const CROP_RECIPES_INDIA = [
  {
    crop: 'tomato',
    systems: ['home_garden', 'roof_garden', 'greenhouse', 'open_farming'],
    spacing_cm: [45, 60],
    support: 'staking / trellis',
    common_issues: ['early blight', 'leaf curl virus vector', 'blossom end rot Ca/water'],
  },
  {
    crop: 'leafy_greens',
    systems: ['home_garden', 'roof_garden'],
    spacing_cm: [10, 20],
    support: 'none',
    common_issues: ['damping off', 'aphids', 'tip burn'],
  },
  {
    crop: 'capsicum',
    systems: ['greenhouse', 'climate_controlled'],
    spacing_cm: [40, 50],
    support: 'trellis',
    common_issues: ['thrips', 'powdery mildew', 'sunscald if shade sudden'],
  },
  {
    crop: 'cucumber',
    systems: ['greenhouse', 'open_farming', 'roof_garden'],
    spacing_cm: [40, 60],
    support: 'vertical trellis',
    common_issues: ['downy mildew', 'fruit fly open field'],
  },
  {
    crop: 'paddy',
    systems: ['open_farming'],
    spacing_cm: null,
    support: 'none',
    common_issues: ['blast', 'BPH', 'zinc deficiency'],
  },
  {
    crop: 'wheat',
    systems: ['open_farming'],
    spacing_cm: null,
    support: 'none',
    common_issues: ['rust', 'lodging', 'terminal heat'],
  },
];

function normalizeSystem(id) {
  const s = String(id || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (['terrace', 'rooftop', 'roof'].includes(s)) return 'roof_garden';
  if (['polyhouse', 'poly_house', 'gh'].includes(s)) return 'greenhouse';
  if (['hvac', 'pad_fan', 'controlled', 'indoor_farm'].includes(s)) return 'climate_controlled';
  if (['field', 'open', 'openfield'].includes(s)) return 'open_farming';
  if (['kitchen', 'home', 'garden', 'backyard'].includes(s)) return 'home_garden';
  return SYSTEMS[s] ? s : 'home_garden';
}

function climateAdvice(systemId, telemetry = {}) {
  const t = telemetry.temperature_c;
  const rh = telemetry.humidity_pct;
  const actions = [];
  if (systemId === 'greenhouse' || systemId === 'climate_controlled') {
    if (t != null && t > 32) actions.push({ severity: 'high', action: 'Increase ventilation / shade; pad-fan if installed' });
    if (t != null && t < 12) actions.push({ severity: 'high', action: 'Reduce vent; consider heating for sensitive crops' });
    if (rh != null && rh > 85) actions.push({ severity: 'high', action: 'Vent to drop RH — fungal risk' });
    if (rh != null && rh < 35) actions.push({ severity: 'moderate', action: 'Light fogging if crop tolerates; avoid leaf wetness at night' });
  }
  if (systemId === 'roof_garden' && t != null && t > 36) {
    actions.push({ severity: 'high', action: 'Shade cloth 30–50%; extra water early morning; avoid midday transplant' });
  }
  return {
    telemetry,
    actions,
    policy: 'Telemetry without calibrated sensors is advisory only',
  };
}

function runFarmingSystemConference(input = {}) {
  const systemId = normalizeSystem(input.system || input.farming_system);
  const system = SYSTEMS[systemId];
  const crop = String(input.crop || input.crop_focus || '').toLowerCase() || null;
  const recipe = CROP_RECIPES_INDIA.find((c) => crop && (c.crop === crop || crop.includes(c.crop)));
  const climate = climateAdvice(systemId, input.telemetry || {});
  const location = input.location || {};

  const seats = {
    systems_architect: {
      seat: 'Farming Systems Architect',
      system,
      fit: recipe ? `Crop ${recipe.crop} listed for systems: ${recipe.systems.join(', ')}` : 'Select crop for recipe match',
    },
    structure_safety: {
      seat: 'Structure & Safety',
      critical: system.structure_critical || system.structure || ['Follow local building/electrical codes'],
      roof_load_warning: systemId === 'roof_garden',
    },
    climate_control: {
      seat: 'Climate & Environment',
      targets: system.climate_targets_indicative || null,
      loops: system.control_loops || null,
      live: climate,
    },
    crop_agronomy: {
      seat: 'Crop Agronomy',
      recipe: recipe || null,
      media: system.soil_media || null,
      water: system.water || null,
    },
    ipm: {
      seat: 'IPM',
      focus: system.ai_focus || [],
      issues: recipe?.common_issues || [],
      policy: 'Identify before spray; label law; beneficial insects in protected culture',
    },
    economics_ops: {
      seat: 'Operations',
      scale: system.scale,
      notes: ['Labour for training/pruning in GH', 'Sensor calibration schedule for climate rooms'],
    },
  };

  return {
    case_id: randomUUID(),
    engine: 'FarmingSystemsEngine',
    engine_tier: 'grok-highest',
    system_id: systemId,
    specialist_seats: seats,
    climate_advice: climate,
    location,
    panel_summary: `${system.name}: ${climate.actions.length ? climate.actions.map((a) => a.action).join('; ') : 'No telemetry alarms'}. Crop=${crop || 'unspecified'}.`,
    disclaimer: FARM_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  SYSTEMS,
  CROP_RECIPES_INDIA,
  normalizeSystem,
  climateAdvice,
  runFarmingSystemConference,
  FARM_DISCLAIMER,
};
