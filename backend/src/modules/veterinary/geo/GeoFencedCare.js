/**
 * Geo-fenced ancestral / customary / natural / dietary care
 * Scoped to the veterinary module only.
 *
 * Matches case location (state, district, optional lat/lng geofence tags)
 * to regional ethnoveterinary knowledge and dietary notes.
 */

const geoPack = require('../knowledge/geo_ethnovet_india.json');
const carePack = require('../knowledge/natural_dietary_care.json');
const { VETERINARY_CLINICAL_DISCLAIMER, VETERINARY_ETHNOVET_NOTE } = require('../../../utils/disclaimers');

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchRegions(location = {}) {
  const state = norm(location.state);
  const district = norm(location.district);
  const blob = `${state} ${district} ${norm(location.region)} ${norm(location.geo_tag)}`;
  const hits = [];

  for (const region of geoPack.regions || []) {
    const stateHit = (region.states || []).some((st) => {
      const n = norm(st);
      return state === n || state.includes(n) || n.includes(state) || blob.includes(n);
    });
    if (stateHit) hits.push(region);
  }

  // Optional explicit geofence id from client
  if (location.geofence_region_id) {
    const byId = (geoPack.regions || []).find((r) => r.id === location.geofence_region_id);
    if (byId && !hits.find((h) => h.id === byId.id)) hits.push(byId);
  }

  return hits;
}

function filterSpecies(items, species) {
  const sp = String(species || '').toLowerCase();
  return (items || []).filter((it) => !it.species || it.species.includes(sp) || it.species.includes('*'));
}

/**
 * Build geo-local + ancestral + natural + dietary care package for a case.
 */
function buildLocalCarePackage({ species, location = {}, clinical = {}, history = {} }) {
  const regions = matchRegions(location);
  const ancestral = [];
  const dietary_local = [];

  for (const r of regions) {
    for (const p of filterSpecies(r.ancestral_practices, species)) {
      ancestral.push({
        ...p,
        region_id: r.id,
        region_climate: r.climate,
        source: 'geo_ancestral',
      });
    }
    for (const d of filterSpecies(r.dietary_local, species)) {
      dietary_local.push({ ...d, region_id: r.id, source: 'geo_dietary' });
    }
  }

  // Pan-India ancestral always available as fallback layer
  for (const p of filterSpecies(geoPack.pan_india_ancestral, species)) {
    ancestral.push({ ...p, region_id: 'pan_india', source: 'pan_india_ancestral' });
  }

  const natural_pillars = (carePack.natural_care_pillars || []).filter(
    (p) => !p.applies || p.applies.includes(species),
  );

  const dietary_species = carePack.dietary_by_species?.[species] || {
    principles: [],
    convalescent: [],
  };

  // Context hints
  const context_notes = [];
  const weather = norm(history.weather_notes);
  if (/heat|summer|humid/.test(weather)) {
    context_notes.push('Heat/humidity context — prioritise shade, water, cooler-hour feeding');
  }
  if (/monsoon|rain|flood/.test(weather)) {
    context_notes.push('Monsoon context — parasite and HS-season vigilance in ruminants; dry bedding');
  }
  if (clinical.appetite === 'anorexic' || clinical.appetite === 'reduced') {
    context_notes.push('Reduced appetite — convalescent dietary path; rule out systemic disease with vet');
  }

  return {
    geo_match: {
      input: {
        state: location.state || null,
        district: location.district || null,
        geofence_region_id: location.geofence_region_id || null,
      },
      matched_region_ids: regions.map((r) => r.id),
      matched_climates: regions.map((r) => r.climate),
      match_quality: regions.length ? 'regional' : 'pan_india_fallback',
    },
    ancestral_customary_medicine: ancestral,
    dietary_local,
    natural_care: natural_pillars,
    dietary_care: dietary_species,
    context_notes,
    evidence_policy: VETERINARY_ETHNOVET_NOTE,
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    module_scope: 'veterinary_only',
    knowledge_version: `${geoPack.version}+${carePack.version}`,
  };
}

module.exports = {
  matchRegions,
  buildLocalCarePackage,
  GEO_VERSION: geoPack.version,
  CARE_VERSION: carePack.version,
};
