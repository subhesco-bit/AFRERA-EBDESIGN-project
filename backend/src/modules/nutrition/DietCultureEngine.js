/**
 * Diet Culture Engine — superfoods, religious calendars, customary foodways,
 * GenZ patterns, medical diet branches. Integrates with Rituraj conference.
 */

const superfoodsPack = require('./knowledge/india_superfoods.json');
const culturePack = require('./knowledge/religious_customary_genz.json');

function filterSuperfoods({ region, query } = {}) {
  let list = superfoodsPack.superfoods || [];
  if (region) {
    const r = String(region).toLowerCase();
    list = list.filter(
      (s) =>
        (s.regions || []).some((x) => x.includes(r) || r.includes(x)) ||
        (s.regions || []).includes('pan_india'),
    );
  }
  if (query) {
    const q = String(query).toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        (s.nutrients || []).some((n) => n.includes(q)),
    );
  }
  return list;
}

function resolveReligiousCalendar(traditionOrId) {
  const t = String(traditionOrId || '').toLowerCase();
  return (culturePack.religious_calendars || []).filter(
    (c) =>
      c.id.includes(t) ||
      c.tradition.toLowerCase().includes(t) ||
      c.name.toLowerCase().includes(t),
  );
}

function listMedicalBranches() {
  return culturePack.medical_diet_branches || [];
}

function matchMedicalBranches(conditions = []) {
  const blob = conditions.map((c) => String(c).toLowerCase()).join(' ');
  return listMedicalBranches().filter((b) => {
    if (/diabet|sugar|t2dm/.test(blob) && b.id.includes('diabetes')) return true;
    if (/hyperten|bp|blood pressure/.test(blob) && b.id.includes('hypertension')) return true;
    if (/lipid|cholest/.test(blob) && b.id.includes('lipid')) return true;
    if (/thyroid/.test(blob) && b.id.includes('thyroid')) return true;
    if (/anemia|anaemia|iron/.test(blob) && b.id.includes('anemia')) return true;
    if (/pcos/.test(blob) && b.id.includes('pcos')) return true;
    if (/pregnan|lactat/.test(blob) && b.id.includes('pregnancy')) return true;
    if (/kidney|renal|ckd/.test(blob) && b.id.includes('renal')) return true;
    if (/elderly|geriatric/.test(blob) && b.id.includes('geriatric')) return true;
    return false;
  });
}

function buildCultureSeat(input = {}) {
  const {
    tradition,
    community_foodway_id,
    genz_pattern_ids = [],
    conditions = [],
    region,
  } = input;

  const religious = tradition ? resolveReligiousCalendar(tradition) : [];
  const customaryExamples = culturePack.customary_community_foodways || [];
  const genz = (culturePack.genz_patterns || []).filter(
    (g) => !genz_pattern_ids.length || genz_pattern_ids.includes(g.id),
  );
  const medical = matchMedicalBranches(conditions);
  const superfoods = filterSuperfoods({ region }).slice(0, 12);

  return {
    seat: 'Culture · Faith Calendar · Community Foodway · GenZ · Medical Branch',
    ethics: culturePack.ethics,
    religious_calendar_matches: religious,
    customary_foodways: customaryExamples,
    self_described_community_foodway_id: community_foodway_id || null,
    genz_patterns: genz_pattern_ids.length ? genz : (culturePack.genz_patterns || []).slice(0, 4),
    medical_diet_branches: medical.length ? medical : listMedicalBranches().slice(0, 3),
    regional_superfoods: superfoods,
    note: 'Faith and community patterns apply only when user opts in. Never inferred caste.',
  };
}

module.exports = {
  filterSuperfoods,
  resolveReligiousCalendar,
  listMedicalBranches,
  matchMedicalBranches,
  buildCultureSeat,
  SUPERFOODS_VERSION: superfoodsPack.version,
  CULTURE_VERSION: culturePack.version,
  ethics: culturePack.ethics,
};
