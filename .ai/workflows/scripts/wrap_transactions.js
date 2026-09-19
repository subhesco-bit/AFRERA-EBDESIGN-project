/**
 * wrap_transactions.js
 *
 * Phase 2 of BR-08: Apply withTransaction() wrappers to identified functions.
 * 
 * For each high-priority function in transaction_analysis.json:
 * 1. Load the source file
 * 2. Find the function and extract its body
 * 3. Wrap the body in withTransaction(async () => { ... })
 * 4. Write back to file
 * 5. Report results (wrapped/failed/skipped)
 */

const fs = require('fs');
const path = require('path');

const analysisFile = '.ai/workflows/scripts/transaction_analysis.json';
const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

const ROOT = path.join(__dirname, '../../../backend');
const results = {
  wrapped: [],
  failed: [],
  skipped: [],
  total: 0
};

// Only wrap high-priority (money/identity/sync/lifecycle)
const highPriority = analysis.needsWrapping || [];

console.log(`Processing ${highPriority.length} high-priority files...`);

for (const item of highPriority) {
  const rel = item.file;
  const fullPath = path.join(ROOT, rel);
  
  if (!fs.existsSync(fullPath)) {
    results.skipped.push({ file: rel, reason: 'file not found' });
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let wrapped = false;
  
  // For each function in this file
  for (const func of item.funcs) {
    const funcName = func.name;
    const startLine = func.line;
    
    // Simple pattern: find "async <name>(...) {" and extract until matching "}"
    const lines = content.split('\n');
    
    // Find the function start
    let funcStartIdx = -1;
    for (let i = startLine - 2; i < Math.min(startLine + 10, lines.length); i++) {
      if (lines[i] && lines[i].includes(`async ${funcName}`) && lines[i].includes('(')) {
        funcStartIdx = i;
        break;
      }
    }
    
    if (funcStartIdx === -1) {
      results.failed.push({ file: rel, func: funcName, reason: 'function not found at expected line' });
      continue;
    }
    
    // Already wrapped?
    if (lines[funcStartIdx].includes('withTransaction') || 
        (funcStartIdx + 1 < lines.length && lines[funcStartIdx + 1].includes('withTransaction'))) {
      results.skipped.push({ file: rel, func: funcName, reason: 'already wrapped' });
      continue;
    }
    
    // Find opening brace of function body
    let braceStart = funcStartIdx;
    while (braceStart < lines.length && !lines[braceStart].includes('{')) {
      braceStart++;
    }
    
    if (braceStart >= lines.length) {
      results.failed.push({ file: rel, func: funcName, reason: 'could not find opening brace' });
      continue;
    }
    
    // Find closing brace (simplified - count braces)
    let braceDepth = 0;
    let braceEnd = braceStart;
    for (let i = braceStart; i < lines.length; i++) {
      for (const char of lines[i]) {
        if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
      }
      if (braceDepth === 0) {
        braceEnd = i;
        break;
      }
    }
    
    if (braceEnd === braceStart) {
      results.failed.push({ file: rel, func: funcName, reason: 'could not find closing brace' });
      continue;
    }
    
    // Extract function body (everything between first { and last })
    const bodyStart = lines[braceStart].indexOf('{') + 1;
    const bodyEnd = lines[braceEnd].lastIndexOf('}');
    
    // Reconstruct with withTransaction wrapper
    const beforeFunc = lines.slice(0, braceStart + 1).join('\n');
    const funcHeader = lines[braceStart].substring(0, bodyStart);
    
    const bodyLines = [];
    bodyLines.push(...lines.slice(braceStart + 1, braceEnd));
    if (bodyEnd > 0) {
      bodyLines[bodyLines.length - 1] = bodyLines[bodyLines.length - 1].substring(0, bodyEnd - 1);
    }
    
    const bodyIndent = bodyLines[0] ? bodyLines[0].match(/^\s*/)[0] : '  ';
    const wrappedBody = bodyLines.map(line => line ? bodyIndent + line : line).join('\n');
    
    const newFunc = `${funcHeader}\n${bodyIndent}return withTransaction(async () => {\n${wrappedBody}\n${bodyIndent}});\n`;
    
    const afterFunc = lines.slice(braceEnd).join('\n');
    
    content = beforeFunc + newFunc + afterFunc;
    wrapped = true;
    results.wrapped.push({ file: rel, func: funcName });
    results.total++;
  }
  
  if (wrapped) {
    fs.writeFileSync(fullPath, content);
  }
}

console.log(`\nResults:`);
console.log(`  Wrapped: ${results.wrapped.length}`);
console.log(`  Failed: ${results.failed.length}`);
console.log(`  Skipped: ${results.skipped.length}`);
console.log(`  Total: ${results.total}`);

if (results.failed.length > 0) {
  console.log(`\nFailed (need manual review):`);
  results.failed.forEach(f => console.log(`  ${f.file} :: ${f.func}: ${f.reason}`));
}

fs.writeFileSync(
  '.ai/workflows/scripts/wrap_results.json',
  JSON.stringify(results, null, 2)
);

console.log('\nResults saved to wrap_results.json');
process.exit(results.failed.length > 0 ? 1 : 0);
