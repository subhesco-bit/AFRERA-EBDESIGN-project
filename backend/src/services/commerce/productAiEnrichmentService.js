/**
 * When product is added: search-like enrichment + AI image generation contract
 * Honesty: live web search needs network credentials; seed knowledge + structured prompts provided.
 */

'use strict';

const { randomUUID } = require('crypto');

/** Seed knowledge for common agri products */
const KNOWLEDGE = {
  tomato: {
    category: 'vegetable',
    description: 'Fresh tomato — salad and cooking vegetable, rich in lycopene.',
    nutrients_per_100g: { kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, fiber_g: 1.2, vitamin_c_mg: 14 },
    storage: 'Cool dry place; refrigerate when ripe',
    hsn_hint: '0702',
    tags: ['vegetable', 'fresh', 'lycopene'],
  },
  wheat: {
    category: 'grain',
    description: 'Wheat grain for flour and seed use.',
    nutrients_per_100g: { kcal: 340, protein_g: 13, carbs_g: 72, fat_g: 2.5, fiber_g: 12 },
    storage: 'Airtight, moisture-free',
    hsn_hint: '1001',
    tags: ['grain', 'rabi'],
  },
  'urea fertilizer': {
    category: 'input',
    description: 'Nitrogen fertilizer (urea 46% N). Handle with care; follow label rates.',
    nutrients_per_100g: null,
    storage: 'Dry shed, away from children',
    hsn_hint: '3102',
    tags: ['fertilizer', 'nitrogen'],
    safety: 'Agricultural input — not edible',
  },
  milk: {
    category: 'dairy',
    description: 'Fresh milk — perishable dairy product.',
    nutrients_per_100g: { kcal: 61, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.3 },
    storage: 'Refrigerate 0–4°C',
    hsn_hint: '0401',
    tags: ['dairy', 'cold_chain'],
  },
};

function lookup(name = '') {
  const n = String(name).toLowerCase().trim();
  for (const [k, v] of Object.entries(KNOWLEDGE)) {
    if (n.includes(k) || k.includes(n)) return { key: k, ...v, source: 'seed_knowledge' };
  }
  return {
    key: n,
    category: 'general',
    description: `${name} — product details to be confirmed by seller (auto-enrichment seed miss).`,
    nutrients_per_100g: null,
    storage: null,
    hsn_hint: null,
    tags: [],
    source: 'fallback',
  };
}

function imagePromptFor(product, enrich) {
  return {
    prompt: `Professional ecommerce product photo of ${product.name || enrich.key}, clean white background, soft studio lighting, agri-commerce catalog style, high detail, no watermark text`,
    style: 'catalog_photo',
    negative: 'blurry, text overlay, logo spam, distorted',
    size: '1024x1024',
  };
}

function enrichProduct(product = {}) {
  const name = product.name || product.title || 'product';
  const knowledge = lookup(name);
  const image = imagePromptFor({ name }, knowledge);
  const product_id = product.product_id || product.sku || `PRD-${randomUUID().slice(0, 8)}`;
  return {
    product_id,
    name,
    auto_filled: {
      description: product.description || knowledge.description,
      category: product.category || knowledge.category,
      tags: [...new Set([...(product.tags || []), ...(knowledge.tags || [])])],
      nutrients_per_100g: product.nutrients_per_100g || knowledge.nutrients_per_100g,
      storage: product.storage || knowledge.storage,
      hsn: product.hsn || knowledge.hsn_hint,
      safety: knowledge.safety || null,
    },
    image_generation: {
      status: 'prompt_ready',
      ...image,
      render_contract:
        'Pass image_generation.prompt to Grok Imagine / vendor image API; store URL back on product.media',
    },
    internet_search: {
      status: knowledge.source === 'seed_knowledge' ? 'seed_hit' : 'needs_live_search',
      query: name,
      note: 'Wire AGMARKNET / open food facts / seller catalog APIs for live enrichment',
    },
    confidence: knowledge.source === 'seed_knowledge' ? 0.82 : 0.45,
    advisory: true,
  };
}

async function operate(data = {}) {
  const action = data.action || 'enrich';
  if (action === 'enrich' || action === 'on_product_add') {
    return enrichProduct(data.product || data);
  }
  if (action === 'knowledge_keys') {
    return { keys: Object.keys(KNOWLEDGE) };
  }
  return { error: 'Unknown action' };
}

module.exports = { operate, enrichProduct, lookup, KNOWLEDGE };
