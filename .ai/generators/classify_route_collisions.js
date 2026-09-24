// Batch-classify the 44 route-basename collisions logged by DynamicRouteLoader.
// For each pair, diff content and bucket as identical / near-identical / different
// so the fix can be applied in bulk instead of one-by-one manual reads.
'use strict';
const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '..', '..', 'backend', 'src', 'routes');
const pairsRaw = fs.readFileSync(path.join(__dirname, '..', '..', 'tmp_collisions.txt'), 'utf8')
  .trim().split('\n').filter(Boolean);

function normalize(src) {
  return src.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

const results = [];
for (const line of pairsRaw) {
  const [a, b] = line.split(' | ').map((s) => s.trim());
  const pathA = path.join(routesDir, a);
  const pathB = path.join(routesDir, b);
  let statusA = fs.existsSync(pathA);
  let statusB = fs.existsSync(pathB);
  if (!statusA || !statusB) {
    results.push({ a, b, verdict: 'MISSING', note: `existsA=${statusA} existsB=${statusB}` });
    continue;
  }
  const srcA = fs.readFileSync(pathA, 'utf8');
  const srcB = fs.readFileSync(pathB, 'utf8');
  const sizeA = srcA.length;
  const sizeB = srcB.length;
  if (normalize(srcA) === normalize(srcB)) {
    results.push({ a, b, verdict: 'IDENTICAL', sizeA, sizeB });
    continue;
  }
  const sizeDiffPct = Math.abs(sizeA - sizeB) / Math.max(sizeA, sizeB, 1) * 100;
  results.push({
    a, b,
    verdict: sizeDiffPct < 15 ? 'NEAR_IDENTICAL' : 'DIFFERENT',
    sizeA, sizeB, sizeDiffPct: Math.round(sizeDiffPct),
  });
}

console.log(JSON.stringify(results, null, 2));
const summary = results.reduce((acc, r) => { acc[r.verdict] = (acc[r.verdict] || 0) + 1; return acc; }, {});
console.error('SUMMARY:', JSON.stringify(summary));
