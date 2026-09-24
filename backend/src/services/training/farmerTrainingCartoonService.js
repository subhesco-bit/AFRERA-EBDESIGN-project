/**
 * AI farmer training cartoons — module storyboards
 */

'use strict';

const { randomUUID } = require('crypto');

const MODULES = {
  soil_testing: {
    title: 'How to sample soil',
    scenes: [
      { n: 1, title: 'Why', text: 'Soil test guides fertilizer — saves money and protects land.', visual: 'Cartoon farmer puzzled at yellow crop' },
      { n: 2, title: 'Where', text: 'Zig-zag sample across the field; avoid bunds and shade.', visual: 'Field map with sample points' },
      { n: 3, title: 'How', text: 'Clear surface, dig 15 cm, mix sub-samples in clean bucket.', visual: 'Spade + bucket steps' },
      { n: 4, title: 'Send', text: 'Air-dry shade, pack, label, send to lab / scheme booth.', visual: 'Sample bag to lab' },
      { n: 5, title: 'Act', text: 'Apply nutrients only as report recommends.', visual: 'Report → balanced fertilizer cartoon' },
    ],
  },
  safe_pesticide: {
    title: 'Safe spraying',
    scenes: [
      { n: 1, title: 'Read label', text: 'Dose and waiting period are on the label — not memory.', visual: 'Bottle label zoom' },
      { n: 2, title: 'PPE', text: 'Gloves, mask, full sleeves before mixing.', visual: 'Farmer wearing PPE' },
      { n: 3, title: 'Mix', text: 'Measure with cap/scale; never with bare hands.', visual: 'Measuring cup' },
      { n: 4, title: 'Spray', text: 'Wind at back, no spray near water or children.', visual: 'Wind direction arrows' },
      { n: 5, title: 'After', text: 'Wash hands; store locked; respect harvest interval.', visual: 'Lock + calendar' },
    ],
  },
  calf_care: {
    title: 'Newborn calf care',
    scenes: [
      { n: 1, title: 'Breathing', text: 'Clear airway; calf should breathe in minutes.', visual: 'Calf birth calm scene' },
      { n: 2, title: 'Colostrum', text: 'First milk within 2 hours — critical antibodies.', visual: 'Colostrum feed' },
      { n: 3, title: 'Navel', text: 'Disinfect navel; keep dry bedding.', visual: 'Navel care icon' },
      { n: 4, title: 'Watch', text: 'Call vet if weak suck, fever, or scours.', visual: 'Phone vet' },
    ],
  },
  market_link: {
    title: 'Selling better',
    scenes: [
      { n: 1, title: 'Grade', text: 'Sort quality — better lots fetch better price.', visual: 'Grading table' },
      { n: 2, title: 'Info', text: 'Check mandi modal before you travel.', visual: 'Phone mandi rates' },
      { n: 3, title: 'Collective', text: 'FPO bulk often beats distress solo sale.', visual: 'Group of farmers' },
    ],
  },
};

function listModules() {
  return {
    modules: Object.entries(MODULES).map(([id, m]) => ({
      id,
      title: m.title,
      scene_count: m.scenes.length,
    })),
  };
}

function generate(moduleId, opts = {}) {
  const mod = MODULES[moduleId];
  if (!mod) {
    return { error: 'Unknown module', known: Object.keys(MODULES) };
  }
  const lang = opts.lang || 'en';
  const storyboard_id = `TRN-${randomUUID().slice(0, 8)}`;
  return {
    storyboard_id,
    module_id: moduleId,
    title: mod.title,
    lang,
    scenes: mod.scenes.map((s) => ({
      ...s,
      image_prompt: `Educational farmer training cartoon, scene ${s.n}: ${s.visual}. Clear, respectful rural India setting, high readability, no scary imagery. Caption: ${s.title}`,
    })),
    render_contract: 'Sequence → image API → slideshow or WhatsApp training pack',
    safety_floor: 'Training aid only; local extension / vet / agronomist prevails.',
    confidence: 0.9,
    advisory: true,
  };
}

async function operate(data = {}) {
  if (data.action === 'list' || !data.module_id) return listModules();
  return generate(data.module_id, data);
}

module.exports = { operate, listModules, generate, MODULES };
