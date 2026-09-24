/**
 * Agro Vision Analysis — picture-based crop/garden diagnosis hooks
 * Works with client-side / ML gateway image embeddings OR structured visual symptoms.
 * Does not claim pixel-perfect disease ID without model backend.
 */

const { randomUUID } = require('crypto');

const VISION_DISCLAIMER =
  'Image-based agro analysis is assistive. Lighting, blur, and look-alike symptoms cause error. Confirm with extension/agronomist before pesticide use. Not a lab diagnosis.';

/** Symptom ontology for mobile APK-style structured input */
const VISUAL_SYMPTOMS = [
  { id: 'yellow_leaves', labels: ['yellow', 'chlorosis'], hypotheses: ['N deficiency', 'overwatering', 'root damage', 'natural senescence lower leaves'] },
  { id: 'brown_spots', labels: ['brown spot', 'leaf spot'], hypotheses: ['fungal leaf spot', 'bacterial spot', 'sunscald'] },
  { id: 'white_powder', labels: ['white powder', 'powdery'], hypotheses: ['powdery mildew'] },
  { id: 'wilting', labels: ['wilt', 'droop'], hypotheses: ['water stress', 'vascular wilt', 'root rot', 'heat stress'] },
  { id: 'holes_chew', labels: ['holes', 'chewed'], hypotheses: ['caterpillar', 'beetle', 'snail'] },
  { id: 'sticky_honeydew', labels: ['sticky', 'honeydew', 'black sooty'], hypotheses: ['aphid', 'whitefly', 'sooty mould secondary'] },
  { id: 'mosaic_mottling', labels: ['mosaic', 'mottled', 'curl'], hypotheses: ['virus complex', 'herbicide drift', 'mite'] },
  { id: 'blossom_end_rot', labels: ['black bottom fruit', 'blossom end'], hypotheses: ['Ca imbalance / irregular irrigation'] },
  { id: 'damping_seedling', labels: ['seedling collapse', 'damping'], hypotheses: ['damping-off pathogens', 'overwet media'] },
  { id: 'nutrient_purple', labels: ['purple leaves'], hypotheses: ['P deficiency', 'cold stress'] },
];

const SEVERITY_BANDS = {
  low: { action: 'Monitor 48–72h; cultural fix first' },
  moderate: { action: 'Sample more plants; consider targeted IPM' },
  high: { action: 'Isolate affected; expert confirmation before chemical' },
};

/**
 * Analyze from structured vision payload (APK sends tags after on-device or cloud CV)
 * input: {
 *   image_meta: { width, height, captured_at, source: 'apk'|'web' },
 *   cv_tags: ['yellow_leaves', ...] or free text description,
 *   crop, system, location, telemetry
 * }
 */
function analyzeVision(input = {}) {
  const tags = new Set();
  for (const t of input.cv_tags || []) tags.add(String(t).toLowerCase().replace(/\s+/g, '_'));
  const text = String(input.description || input.owner_observations || '').toLowerCase();

  const matches = [];
  for (const sym of VISUAL_SYMPTOMS) {
    const hitTag = sym.labels.some((l) => tags.has(l.replace(/\s+/g, '_')) || [...tags].some((t) => t.includes(l.split(' ')[0])));
    const hitText = sym.labels.some((l) => text.includes(l));
    if (hitTag || hitText || tags.has(sym.id)) {
      matches.push({
        symptom_id: sym.id,
        hypotheses: sym.hypotheses,
        confidence: hitTag && hitText ? 0.75 : hitTag || hitText ? 0.55 : 0.4,
      });
    }
  }

  // If client sent model scores
  if (Array.isArray(input.model_predictions)) {
    for (const p of input.model_predictions) {
      matches.push({
        symptom_id: p.label || p.class,
        hypotheses: [p.label || p.class],
        confidence: Number(p.score || p.confidence || 0.5),
        source: 'external_model',
      });
    }
  }

  matches.sort((a, b) => b.confidence - a.confidence);
  const top = matches[0];
  const severity =
    top?.confidence >= 0.7 ? 'high' : top?.confidence >= 0.45 ? 'moderate' : matches.length ? 'low' : 'unknown';

  const recommendations = [];
  if (!matches.length) {
    recommendations.push('Provide clearer photo (daylight, leaf upper+lower, fruit, whole plant) or structured cv_tags');
  } else {
    recommendations.push('Correlate with irrigation and recent weather');
    recommendations.push(SEVERITY_BANDS[severity]?.action || 'Monitor');
    if (text.includes('spray') || text.includes('pesticide')) {
      recommendations.push('Do not spray until identity confidence is higher — label law applies');
    }
  }

  return {
    case_id: randomUUID(),
    engine: 'AgroVisionAnalysis',
    engine_tier: 'grok-highest',
    mode: input.model_predictions ? 'hybrid_model_plus_rules' : 'structured_visual_ontology',
    image_meta: input.image_meta || null,
    matches: matches.slice(0, 8),
    severity,
    recommendations,
    apk_integration: {
      accept: ['multipart image upload → CV gateway', 'on-device tags → cv_tags[]', 'model_predictions[{label,score}]'],
      endpoint: 'POST /api/v1/agro-farming/vision/analyze',
      note: 'Wire TensorFlow/PyTorch/cloud vision at gateway; this engine interprets tags/scores',
    },
    disclaimer: VISION_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  analyzeVision,
  VISUAL_SYMPTOMS,
  VISION_DISCLAIMER,
};
