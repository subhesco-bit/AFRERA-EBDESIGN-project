/**
 * Embedded AI runtime — on-device / edge / offline-capable model hooks
 * Not cloud-only: registry of local models, RAG packs, inference routing.
 */

const { randomUUID } = require('crypto');

const MODEL_REGISTRY = [
  {
    id: 'vet_symptom_classifier_v1',
    module: 'veterinary',
    type: 'classifier',
    runtime: ['onnx', 'tflite', 'cpu'],
    input: 'symptoms_text_or_tags',
    output: 'differential_prior_scores',
    offline: true,
    size_hint_mb: 15,
  },
  {
    id: 'vet_vision_lesion_v1',
    module: 'veterinary',
    type: 'vision',
    runtime: ['tflite', 'onnx'],
    input: 'image_rgb',
    output: 'cv_tags',
    offline: true,
    size_hint_mb: 25,
  },
  {
    id: 'nutri_meal_estimator_v1',
    module: 'nutrition',
    type: 'vision_nlp',
    runtime: ['onnx', 'cpu'],
    input: 'meal_description_or_image',
    output: 'macro_estimate',
    offline: true,
    size_hint_mb: 20,
  },
  {
    id: 'nutri_diet_ranker_v1',
    module: 'nutrition',
    type: 'ranker',
    runtime: ['cpu'],
    input: 'profile_plus_foods',
    output: 'ranked_meal_options',
    offline: true,
    size_hint_mb: 5,
  },
  {
    id: 'agro_leaf_disease_v1',
    module: 'agro',
    type: 'vision',
    runtime: ['tflite', 'onnx'],
    input: 'leaf_image',
    output: 'cv_tags_severity',
    offline: true,
    size_hint_mb: 30,
  },
  {
    id: 'agro_crop_advisor_llm_q4',
    module: 'agro',
    type: 'small_llm',
    runtime: ['gguf', 'cpu', 'npu'],
    input: 'prompt',
    output: 'advice_text',
    offline: true,
    size_hint_mb: 800,
  },
  {
    id: 'shared_embedder_mini',
    module: 'shared',
    type: 'embedding',
    runtime: ['onnx', 'cpu'],
    input: 'text',
    output: 'vector_384',
    offline: true,
    size_hint_mb: 50,
  },
];

const RAG_PACKS = [
  { id: 'vet_ethnovet_india', module: 'veterinary', docs: 'geo ethnovet + safety' },
  { id: 'vet_pcicda_schedules', module: 'veterinary', docs: 'reporting duties' },
  { id: 'nutri_ritu_ifct_subset', module: 'nutrition', docs: 'seasonal + composition subset' },
  { id: 'nutri_drug_food', module: 'nutrition', docs: 'interaction cards' },
  { id: 'agro_crop_disease_india', module: 'agro', docs: 'disease cards organic/inorganic' },
  { id: 'agro_npop_pgs', module: 'agro', docs: 'certification steps' },
  { id: 'agro_biochar_charge', module: 'agro', docs: 'charging methods' },
];

function listModels(module) {
  if (!module) return MODEL_REGISTRY;
  return MODEL_REGISTRY.filter((m) => m.module === module || m.module === 'shared');
}

function listRag(module) {
  if (!module) return RAG_PACKS;
  return RAG_PACKS.filter((p) => p.module === module);
}

/**
 * Route inference: prefer embedded/offline, fallback cloud flag only if allowed
 */
function routeInference(input = {}) {
  const module = input.module || 'shared';
  const preferOffline = input.prefer_offline !== false;
  const models = listModels(module);
  const selected =
    models.find((m) => m.type === input.task) ||
    models.find((m) => m.offline) ||
    models[0];

  return {
    inference_id: randomUUID(),
    selected_model: selected || null,
    mode: preferOffline && selected?.offline ? 'embedded_offline' : 'hybrid',
    rag_packs: listRag(module),
    status: selected ? 'ready_for_local_runtime' : 'no_model',
    note:
      'Wire ONNX/TFLite/GGUF runtimes in mobile/edge app; this registry is the contract',
    input_echo: {
      task: input.task,
      has_image: !!input.image_b64 || !!input.image_url,
      has_text: !!input.text,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** Simulated embedded analyze for API completeness (replace with real runtime) */
function runEmbeddedAnalyze(input = {}) {
  const route = routeInference(input);
  const tags = [];
  const text = String(input.text || input.description || '').toLowerCase();
  if (input.module === 'veterinary' || input.module === 'agro') {
    if (/yellow|chlorosis/.test(text)) tags.push('yellowing');
    if (/spot|blight/.test(text)) tags.push('leaf_spot');
    if (/limp|lame/.test(text)) tags.push('lameness');
    if (/diarrhea|loose/.test(text)) tags.push('diarrhea');
  }
  if (input.module === 'nutrition') {
    if (/rice|roti|dal/.test(text)) tags.push('indian_meal_pattern');
    if (/sweet|dessert|mithai/.test(text)) tags.push('high_sugar_item');
  }
  return {
    ...route,
    embedded_result: {
      cv_tags: tags,
      confidence: tags.length ? 0.55 : 0.25,
      engine: 'embedded_stub_replace_with_onnx',
    },
  };
}

module.exports = {
  MODEL_REGISTRY,
  RAG_PACKS,
  listModels,
  listRag,
  routeInference,
  runEmbeddedAnalyze,
};
