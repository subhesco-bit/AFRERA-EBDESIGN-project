/**
 * Organic certification — India NPOP, PGS-India, FSSAI link + international frames
 * Educational decision-support. Certification Bodies and APEDA are authorities.
 */

const { randomUUID } = require('crypto');

const CERT_DISCLAIMER =
  'Organic certification guidance is educational. NPOP/PGS rules, Conversion Periods, and logos are governed by APEDA / MoA&FW / accredited CBs / FSSAI. International schemes (EU Organic, USDA NOP, JAS) have their own competent authorities. This module does not issue certificates.';

const SCHEMES = {
  NPOP: {
    id: 'NPOP',
    name: 'National Programme for Organic Production',
    authority: 'APEDA (Ministry of Commerce) + accredited Certification Bodies',
    logo: 'India Organic',
    market: ['India formal retail', 'Export (EU equivalence pathways and others as notified)'],
    inspection: 'Third-party accredited CB',
    typical_cost_inr_annual: '15000-40000 depending on area/CB',
    conversion: {
      annual_biennial_years: 2,
      perennial_years: 3,
      note: 'CB may extend/reduce; PGS history may support derogation with documentation per NPOP standards',
    },
    steps: [
      'Select APEDA-accredited Certification Body',
      'Apply with farm map, crops, 3-year input history',
      'Prepare Organic System Plan (OSP): rotation, fertility, pest, buffer, storage, traceability',
      'Document review by CB',
      'On-site inspection; possible residue sampling',
      'Corrective actions for non-compliances',
      'Certificate + India Organic logo authorisation',
      'Annual renewal inspection',
      'Traceability systems (e.g. Tracenet ecosystem as notified)',
    ],
    prohibited_inputs_theme: [
      'Synthetic NPK as fertility mainstay',
      'Most synthetic pesticides/herbicides',
      'Sewage sludge',
      'GMOs',
      'Ionising radiation for food (scheme-specific)',
    ],
    allowed_themes: [
      'Organic manures, compost, green manure',
      'Registered biofertilizers / biocontrol where permitted',
      'Botanicals and minerals on positive lists',
      'Mechanical and cultural pest control',
    ],
  },
  PGS_INDIA: {
    id: 'PGS_INDIA',
    name: 'Participatory Guarantee System — India',
    authority: 'Ministry of Agriculture & Farmers Welfare; PGS portal registration',
    logo: 'PGS Green (conversion) / PGS Organic',
    market: ['Domestic local markets', 'Select retail', 'Not primary export credential'],
    inspection: 'Peer review by local farmer group (min ~5 farmers)',
    typical_cost_inr_annual: 'Often free / low group cost',
    conversion: {
      levels: ['PGS Green under conversion', 'PGS Organic fully converted'],
      note: 'Clock starts at registration; can later support NPOP pathways with records',
    },
    steps: [
      'Form/join local PGS group; elect secretary',
      'Register on PGS-India portal',
      'Farm diary and peer inspections',
      'Internal approval → PGS Green or Organic status',
      'Maintain continuous records for upgrade to NPOP if desired',
    ],
  },
  FSSAI_ORGANIC: {
    id: 'FSSAI_ORGANIC',
    name: 'FSSAI organic claim framework',
    authority: 'FSSAI',
    note: 'Selling organic food in India requires valid NPOP or PGS certification plus FSSAI licensing/labelling compliance',
    steps: ['Hold NPOP or PGS certificate', 'FSSAI registration/licence as applicable', 'Label claims only as permitted'],
  },
  EU_ORGANIC: {
    id: 'EU_ORGANIC',
    name: 'EU Organic (Regulation framework)',
    authority: 'EU Member State competent authorities / recognised control bodies',
    market: ['EU'],
    india_link: 'NPOP equivalence / recognition pathways as currently notified — verify APEDA circulars',
    conversion_theme: 'Typically 2 years annual / 3 years perennial (confirm current EU text)',
  },
  USDA_NOP: {
    id: 'USDA_NOP',
    name: 'USDA National Organic Program',
    authority: 'USDA AMS + accredited certifiers',
    market: ['United States'],
    india_link: 'Separate NOP certification or import arrangements; not automatic via NPOP alone — verify current trade rules',
  },
  JAS: {
    id: 'JAS',
    name: 'Japan Agricultural Standards (Organic)',
    authority: 'MAFF Japan / registered certifying bodies',
    market: ['Japan'],
    india_link: 'Independent compliance or recognition as applicable',
  },
};

function recommendScheme(input = {}) {
  const exportTarget = String(input.export_target || '').toLowerCase();
  const scale = String(input.scale || 'small').toLowerCase();
  const domestic_only = !!input.domestic_only;

  if (exportTarget.includes('us') || exportTarget.includes('nop')) {
    return {
      primary: 'USDA_NOP',
      secondary: ['NPOP'],
      rationale: 'US market needs NOP pathway; NPOP alone is not automatic US entry',
    };
  }
  if (exportTarget.includes('eu') || exportTarget.includes('europe')) {
    return {
      primary: 'NPOP',
      secondary: ['EU_ORGANIC'],
      rationale: 'NPOP is India export organic backbone; confirm current EU equivalence/circulars with CB',
    };
  }
  if (exportTarget.includes('japan') || exportTarget.includes('jas')) {
    return { primary: 'JAS', secondary: ['NPOP'], rationale: 'Japan JAS organic pathway' };
  }
  if (domestic_only || scale === 'small' || scale === 'marginal') {
    return {
      primary: 'PGS_INDIA',
      secondary: ['NPOP'],
      rationale: 'PGS is lower-cost domestic peer system; graduate to NPOP for formal retail/export',
    };
  }
  return {
    primary: 'NPOP',
    secondary: ['PGS_INDIA', 'FSSAI_ORGANIC'],
    rationale: 'Commercial/export-oriented default under India Organic logo',
  };
}

function runCertificationConference(input = {}) {
  const rec = recommendScheme(input);
  const primary = SCHEMES[rec.primary] || SCHEMES.NPOP;
  const checklist = [
    'Map fields and buffer zones',
    '3-year input and crop history',
    'Organic System Plan / farm diary',
    'Seed and input organic status records',
    'Storage and parallel production controls if any conventional',
    'Sales and lot traceability',
  ];

  const conversion = {
    ...primary.conversion,
    chemical_history: input.chemical_history !== false,
    estimated_status: input.already_pgs
      ? 'May seek conversion derogation documentation under NPOP rules with valid PGS proof — CB decides'
      : input.chemical_history === false
        ? 'Virgin/no-chemical claims still need CB documentary proof'
        : 'Expect full conversion clock unless CB grants documented derogation',
  };

  return {
    case_id: randomUUID(),
    engine: 'OrganicCertificationEngine',
    engine_tier: 'grok-highest',
    recommendation: rec,
    primary_scheme: primary,
    all_schemes: SCHEMES,
    conversion,
    readiness_checklist: checklist,
    decision: {
      action: `PURSUE_${rec.primary}_VIA_OFFICIAL_CHANNEL`,
      platform_issues_certificate: false,
      next: 'Contact accredited CB (NPOP) or register PGS group — not this API',
    },
    panel_summary: `Recommend ${rec.primary}: ${rec.rationale}`,
    disclaimer: CERT_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  SCHEMES,
  recommendScheme,
  runCertificationConference,
  CERT_DISCLAIMER,
};
