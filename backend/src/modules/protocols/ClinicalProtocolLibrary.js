/**
 * Clinical Protocol Library — human + veterinary + One Health
 * Every major protocol family — not zoonoses alone.
 * Decision-support checklists; licensed professionals execute care.
 */

const PROTOCOLS = [
  // ---- Emergency ----
  {
    id: 'human_emergency_chest_neuro',
    domain: 'human',
    category: 'emergency',
    name: 'Chest pain / stroke / severe dyspnea red flags',
    triggers: ['chest pain', 'stroke signs', 'severe breathlessness', 'unconscious'],
    steps: ['Call local emergency number', 'Do not drive self if unstable', 'Aspirin only if prior clinician advice for cardiac protocol'],
    escalate: 'EMERGENCY_SERVICES',
  },
  {
    id: 'human_anaphylaxis',
    domain: 'human',
    category: 'emergency',
    name: 'Anaphylaxis',
    triggers: ['anaphylaxis', 'throat swelling', 'severe allergy'],
    steps: ['Emergency services', 'Epinephrine autoinjector if prescribed', 'Supine legs elevated if no breathing compromise'],
    escalate: 'EMERGENCY_SERVICES',
  },
  {
    id: 'vet_emergency_notifiable',
    domain: 'veterinary',
    category: 'emergency',
    name: 'Suspect notifiable livestock disease',
    triggers: ['fmd', 'asf', 'avian influenza', 'anthrax', 'ppr cluster'],
    steps: ['Isolate', 'Stop movement', 'Contact veterinarian + competent authority', 'No carcass opening if anthrax suspect'],
    escalate: 'VET_AND_AUTHORITY',
  },
  {
    id: 'vet_emergency_bloat_gd',
    domain: 'veterinary',
    category: 'emergency',
    name: 'Ruminant bloat / canine GDV-like collapse',
    triggers: ['bloat', 'distended abdomen', 'unproductive retching dog'],
    steps: ['Emergency veterinarian immediately', 'Do not home-puncture'],
    escalate: 'EMERGENCY_VET',
  },
  // ---- Infection / AMS ----
  {
    id: 'ams_human',
    domain: 'human',
    category: 'antimicrobial_stewardship',
    name: 'Human antimicrobial stewardship',
    triggers: ['antibiotic', 'fever infection'],
    steps: ['No leftover antibiotics', 'Culture-directed when possible', 'Complete prescribed course', 'Return if worsening 48–72h'],
    escalate: 'PRESCRIBER',
  },
  {
    id: 'ams_veterinary_food_animal',
    domain: 'veterinary',
    category: 'antimicrobial_stewardship',
    name: 'Food-animal antimicrobial & withdrawal',
    triggers: ['livestock antibiotic', 'withdrawal'],
    steps: ['Vet diagnosis', 'Label dose', 'Record withdrawal milk/meat/eggs', 'No human pharmacy leftovers'],
    escalate: 'VETERINARIAN',
  },
  // ---- Zoonoses (subset of infection) ----
  {
    id: 'zoonosis_rabies_exposure',
    domain: 'one_health',
    category: 'zoonosis',
    name: 'Rabies exposure protocol',
    triggers: ['animal bite', 'rabies', 'bat exposure'],
    steps: ['Wash wound 15 min soap water', 'Urgent medical care for PEP decision', 'Observe/vaccinate animal per local rules'],
    escalate: 'HUMAN_MEDICAL_PLUS_VET',
  },
  {
    id: 'zoonosis_avian_influenza',
    domain: 'one_health',
    category: 'zoonosis',
    name: 'Avian influenza farm protocol',
    triggers: ['avian influenza', 'poultry die-off'],
    steps: ['PPE', 'Report authority', 'Restrict movement', 'No unprotected slaughter'],
    escalate: 'AUTHORITY',
  },
  {
    id: 'zoonosis_brucella_anthrax_general',
    domain: 'one_health',
    category: 'zoonosis',
    name: 'Brucella / anthrax handling caution',
    triggers: ['brucella', 'anthrax', 'abortion storm cattle'],
    steps: ['PPE', 'No unpasteurized milk from suspects', 'Official lab pathways'],
    escalate: 'AUTHORITY',
  },
  // ---- Metabolic ----
  {
    id: 'diabetes_sick_day',
    domain: 'human',
    category: 'metabolic',
    name: 'Diabetes sick-day awareness',
    triggers: ['diabetes', 'vomiting', 'fever diabetic'],
    steps: ['Do not stop all meds blindly', 'Hydration', 'Ketone check if instructed', 'Contact diabetes team if persistent vomiting'],
    escalate: 'DIABETES_TEAM',
  },
  {
    id: 'hypoglycaemia',
    domain: 'human',
    category: 'metabolic',
    name: 'Hypoglycaemia',
    triggers: ['hypoglycaemia', 'low sugar symptoms'],
    steps: ['Fast carbohydrate if conscious', 'Glucagon if prescribed and unconscious — emergency services', 'Review cause with clinician'],
    escalate: 'EMERGENCY_IF_SEVERE',
  },
  {
    id: 'vet_milk_fever_ketosis',
    domain: 'veterinary',
    category: 'metabolic',
    name: 'Periparturient metabolic (milk fever / ketosis)',
    triggers: ['milk fever', 'ketosis', 'downer cow'],
    steps: ['Veterinary treatment protocols', 'Do not force oral calcium in recumbent without guidance'],
    escalate: 'VETERINARIAN',
  },
  // ---- Chronic ----
  {
    id: 'hypertension_home',
    domain: 'human',
    category: 'chronic',
    name: 'Hypertension home monitoring pattern',
    triggers: ['hypertension', 'high bp'],
    steps: ['Validated cuff', 'Seated rest 5 min', 'Log readings', 'Medication adherence', 'Emergency if chest pain/neuro'],
    escalate: 'CLINICIAN',
  },
  {
    id: 'asthma_action_outline',
    domain: 'human',
    category: 'chronic',
    name: 'Asthma worsening outline',
    triggers: ['asthma attack', 'wheeze severe'],
    steps: ['Reliever as prescribed action plan', 'Emergency if no response / speaking difficulty'],
    escalate: 'EMERGENCY_IF_SEVERE',
  },
  // ---- Maternal / pediatric flags ----
  {
    id: 'pregnancy_danger',
    domain: 'human',
    category: 'maternal',
    name: 'Pregnancy danger signs',
    triggers: ['pregnancy bleeding', 'severe headache pregnancy', 'reduced fetal movement'],
    steps: ['Urgent obstetric care', 'Do not delay'],
    escalate: 'OBSTETRIC_EMERGENCY',
  },
  {
    id: 'pediatric_danger',
    domain: 'human',
    category: 'pediatric',
    name: 'Child danger signs',
    triggers: ['infant fever', 'lethargy child', 'poor feeding infant'],
    steps: ['Urgent pediatric assessment', 'Do not give aspirin'],
    escalate: 'PEDIATRIC_CARE',
  },
  // ---- Mental health crisis ----
  {
    id: 'mental_health_crisis',
    domain: 'human',
    category: 'mental_health',
    name: 'Suicidal ideation / acute mental health crisis',
    triggers: ['suicide', 'want to die', 'self harm plan'],
    steps: ['Contact local emergency / crisis line immediately', 'Do not leave person alone if safe to stay'],
    escalate: 'CRISIS_SERVICES',
  },
  // ---- Nutrition clinical ----
  {
    id: 'refeeding_risk',
    domain: 'human',
    category: 'nutrition_clinical',
    name: 'Refeeding risk awareness',
    triggers: ['severe underweight', 'anorexia', 'prolonged starvation'],
    steps: ['Specialist nutrition/medical supervision', 'Do not aggressive refeed at home'],
    escalate: 'SPECIALIST',
  },
  // ---- Agro / farm biosecurity ----
  {
    id: 'farm_biosecurity_entry',
    domain: 'agro',
    category: 'biosecurity',
    name: 'Farm entry biosecurity',
    triggers: ['farm visit', 'new animals'],
    steps: ['Quarantine new stock', 'Disinfect footwear', 'Visitor log', 'Separate equipment'],
    escalate: 'FARM_MANAGER_VET',
  },
  {
    id: 'deadstock_disposal',
    domain: 'veterinary',
    category: 'biosecurity',
    name: 'Deadstock handling',
    triggers: ['carcass', 'sudden death livestock'],
    steps: ['Protective gear', 'Local disposal rules', 'Anthrax: do not open'],
    escalate: 'AUTHORITY_IF_SUSPECT',
  },
];

function matchProtocols({ text = '', domain, category } = {}) {
  const blob = String(text).toLowerCase();
  return PROTOCOLS.filter((p) => {
    if (domain && p.domain !== domain && p.domain !== 'one_health') return false;
    if (category && p.category !== category) return false;
    return (p.triggers || []).some((t) => blob.includes(String(t).toLowerCase())) || !text;
  });
}

function listByCategory() {
  const map = {};
  for (const p of PROTOCOLS) {
    map[p.category] = map[p.category] || [];
    map[p.category].push({ id: p.id, name: p.name, domain: p.domain });
  }
  return map;
}

module.exports = {
  PROTOCOLS,
  matchProtocols,
  listByCategory,
  categories: [...new Set(PROTOCOLS.map((p) => p.category))],
};
