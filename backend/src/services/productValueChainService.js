'use strict';

const crypto = require('crypto');
const fetch = require('node-fetch');
const { logger } = require('../utils/logger');
const productMediaAIService = require('./productMediaAIService');

const CACHE_TTL_MS = Number(process.env.VALUE_CHAIN_AI_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const MAX_CACHE_ENTRIES = 250;
const aiCopyCache = new Map();

const FOOD_PROFILES = [
  { keys: ['tea'], category: 'beverage', shelfLifeDays: 540, storage: 'ambient-dry', nutrients: { energy_kcal: 1, protein_g: 0, fibre_g: 0 }, valueSignals: ['antioxidant-rich infusion', 'single-origin story'] },
  { keys: ['rice', 'paddy'], category: 'grain', shelfLifeDays: 365, storage: 'ambient-dry', nutrients: { energy_kcal: 365, protein_g: 7.1, fibre_g: 1.3 }, valueSignals: ['staple grain', 'varietal traceability'] },
  { keys: ['turmeric'], category: 'spice', shelfLifeDays: 730, storage: 'ambient-dry', nutrients: { energy_kcal: 312, protein_g: 9.7, fibre_g: 22.7 }, valueSignals: ['curcumin quality', 'origin and processing'] },
  { keys: ['ginger'], category: 'fresh-produce', shelfLifeDays: 21, storage: 'cool-ventilated', nutrients: { energy_kcal: 80, protein_g: 1.8, fibre_g: 2 }, valueSignals: ['freshness', 'essential-oil profile'] },
  { keys: ['cardamom'], category: 'spice', shelfLifeDays: 540, storage: 'ambient-dry', nutrients: { energy_kcal: 311, protein_g: 11, fibre_g: 28 }, valueSignals: ['volatile-oil quality', 'pod size and colour'] },
  { keys: ['orange', 'pineapple', 'mango', 'tomato'], category: 'fresh-produce', shelfLifeDays: 12, storage: 'cold-chain', nutrients: { energy_kcal: 50, protein_g: 0.8, fibre_g: 2 }, valueSignals: ['harvest freshness', 'grade and brix'] },
];

const DEFAULT_PROFILE = { category: 'agricultural-product', shelfLifeDays: 90, storage: 'quality-assessment-required', nutrients: null, valueSignals: ['verified origin', 'quality grade', 'traceability'] };

function cleanText(value, maxLength = 500) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function clamp(number, min, max) {
  return Math.min(Math.max(Number(number) || 0, min), max);
}

function round(number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(number) + Number.EPSILON) * factor) / factor;
}

function findFoodProfile(name, description = '') {
  const haystack = `${name} ${description}`.toLowerCase();
  return FOOD_PROFILES.find((profile) => profile.keys.some((key) => haystack.includes(key))) || DEFAULT_PROFILE;
}

function calculatePricing(input, profile) {
  const baseCost = clamp(input.costPerKg, 0, 100000);
  const marketPrice = clamp(input.marketPricePerKg, 0, 100000);
  const qualityScore = clamp(input.qualityScore || 70, 0, 100);
  const premiumRate = clamp(
    (input.organic ? 0.08 : 0) + (input.giCertified ? 0.1 : 0) +
    Math.max(0, qualityScore - 60) / 500 + (profile.nutrients ? 0.03 : 0) +
    (input.traceable ? 0.04 : 0),
    0,
    0.35,
  );
  const costFloor = baseCost > 0 ? baseCost * 1.18 : 0;
  const reference = Math.max(costFloor, marketPrice, baseCost);
  return {
    currency: 'INR', unit: 'kg', base_cost_per_kg: round(baseCost), observed_market_price_per_kg: round(marketPrice),
    margin_floor_per_kg: round(costFloor), premium_rate_percent: round(premiumRate * 100, 1),
    recommended_price_per_kg: round(reference * (1 + premiumRate)), evidence: 'rule-based-estimate',
    warning: 'Confirm against live mandi, wholesale, retail, logistics, tax, and quality-test data before publishing.',
  };
}

function buildColdChain(input, profile) {
  const required = profile.storage === 'cold-chain' || Boolean(input.perishable);
  return {
    required,
    storage_mode: required ? 'pre-cool + reefer + monitored cold room' : profile.storage,
    target_temperature_c: required ? { min: 2, max: 8 } : null,
    monitoring: required ? ['temperature', 'humidity', 'door events', 'lot dwell time'] : ['humidity', 'pest control', 'lot age'],
    handoff: required ? '/cold-storage' : '/logistics',
    standards_note: 'Final limits must be set by commodity, packaging, route duration, and applicable food-safety guidance.',
  };
}

function buildInsurance(input, coldChain, valuePerKg) {
  const sumInsured = round(clamp(input.quantityKg || 100, 1, 10000000) * valuePerKg);
  return {
    recommended_layers: ['produce/stock', 'transit', ...(coldChain.required ? ['temperature excursion'] : []), 'warehouse/fire', 'product liability'],
    indicative_sum_insured_inr: sumInsured,
    indicative_premium_inr: round(sumInsured * (coldChain.required ? 0.012 : 0.008)),
    evidence: 'indicative-only', handoff: '/insurance',
    warning: 'A licensed insurer must issue the policy after underwriting and exclusions review.',
  };
}

function buildFunding(input, valuePerKg, coldChain) {
  return {
    working_capital_estimate_inr: round(clamp(input.quantityKg || 100, 1, 10000000) * valuePerKg * 0.65),
    suggested_instruments: ['purchase-order finance', 'warehouse-receipt finance', 'invoice discounting', ...(coldChain.required ? ['cold-chain infrastructure term loan'] : [])],
    readiness_documents: ['KYC', 'land/lease or FPO records', 'bank statements', 'cost sheet', 'buyer intent/order', 'insurance quote', 'project report'],
    bank_handoff: '/bank-passport', project_handoff: '/engineering-projects',
  };
}

function buildSubsidies(input, coldChain) {
  return {
    candidates: [
      { name: 'Agriculture Infrastructure Fund', fit: coldChain.required ? 'high' : 'medium', use: 'eligible post-harvest and community infrastructure' },
      { name: 'PM Formalisation of Micro Food Processing Enterprises', fit: input.processingRequired ? 'high' : 'review', use: 'eligible food-processing and group projects' },
      { name: 'Mission for Integrated Development of Horticulture', fit: coldChain.required ? 'review' : 'low', use: 'eligible horticulture and post-harvest components' },
    ],
    evidence: 'pre-screening-not-eligibility', handoff: '/subsidy-management',
    warning: 'Scheme rules, geography, beneficiary class, windows, and official portals must be verified at application time.',
  };
}

function fallbackCopy(input, profile) {
  const origin = input.location || 'Northeast India';
  return {
    slogan: `${input.name}: rooted in ${origin}, ready for a wider market.`,
    short_description: `${input.name} from ${origin}, presented with transparent sourcing, ${profile.valueSignals.slice(0, 2).join(' and ')}, and lot-level handling guidance.`,
    buyer_bullets: ['Traceable farm origin', 'Transparent per-kilogram pricing', 'Handling and risk plan included'],
    localization_note: `Review language, imagery, dietary claims, cultural context, and religious sensitivities with people from ${origin} before publication.`,
    source: 'deterministic-fallback',
  };
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of aiCopyCache) if (now - entry.createdAt > CACHE_TTL_MS) aiCopyCache.delete(key);
  while (aiCopyCache.size > MAX_CACHE_ENTRIES) aiCopyCache.delete(aiCopyCache.keys().next().value);
}

async function generateTokenEfficientCopy(input, profile, options = {}) {
  const fallback = fallbackCopy(input, profile);
  if (options.useAI === false || !process.env.OPENAI_API_KEY) return fallback;
  const context = { n: input.name, d: input.description, o: input.location, c: profile.category, s: profile.valueSignals, organic: Boolean(input.organic), gi: Boolean(input.giCertified), lang: input.language || 'English' };
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify(context)).digest('hex');
  pruneCache();
  const cached = aiCopyCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return { ...cached.value, cached: true };
  const prompt = 'Return JSON only with keys slogan, short_description, buyer_bullets (3 short strings), localization_note. ' +
    'Write factual premium marketplace copy. Do not invent certification, nutrition, medical, religious, sustainability, or origin claims. ' +
    `Respect local culture without stereotyping. Data:${JSON.stringify(context)}`;
  try {
    const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_VALUE_CHAIN_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.2,
        max_tokens: Number(process.env.OPENAI_VALUE_CHAIN_MAX_TOKENS || 320),
      }),
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || 30000),
    });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
    const body = await response.json();
    const parsed = JSON.parse(body.choices?.[0]?.message?.content || '{}');
    const value = {
      slogan: cleanText(parsed.slogan, 140) || fallback.slogan,
      short_description: cleanText(parsed.short_description, 480) || fallback.short_description,
      buyer_bullets: Array.isArray(parsed.buyer_bullets) ? parsed.buyer_bullets.slice(0, 3).map((item) => cleanText(item, 100)) : fallback.buyer_bullets,
      localization_note: cleanText(parsed.localization_note, 300) || fallback.localization_note,
      source: 'openai', cached: false,
      usage: body.usage ? { prompt_tokens: body.usage.prompt_tokens, completion_tokens: body.usage.completion_tokens, total_tokens: body.usage.total_tokens } : null,
    };
    aiCopyCache.set(cacheKey, { createdAt: Date.now(), value });
    return value;
  } catch (error) {
    logger.warn('Value-chain AI copy generation failed; deterministic copy used', { error: error.message });
    return { ...fallback, ai_error: 'provider_unavailable' };
  }
}

function buildWorkflow(profile, pricing, coldChain) {
  return [
    { id: 'intake', owner: 'Farmer / FPO', status: 'ready', label: 'Product and evidence intake', link: '/sell/new-product' },
    { id: 'quality', owner: 'Lab / quality professional', status: profile.nutrients ? 'estimate-ready' : 'verification-needed', label: 'Food, nutrient and quality verification', link: '/quality-control' },
    { id: 'commerce', owner: 'Seller / marketplace', status: pricing.recommended_price_per_kg > 0 ? 'ready' : 'cost-data-needed', label: 'Value-based listing and price', link: '/ecommerce-marketplace' },
    { id: 'storage', owner: 'Warehouse / cold-chain operator', status: coldChain.required ? 'booking-needed' : 'handling-plan-ready', label: 'Storage and route reservation', link: coldChain.handoff },
    { id: 'risk', owner: 'Insurer / bank', status: 'quote-needed', label: 'Insurance and working capital', link: '/insurance' },
    { id: 'order', owner: 'Consumer / buyer', status: 'after-publish', label: 'Order, payment, fulfilment and traceability', link: '/marketplace' },
  ];
}

async function analyzeProduct(rawInput = {}, options = {}) {
  const input = {
    name: cleanText(rawInput.name, 120), description: cleanText(rawInput.description, 600), location: cleanText(rawInput.location, 120) || 'Northeast India',
    language: cleanText(rawInput.language, 40) || 'English', costPerKg: rawInput.costPerKg, marketPricePerKg: rawInput.marketPricePerKg,
    quantityKg: rawInput.quantityKg, qualityScore: rawInput.qualityScore, organic: Boolean(rawInput.organic), giCertified: Boolean(rawInput.giCertified),
    traceable: rawInput.traceable !== false, perishable: Boolean(rawInput.perishable), processingRequired: Boolean(rawInput.processingRequired),
  };
  if (!input.name) throw new Error('Product name is required');
  const profile = findFoodProfile(input.name, input.description);
  const pricing = calculatePricing(input, profile);
  const coldChain = buildColdChain(input, profile);
  const [marketing, image] = await Promise.all([
    generateTokenEfficientCopy(input, profile, options),
    options.generateImage === true
      ? productMediaAIService.callImageProvider('openai_images', [
        `Premium ecommerce photograph of ${input.name} from ${input.location}.`, input.description,
        'Natural accurate appearance, clean background, no text, logo, watermark, people, medical claims, or invented certification marks.',
      ].filter(Boolean).join(' '), { size: '1024x1024', quality: 'standard' })
      : Promise.resolve({ ok: false, status: 'not_requested' }),
  ]);
  const valuePerKg = pricing.recommended_price_per_kg || pricing.observed_market_price_per_kg || pricing.base_cost_per_kg;
  return {
    analysis_id: `vca_${crypto.createHash('sha256').update(`${input.name}:${input.location}:${Date.now()}`).digest('hex').slice(0, 12)}`,
    generated_at: new Date().toISOString(), product: { ...input, category: profile.category, shelf_life_days_estimate: profile.shelfLifeDays },
    media: image, marketing,
    nutrition: { per_100g_estimate: profile.nutrients, value_signals: profile.valueSignals, evidence: profile.nutrients ? 'reference-estimate' : 'not-available', warning: 'Do not publish nutrition or health claims until an authoritative database match or accredited laboratory result is recorded.' },
    pricing, cold_chain: coldChain, insurance: buildInsurance(input, coldChain, valuePerKg), funding: buildFunding(input, valuePerKg, coldChain), subsidies: buildSubsidies(input, coldChain),
    medical_coding: { use_cases: ['farmer occupational injury encounter', 'telehealth documentation', 'nutrition-service encounter', 'health-insurance claim support'], boundary: 'Product nutrition and wellness content must never create a diagnosis or medical code. Coding starts only from clinician-authored encounter documentation.', handoff: '/medical-coding' },
    engineering: { required_when: ['new packhouse', 'processing line', 'cold room', 'warehouse retrofit', 'solar/energy system'], preparation: ['site survey', 'capacity model', 'layout and utilities', 'capex/opex estimate', 'permits', 'implementation milestones'], handoff: '/engineering-projects' },
    compliance: { gates: ['seller KYC', 'food-business licensing applicability', 'labelling and weights', 'tax classification', 'batch traceability', 'returns/recall process', 'privacy and payment controls'], export_additions: ['destination-country admissibility', 'phytosanitary requirements', 'residue limits', 'exporter registration', 'customs documentation'], handoff: '/compliance' },
    workflow: buildWorkflow(profile, pricing, coldChain),
    order_flow: ['inventory reservation', 'payment authorization', 'lot allocation', 'storage pick', 'pack and quality scan', 'insured dispatch', 'temperature/route monitoring', 'proof of delivery', 'settlement and feedback'],
    governance: { human_review_required: ['nutrition claims', 'religious/dietary claims', 'certification marks', 'subsidy eligibility', 'credit approval', 'insurance binding', 'export compliance'], privacy: 'Do not send personal, financial, health, or identity documents to the marketing-generation prompt.' },
  };
}

function getStatus() {
  return {
    status: 'operational', aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    tokenOptimization: { compactPrompt: true, structuredOutput: true, maxOutputTokens: Number(process.env.OPENAI_VALUE_CHAIN_MAX_TOKENS || 320), cacheTtlMs: CACHE_TTL_MS, cacheEntries: aiCopyCache.size },
    deterministicModules: ['classification', 'nutrition reference', 'pricing', 'cold-chain', 'insurance estimate', 'funding readiness', 'subsidy pre-screen', 'workflow'],
  };
}

module.exports = { analyzeProduct, calculatePricing, findFoodProfile, getStatus };
