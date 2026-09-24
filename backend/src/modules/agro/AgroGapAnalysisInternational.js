/**
 * International agro-AI + organic + microbiome gap analysis
 */

const GAPS = [
  {
    peer: 'Biome Makers BeCrop / AL assistant',
    strength: 'Large DNA reference DB, taxonomic precision, nutrient efficiency, chat assistant',
    afrera: 'Guild indices + multi-lens interpretation + lab JSON ingest',
    remaining: 'Host full sequencing pipeline / vendor partnership',
  },
  {
    peer: 'Trace Genomics / Miraterra / EarthOptics',
    strength: 'DNA + chemistry + sensors + satellite prescriptions',
    afrera: 'Chemistry+biology interpretation; sensor telemetry hooks in climate module',
    remaining: 'Hardware sensor network',
  },
  {
    peer: 'Elaniti / Soilytix',
    strength: 'Predict yield/disease from microbiome',
    afrera: 'Pathogen guild risk + disease cards linked to crop',
    remaining: 'Calibrated yield models on local trials',
  },
  {
    peer: 'India organic (NPOP/PGS apps)',
    strength: 'Scheme education',
    afrera: 'Full NPOP/PGS/FSSAI/EU/NOP/JAS workflow + conversion clocks + decision',
    remaining: 'Live CB directory API from APEDA',
  },
  {
    peer: 'Smartphone spectral soil (SoilPal-class)',
    strength: 'On-device NPK/pH/OC',
    afrera: 'Accept spectral proxy fields in soil analyze',
    remaining: 'Device SDK integration',
  },
  {
    peer: 'Generic farm APKs India',
    strength: 'Mandi + schemes + weather UX',
    afrera: 'Deeper certification + microbiome + systems + vision',
    remaining: 'Consumer UX shell',
  },
];

function getGapReport() {
  return {
    generatedAt: new Date().toISOString(),
    gaps: GAPS,
    closed_in_this_release: [
      'Organic certification multi-scheme engine',
      'Deep microbiome functional AI',
      'Multi-lens agro interpretation',
      'International peer gap matrix',
    ],
  };
}

module.exports = { GAPS, getGapReport };
