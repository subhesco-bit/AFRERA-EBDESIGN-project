#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const inputPath = path.join(root, 'docs', 'north-east-variety-products.json');
const outputPath = path.join(root, 'frontend', 'src', 'data', 'northEastVarietyProducts.js');

if (!fs.existsSync(inputPath)) {
  console.error(`Missing ${inputPath}. Extract the DOCX first.`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

function cleanText(value) {
  return String(value || '')
    .replace(/\s+\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function productImageSeed(product) {
  const crop = String(product.crop || '').toLowerCase();
  if (/citrus|orange|lemon|lime|pomelo/.test(crop)) return '🍊';
  if (/rice|paddy/.test(crop)) return '🌾';
  if (/chilli|pepper/.test(crop)) return '🌶️';
  if (/ginger|turmeric|spice/.test(crop)) return '🫚';
  if (/pineapple/.test(crop)) return '🍍';
  if (/banana/.test(crop)) return '🍌';
  if (/tea/.test(crop)) return '🍃';
  if (/bean|pulse|lentil/.test(crop)) return '🫘';
  return '🌱';
}

function toMarketplaceProduct(product, index) {
  const attributes = product.attributes || {};
  const state = attributes.primary_state_s || attributes.state || attributes.region || product.region;
  const giText = attributes.gi_status_application_no || '';
  const specialty = cleanText(attributes.specialty_usp_biochemical_profile || product.description);
  const valueUse = cleanText(attributes.commercial_value_added_potential || '');
  const retailPrice = Number(product.estimated_price_inr || 120);
  return {
    id: product.id,
    product_name: product.name,
    name: product.name,
    crop: product.crop,
    category: product.category,
    state,
    region: product.region,
    description: [specialty, valueUse].filter(Boolean).join(' '),
    unit: product.unit,
    unit_symbol: product.unit,
    quantity: 100 + (index % 9) * 25,
    base_price: retailPrice,
    retailPrice,
    bulkPrice: Math.max(1, Math.round(retailPrice * 0.92)),
    volumePrice: Math.max(1, Math.round(retailPrice * 0.84)),
    stock: 100 + (index % 9) * 25,
    rating: Number((4.3 + (index % 6) / 10).toFixed(1)),
    reviews: 18 + index * 3,
    gi_tagged: /registered/i.test(giText),
    organic: /organic|hill|traditional|indigenous/i.test(`${specialty} ${valueUse}`),
    certification: /registered/i.test(giText) ? 'GI Registered' : 'Regional Variety',
    image: productImageSeed(product),
    ai: {
      imagePrompt: `Create a clean ecommerce product image for ${product.name}, a ${product.crop} variety from ${state}, North East India. Show the real crop/product clearly on a simple market background.`,
      cartoonPrompt: `Create a farmer-friendly cartoon panel explaining why ${product.name} is valuable: ${specialty || 'regional quality and local demand'}. Use simple visual steps and no dense text.`,
      dietitianNote: `Use ${product.name} in diet advice only with nutrition-safe language. Explain likely culinary use, portion awareness, and when to consult a qualified dietitian.`,
      nutrientCalculatorHint: `Estimate nutrition only after lab/source data is attached; until then mark values as indicative and source-pending.`,
    },
  };
}

const products = payload.products.map(toMarketplaceProduct);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  `// Generated from docs/north-east-variety-products.json. Re-run tools/codex-generate-variety-products-js.js after source updates.\nexport const northEastVarietyProducts = ${JSON.stringify(products, null, 2)};\n\nexport default northEastVarietyProducts;\n`,
  'utf8',
);

console.log(JSON.stringify({ output: outputPath, products: products.length }, null, 2));
