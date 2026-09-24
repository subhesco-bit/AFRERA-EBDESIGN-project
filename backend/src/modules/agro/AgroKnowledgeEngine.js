/**
 * Agro Knowledge Engine — regional India crop calendar, traditional practices,
 * soil-season logic, integrated pest folklore (evidence-graded).
 * Separate module from nutrition; same Grok-tier depth benchmark.
 */

const { randomUUID } = require('crypto');

const AGRO_DISCLAIMER =
  'Agro guidance is educational decision-support for farm planning. It is not a substitute for local extension officers, soil lab reports, or licensed agronomists. Pesticide and fertilizer actions must follow label law.';

const RABI_KHARIF = {
  kharif: {
    months: [6, 7, 8, 9, 10],
    label: 'Kharif (monsoon)',
    crops_pan: ['paddy', 'maize', 'cotton', 'soybean', 'groundnut', 'pigeon_pea', 'sorghum'],
  },
  rabi: {
    months: [11, 12, 1, 2, 3],
    label: 'Rabi (winter)',
    crops_pan: ['wheat', 'mustard', 'gram', 'barley', 'peas', 'potato'],
  },
  zaid: {
    months: [3, 4, 5],
    label: 'Zaid (summer short)',
    crops_pan: ['moong', 'vegetables', 'watermelon', 'cucumber'],
  },
};

const REGIONAL_SYSTEMS = [
  {
    id: 'indo_gangetic_rice_wheat',
    states: ['up', 'uttar pradesh', 'punjab', 'haryana', 'bihar', 'west bengal'],
    system: 'Rice–wheat rotation dominant',
    issues: ['groundwater in NW', 'residue burning pressure', 'zinc deficiency pockets'],
    practices: ['happy seeder / residue management', 'legume break', 'soil test NPK Zn'],
  },
  {
    id: 'arid_rainfed_millet',
    states: ['rajasthan', 'rj', 'gujarat dry'],
    system: 'Millet–pulse–livestock integrated',
    issues: ['rainfall variability', 'soil organic carbon'],
    practices: ['bajra/jowar', 'in-situ moisture', 'agroforestry khejri'],
  },
  {
    id: 'deccan_cotton_soy',
    states: ['maharashtra', 'mh', 'telangana', 'ts', 'madhya pradesh', 'mp'],
    system: 'Cotton / soybean / pigeon pea',
    issues: ['bollworm pressure', 'dry spells'],
    practices: ['IPM', 'intercropping', 'protective irrigation'],
  },
  {
    id: 'coastal_rice_horticulture',
    states: ['kerala', 'kl', 'goa', 'coastal karnataka', 'andhra coastal'],
    system: 'Rice + coconut/spices/horticulture',
    issues: ['salinity pockets', 'high humidity disease'],
    practices: ['drainage', 'fungal vigilance', 'diversified homestead'],
  },
  {
    id: 'northeast_jhum_settle',
    states: ['nagaland', 'manipur', 'meghalaya', 'mizoram', 'arunachal'],
    system: 'Hill agriculture / settled + jhum legacy',
    issues: ['slope erosion', 'short fallow'],
    practices: ['terrace', 'agroforestry', 'soil cover'],
  },
  {
    id: 'southern_millet_pulse',
    states: ['tamil nadu', 'tn', 'karnataka', 'ka', 'andhra', 'ap'],
    system: 'Millets, pulses, rice belts mixed',
    issues: ['tank irrigation dependence', 'heat'],
    practices: ['crop diversification', 'micro-irrigation', 'seed systems'],
  },
];

const TRADITIONAL_AGRO = [
  { id: 'neem_seed_pest', name: 'Neem seed kernel extract folklore/IPM adjunct', evidence: 'moderate', caution: 'Not sole control in outbreak' },
  { id: 'crop_rotation_legume', name: 'Cereal–legume rotation', evidence: 'strong', caution: 'Match market and soil' },
  { id: 'farmyard_manure', name: 'FYM / compost organic matter', evidence: 'strong', caution: 'Pathogen if uncomposted' },
  { id: 'mixed_cropping', name: 'Mixed / intercropping risk spread', evidence: 'moderate', caution: 'Mechanisation constraints' },
  { id: 'moon_sowing_folk', name: 'Lunar sowing folklore', evidence: 'traditional_only', caution: 'Do not override weather-soil science' },
];

function currentSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  if (RABI_KHARIF.kharif.months.includes(m)) return { id: 'kharif', ...RABI_KHARIF.kharif };
  if (RABI_KHARIF.zaid.months.includes(m) && m >= 3 && m <= 5) return { id: 'zaid', ...RABI_KHARIF.zaid };
  return { id: 'rabi', ...RABI_KHARIF.rabi };
}

function matchRegional(location = {}) {
  const state = String(location.state || '').toLowerCase();
  return REGIONAL_SYSTEMS.filter((r) => r.states.some((s) => state.includes(s) || s.includes(state)));
}

function runAgroConference(input = {}) {
  const location = input.location || {};
  const season = currentSeason(input.as_of ? new Date(input.as_of) : new Date());
  const regional = matchRegional(location);
  const soil = input.soil || {};
  const crop_focus = input.crop_focus || null;

  const seats = {
    chair_agronomist: {
      seat: 'Agronomist Chair',
      season,
      summary: `${season.label}; regional matches: ${regional.map((r) => r.id).join(', ') || 'pan-India generic'}`,
    },
    soil_fertility: {
      seat: 'Soil & Fertility',
      input: soil,
      guidance: soil.tested
        ? 'Use lab NPK and micronutrient recommendations; do not blanket-dose'
        : 'Prioritise soil testing before heavy fertilizer spend',
      organic: 'FYM/compost to rebuild carbon where depleted',
    },
    crop_calendar: {
      seat: 'Crop Calendar',
      season_crops: season.crops_pan,
      focus: crop_focus,
      note: 'Local variety and date windows beat generic lists',
    },
    regional_systems: {
      seat: 'Regional Farming Systems',
      matched: regional,
    },
    ipm_traditional: {
      seat: 'IPM + Traditional Knowledge',
      practices: TRADITIONAL_AGRO,
      policy: 'Evidence-graded; traditional_only never blocks science-based outbreak response',
    },
    water_irrigation: {
      seat: 'Water & Irrigation',
      notes: [
        'Match method to water availability',
        'Avoid over-irrigation in heavy soils',
        'Mulch and scheduling beat pure hardware buys',
      ],
    },
    market_risk: {
      seat: 'Market & Risk',
      notes: ['Diversify where possible', 'Storage and quality affect price more than max yield alone'],
    },
  };

  return {
    case_id: randomUUID(),
    engine: 'AgroKnowledgeEngine',
    engine_tier: 'grok-highest',
    specialist_seats: seats,
    season,
    regional_systems: regional,
    traditional_practices: TRADITIONAL_AGRO,
    panel_summary: `Agro conference: ${season.label}. ${regional.length ? regional[0].system : 'Generic Indian seasonal advice'}. Soil test ${soil.tested ? 'on file' : 'recommended'}.`,
    disclaimer: AGRO_DISCLAIMER,
    provenance: {
      rules_fired: ['kharif_rabi_zaid', 'regional_system_match', 'traditional_evidence_grade'],
      related_modules: ['agricultural_intelligence_routes', 'rituraj_nutrition'],
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  runAgroConference,
  currentSeason,
  matchRegional,
  RABI_KHARIF,
  REGIONAL_SYSTEMS,
  TRADITIONAL_AGRO,
  AGRO_DISCLAIMER,
};
