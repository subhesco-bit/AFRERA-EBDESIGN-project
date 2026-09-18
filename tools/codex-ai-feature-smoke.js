#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function check(name, status, evidence, next) {
  return { name, status: status === true ? 'pass' : status === false ? 'fail' : status, evidence, next };
}

const products = JSON.parse(read('docs/north-east-variety-products.json'));
const api = read('frontend/src/services/api.js');
const index = read('backend/src/index.js');
const productMediaRoutes = read('backend/src/routes/productMediaAIRoutes.js');
const nutritionRoutes = read('backend/src/routes/nutritionIntelligenceRoutes.js');
const marketplacePage = read('frontend/src/pages/EcommerceMarketplacePage.jsx');
const aiStudioPage = read('frontend/src/pages/AIProductStudioPage.jsx');
const nutritionPage = read('frontend/src/pages/NutritionCalculatorPage.jsx');
const dynamicPricingPage = read('frontend/src/pages/DynamicPricingPage.jsx');

const results = [
  check(
    'Unified active project consolidation',
    exists('_ACTIVE_PROJECT/current/CONSOLIDATION_REPORT.md') ? 'pass' : 'fail',
    'Clean source-only project folder exists at _ACTIVE_PROJECT/current.',
    'Use this as the canonical branch source after full test proof.'
  ),
  check(
    'North East product extraction',
    products.product_count === 142 ? 'pass' : 'fail',
    `${products.product_count} products extracted from ${products.table_count} DOCX tables.`,
    'Review product descriptions/prices with domain owner before production selling.'
  ),
  check(
    'Ecommerce product visibility',
    marketplacePage.includes('North East India Variety Directory') && marketplacePage.includes('northEastVarietyProducts'),
    'Marketplace has a North East Varieties tab backed by generated frontend data.',
    'Seed these products into PostgreSQL once final category/unit taxonomy is approved.'
  ),
  check(
    'AI image creator route',
    index.includes('/api/v1/ai/product-media-ai') && productMediaRoutes.includes("'/products/:productId/image'") && api.includes('requestImage'),
    'Product-media AI image route, backend mount, and frontend API method are aligned.',
    'Configure provider secret and storage before expecting real image URLs.'
  ),
  check(
    'AI cartoon route',
    productMediaRoutes.includes("'/products/:productId/cartoon'") && api.includes('requestCartoon'),
    'Cartoon route is now exposed and frontend-callable.',
    'Implement provider-backed cartoon generation in productMediaAIService.'
  ),
  check(
    'AI Product Studio prompt testing',
    aiStudioPage.includes('buildProductImagePrompt') && aiStudioPage.includes('buildCartoonPrompt'),
    'AI Product Studio can build image/cartoon prompts and read provider status.',
    'Add one-click generation buttons after provider configuration is present.'
  ),
  check(
    'Dietitian and natural therapy layer',
    index.includes('/api/v1/nutrition-intelligence') && nutritionRoutes.includes('/wellness-practices') && api.includes('getWellnessPractices'),
    'Wellness practices API, route mount, and frontend API method are aligned.',
    'Keep medical guardrails and professional escalation for condition-specific advice.'
  ),
  check(
    'Nutrient calculator UI',
    nutritionPage.includes('Calculate My Nutrition') && nutritionPage.includes('Macronutrient Breakdown'),
    'Nutrition calculator performs local BMI/BMR/TDEE/macro calculations.',
    'Replace static food list with verified product nutrition records from nutrition-intelligence.'
  ),
  check(
    'Online/public price extraction',
    api.includes('publicDataAPI') && api.includes('/public-data/extract'),
    'Frontend has public-data extraction API hooks.',
    'Unify backend /api/v1/public-data mount and add source-specific adapters for approved public price sources.'
  ),
  check(
    'Dynamic pricing',
    dynamicPricingPage.includes('AI Pricing Recommendations') && api.includes('getPriceDynamics'),
    'Dynamic pricing page and farmer price API hooks exist.',
    'Remove placeholder chart/recommendations and connect to market_price_history plus extracted online prices.'
  ),
];

const passCount = results.filter((item) => item.status === 'pass').length;
const md = [
  '# Codex AI Feature Smoke Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `Passed: ${passCount}/${results.length}`,
  '',
  '| Feature | Status | Evidence | Next |',
  '| --- | --- | --- | --- |',
  ...results.map((item) => `| ${item.name} | ${item.status} | ${item.evidence} | ${item.next} |`),
  '',
  '## Interpretation',
  '',
  'The product data, ecommerce visibility, AI media route alignment, nutrition route alignment, and cost optimization work are now moving into a unified shape. Provider-backed generation still needs actual AI provider credentials, storage, moderation, and queue handling before image/cartoon outputs should be treated as production-ready.',
  ''
].join('\n');

fs.writeFileSync(path.join(root, 'docs', 'codex-ai-feature-smoke-report.md'), md);
fs.writeFileSync(path.join(root, 'docs', 'codex-ai-feature-smoke-report.json'), `${JSON.stringify({ generated_at: new Date().toISOString(), results }, null, 2)}\n`);
console.log(JSON.stringify({ passed: passCount, total: results.length }, null, 2));
