/**
 * Pest Management Engine — real IPM (Integrated Pest Management) data for
 * India's major field/vegetable pests, cross-referenced against the crops
 * in knowledge/india_crops_catalogue.json.
 *
 * Fills the M053 (pest_management) gap identified 2026-09-24: that module
 * was a generic CRUD scaffold with no backing domain knowledge anywhere in
 * the codebase (unlike crop_diseases, which M782 already covers). This is
 * the first real implementation, not a rewrite of something duplicated
 * elsewhere.
 *
 * Scope: major, well-documented pests for the catalogue's 20 crops — not
 * exhaustive (matches the disease library's own scope of major cards, not
 * every possible pest), but real IPM content: economic threshold levels,
 * monitoring method, and cultural/biological/chemical controls in that
 * priority order (IPM doctrine: escalate to chemical only past threshold).
 */
'use strict';

const catalogue = require('./knowledge/india_crops_catalogue.json');

const PEST_DISCLAIMER =
  'Field-scouting judgment and state agricultural extension guidance take precedence. ' +
  'Chemical control listed last by IPM design — confirm current CIBRC label and pre-harvest interval before use.';

const PEST_LIBRARY = Object.freeze([
  {
    id: 'fruit_borer_helicoverpa',
    name: 'Fruit borer (Helicoverpa armigera)',
    crops: ['tomato', 'chilli', 'cotton'],
    signs: ['round entry holes in fruit/boll', 'frass at hole', 'larvae inside fruit'],
    economic_threshold: '1 larva or 5% damaged fruit per plant on 20-plant scout',
    monitoring: 'Pheromone traps (5/acre), weekly larval count on 20 plants',
    control_cultural: ['deep summer ploughing to expose pupae', 'marigold trap crop border', 'timely sowing to avoid peak moth flight'],
    control_biological: ['Trichogramma chilonis egg parasitoid release', 'NPV (nuclear polyhedrosis virus) spray at early instar', 'Bt (Bacillus thuringiensis) formulations'],
    control_chemical: ['label-approved emamectin benzoate or indoxacarb only past ET, rotate mode of action'],
  },
  {
    id: 'whitefly_bemisia',
    name: 'Whitefly (Bemisia tabaci)',
    crops: ['tomato', 'chilli', 'cotton', 'okra'],
    signs: ['yellowing', 'sooty mould from honeydew', 'leaf curl virus vector'],
    economic_threshold: '8-10 adults per leaf (top 3 leaves), or visible leaf curl symptoms',
    monitoring: 'Yellow sticky traps (10-12/acre), leaf-turn count twice weekly',
    control_cultural: ['reflective silver mulch', 'remove alternate weed hosts', 'avoid excess nitrogen (attracts whitefly)'],
    control_biological: ['Encarsia formosa parasitoid', 'neem oil / azadirachtin 1500 ppm spray'],
    control_chemical: ['label-approved diafenthiuron or spiromesifen only past ET, never repeat same mode of action'],
  },
  {
    id: 'stem_borer_rice',
    name: 'Yellow stem borer (Scirpophaga incertulas)',
    crops: ['paddy'],
    signs: ['dead heart in vegetative stage', 'whitehead panicle at reproductive stage'],
    economic_threshold: '5% dead hearts or 1 egg mass per m2',
    monitoring: 'Light traps for moth flight, weekly hill count for dead heart/whitehead',
    control_cultural: ['synchronous transplanting', 'balanced N (split doses)', 'clip seedling tips before transplant to remove egg masses'],
    control_biological: ['Trichogramma japonicum release at egg stage'],
    control_chemical: ['label-approved cartap hydrochloride or chlorantraniliprole granules only past ET'],
  },
  {
    id: 'aphids_general',
    name: 'Aphids (Aphis gossypii / Myzus persicae)',
    crops: ['cotton', 'chilli', 'potato', 'wheat', 'mustard'],
    signs: ['curled/distorted leaves', 'honeydew and sooty mould', 'colonies on shoot tips'],
    economic_threshold: '10-15 aphids per shoot tip on 20% plants',
    monitoring: 'Visual scouting of terminal shoots twice weekly',
    control_cultural: ['yellow sticky traps', 'avoid excess nitrogen', 'intercrop with coriander/dill to attract predators'],
    control_biological: ['conserve ladybird beetle and lacewing populations', 'neem oil spray'],
    control_chemical: ['label-approved thiamethoxam or flonicamid only past ET, never on flowering crop during pollinator activity'],
  },
  {
    id: 'pink_bollworm',
    name: 'Pink bollworm (Pectinophora gossypiella)',
    crops: ['cotton'],
    signs: ['rosette flowers', 'boll with pink larvae inside', 'seed damage/lint staining'],
    economic_threshold: '8-10 moths/trap/night for 3 consecutive nights, or 5% damaged bolls',
    monitoring: 'Pheromone traps (5/acre) from 45 days after sowing',
    control_cultural: ['destroy crop residue post-harvest', 'avoid ratoon/extra-long-season cotton', 'timely termination of crop'],
    control_biological: ['Trichogramma release', 'mating disruption pheromone dispensers in high-risk zones'],
    control_chemical: ['label-approved profenofos rotation only past ET; resistance management mandatory (rotate MoA groups)'],
  },
  {
    id: 'fall_armyworm',
    name: 'Fall armyworm (Spodoptera frugiperda)',
    crops: ['maize'],
    signs: ['window-pane leaf feeding', 'frass in whorl', 'ragged leaf edges'],
    economic_threshold: '5% plants with fresh damage at whorl stage (2-6 leaf)',
    monitoring: 'Pheromone traps + weekly whorl inspection of 20 plants',
    control_cultural: ['early sowing to escape peak infestation', 'intercrop with legumes', 'destroy volunteer maize/grass hosts'],
    control_biological: ['Bt maize where approved', 'Trichogramma release', 'neem-based formulations at early instar'],
    control_chemical: ['label-approved spinetoram or emamectin benzoate directed into whorl only past ET'],
  },
  {
    id: 'thrips_general',
    name: 'Thrips (Thrips palmi / Scirtothrips dorsalis)',
    crops: ['chilli', 'onion', 'cotton', 'mango'],
    signs: ['silvery streaks on leaves', 'upward leaf curling', 'chilli leaf curl complex vector'],
    economic_threshold: '2 thrips per leaf/flower on 20% plants',
    monitoring: 'Blue sticky traps, leaf/flower shake count weekly',
    control_cultural: ['avoid water stress', 'remove crop residue', 'border crop of maize/sorghum as barrier'],
    control_biological: ['predatory mites (Amblyseius spp.)', 'neem oil / azadirachtin spray'],
    control_chemical: ['label-approved fipronil or spinosad only past ET, avoid during flowering'],
  },
  {
    id: 'late_blight_vector_note',
    name: 'Colorado potato beetle & tuber moth (Phthorimaea operculella)',
    crops: ['potato'],
    signs: ['defoliation from beetle adults/larvae', 'tuber moth mines in leaves and stored tubers'],
    economic_threshold: '1 beetle egg mass per plant; any tuber moth mining in storage',
    monitoring: 'Weekly foliage scouting; pheromone traps for tuber moth in store',
    control_cultural: ['deep earthing-up to prevent tuber exposure', 'destroy volunteer potato plants', 'clean seed tubers'],
    control_biological: ['Bt formulations for larvae', 'straw mulch in storage to reduce moth access'],
    control_chemical: ['label-approved spinosad for foliage only past ET; fumigation only by licensed operator for stored tubers'],
  },
]);

function pestsForCrop(cropId) {
  const id = String(cropId || '').toLowerCase();
  return PEST_LIBRARY.filter((p) => p.crops.includes(id));
}

function listAllPests() {
  return PEST_LIBRARY.map((p) => ({ id: p.id, name: p.name, crops: p.crops }));
}

/**
 * Real pest-risk assessment for a crop, optionally narrowed by observed signs.
 * Deterministic keyword matching against documented signs — same honesty
 * standard as the disease analyzer: this is `inferred`, not a lab result.
 */
function assessPestRisk(input = {}) {
  const cropId = String(input.crop || '').toLowerCase();
  const profile = catalogue.crop_profiles.find((p) => p.id === cropId);
  const candidates = pestsForCrop(cropId);
  const observedText = String(input.description || input.signs || '').toLowerCase();

  const scored = candidates.map((p) => {
    const matchedSigns = p.signs.filter((s) => observedText.includes(s.toLowerCase().split(' ')[0]));
    return { ...p, matched_signs: matchedSigns, sign_match_count: matchedSigns.length };
  }).sort((a, b) => b.sign_match_count - a.sign_match_count);

  return {
    engine: 'PestManagementEngine',
    crop: cropId || null,
    crop_known: !!profile,
    candidate_count: candidates.length,
    candidates: scored,
    disclaimer: PEST_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  PEST_LIBRARY,
  PEST_DISCLAIMER,
  pestsForCrop,
  listAllPests,
  assessPestRisk,
};
