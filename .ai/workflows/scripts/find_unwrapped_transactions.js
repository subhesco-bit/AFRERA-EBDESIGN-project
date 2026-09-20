/**
 * find_unwrapped_transactions.js
 * 
 * Scans backend services for multi-statement writes that should be wrapped in
 * transactions per directive PART 8.3 (money, identity, sync, lifecycle, other).
 * 
 * Pattern: multiple .execute() / .query() / .run() calls in sequence without
 * a withTransaction() wrapper or explicit BEGIN/COMMIT.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../../backend');
const SRC = path.join(ROOT, 'src');

const results = {
  byCategory: {
    money: [],
    identity: [],
    sync: [],
    lifecycle: [],
    other: []
  },
  byFile: {},
  total: 0
};

function getCategory(fileContent, filename) {
  const name = filename.toLowerCase();
  if (name.includes('payment') || name.includes('financial') || name.includes('billing')) return 'money';
  if (name.includes('auth') || name.includes('user') || name.includes('account') || name.includes('identity')) return 'identity';
  if (name.includes('sync') || name.includes('integration') || name.includes('mirror')) return 'sync';
  if (name.includes('order') || name.includes('status') || name.includes('lifecycle') || name.includes('workflow')) return 'lifecycle';
  return 'other';
}

function walkDir(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, cb);
    else if (entry.name.endsWith('.js')) cb(full);
  }
}

walkDir(SRC, (file) => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Skip if already wrapped
  if (content.includes('withTransaction(') || content.includes('BEGIN') || content.includes('COMMIT')) {
    return;
  }
  
  // Pattern: look for sequences of query/execute calls
  // Simple heuristic: 2+ await.*\.query\(\|execute\(\|run\(  in the same function scope
  const queryPattern = /\.query\(|\.execute\(|\.run\(/g;
  const queryCount = (content.match(queryPattern) || []).length;
  
  if (queryCount >= 2) {
    const rel = path.relative(ROOT, file);
    const category = getCategory(content, path.basename(file));
    
    results.byCategory[category].push({
      file: rel,
      queryCount: queryCount
    });
    
    if (!results.byFile[rel]) {
      results.byFile[rel] = { queries: queryCount, category };
    }
    
    results.total++;
  }
});

console.log('Found potential unwrapped transaction sites: ' + results.total);
Object.entries(results.byCategory).forEach(([cat, files]) => {
  if (files.length > 0) {
    console.log(`  ${cat}: ${files.length}`);
  }
});

fs.writeFileSync(
  path.join(__dirname, 'unwrapped_transactions_scan.json'),
  JSON.stringify(results, null, 2)
);

console.log('Results saved to unwrapped_transactions_scan.json');
