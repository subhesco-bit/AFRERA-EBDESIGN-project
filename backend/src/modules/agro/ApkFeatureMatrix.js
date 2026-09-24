/**
 * Deep analysis of typical India agro APK features vs AFRERA agro module
 */

const APK_FEATURE_MATRIX = [
  { feature: 'Crop catalogue India', typical_apk: 'partial lists', afrera: 'category + profiles JSON extensible', status: 'strong' },
  { feature: 'Season advisory kharif/rabi/zaid', typical_apk: 'yes', afrera: 'yes + conference', status: 'strong' },
  { feature: 'Photo disease diagnosis', typical_apk: 'yes CV', afrera: 'vision ontology + model_predictions hook', status: 'strong_hook' },
  { feature: 'Weather API', typical_apk: 'yes', afrera: 'telemetry input; bind weather gateway externally', status: 'integration' },
  { feature: 'Market prices', typical_apk: 'yes', afrera: 'not in this module — separate market service', status: 'external' },
  { feature: 'Fertilizer calculator', typical_apk: 'basic NPK', afrera: 'soil-test first + organic/inorganic paths + microbiome', status: 'stronger_method' },
  { feature: 'Organic farming mode', typical_apk: 'toggle tips', afrera: 'full toolkit + disease organic cures', status: 'strong' },
  { feature: 'Soil type India', typical_apk: 'rare', afrera: 'alluvial/black/red/sandy/mountain', status: 'strong' },
  { feature: 'Soil microbiome', typical_apk: 'rare marketing', afrera: 'rhizobium PSB AMF trichoderma practices', status: 'strong' },
  { feature: 'Roof/greenhouse systems', typical_apk: 'rare', afrera: 'dedicated systems engine', status: 'strong' },
  { feature: 'Government scheme links', typical_apk: 'yes', afrera: 'link externally', status: 'external' },
  { feature: 'Multilingual', typical_apk: 'yes', afrera: 'content English keys; UI i18n layer', status: 'ui_layer' },
  { feature: 'Offline pack', typical_apk: 'yes', afrera: 'JSON knowledge cacheable', status: 'ready' },
];

function getMatrix() {
  return {
    analyzed_at: new Date().toISOString(),
    matrix: APK_FEATURE_MATRIX,
    gaps_product: APK_FEATURE_MATRIX.filter((x) => x.status === 'external' || x.status === 'integration'),
    knowledge_ready: APK_FEATURE_MATRIX.filter((x) => x.status === 'strong' || x.status === 'strong_hook' || x.status === 'stronger_method'),
  };
}

module.exports = { APK_FEATURE_MATRIX, getMatrix };
